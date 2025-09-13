// models/Analysis.js
const db = require('../db');

class Analysis {
    static async getAllTypes() {
        const [rows] = await db.promise().query('SELECT * FROM analysis_types');
        return rows;
    }

    static async getTypesByLaboratory(labId) {
        const [rows] = await db.promise().query('SELECT * FROM analysis_types WHERE laboratory_id = ?', [labId]);
        return rows;
    }

    static async createRequest(data) {
        console.log('Analysis.createRequest called with data:', data);
        
        const { user_id, analysis_type_id, laboratory_id, appointment_date, notes } = data;
        
        // Validate required fields
        if (!user_id || !analysis_type_id || !laboratory_id || !appointment_date) {
            throw new Error('Missing required fields: user_id, analysis_type_id, laboratory_id, appointment_date');
        }
        
        console.log('Validating time slot availability...');
        
        // Check if the time slot is available
        const Laboratory = require('./Laboratory');
        const isAvailable = await Laboratory.isTimeSlotAvailable(laboratory_id, appointment_date);
        
        console.log('Time slot available:', isAvailable);
        
        if (!isAvailable) {
            throw new Error('TIME_SLOT_BOOKED');
        }
        
        console.log('Inserting analysis request into database...');
        
        // Convert ISO datetime to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        const mysqlDateTime = new Date(appointment_date).toISOString().slice(0, 19).replace('T', ' ');
        console.log('Converted datetime for MySQL:', mysqlDateTime);
        
        const [result] = await db.promise().query(
            'INSERT INTO patient_analyses (user_id, analysis_type_id, laboratory_id, appointment_date, notes) VALUES (?, ?, ?, ?, ?)',
            [user_id, analysis_type_id, laboratory_id, mysqlDateTime, notes]
        );
        
        console.log('Analysis request created with ID:', result.insertId);
        return result.insertId;
    }

    static async getPatientAnalyses(userId) {
        const [rows] = await db.promise().query(
            `SELECT pa.*, at.name as analysis_name, l.name as laboratory_name 
             FROM patient_analyses pa 
             JOIN analysis_types at ON pa.analysis_type_id = at.id 
             JOIN laboratories l ON pa.laboratory_id = l.id 
             WHERE pa.user_id = ?`,
            [userId]
        );
        return rows;
    }

    static async updateResult(id, result, status = 'completed') {
        await db.promise().query(
            'UPDATE patient_analyses SET result=?, status=?, completion_date=NOW() WHERE id=?',
            [result, status, id]
        );
    }
}

module.exports = Analysis;