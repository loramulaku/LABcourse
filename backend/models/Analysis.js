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
        
        // Expect local datetime string (YYYY-MM-DDTHH:MM:SS), store exactly as provided
        const mysqlDateTime = (() => {
            if (typeof appointment_date === 'string') {
                // Ensure we have seconds, then convert to MySQL format
                const hasSeconds = appointment_date.match(/T\d{2}:\d{2}:\d{2}$/);
                const normalized = hasSeconds ? appointment_date : `${appointment_date}:00`;
                return normalized.replace('T', ' ');
            }
            // If somehow a Date object is passed, convert it carefully
            const d = new Date(appointment_date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hour = String(d.getHours()).padStart(2, '0');
            const minute = String(d.getMinutes()).padStart(2, '0');
            const second = String(d.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        })();
        console.log('Converted datetime for MySQL:', mysqlDateTime);
        
        // Check if the time slot is available
        const Laboratory = require('./Laboratory');
        const isAvailable = await Laboratory.isTimeSlotAvailable(laboratory_id, mysqlDateTime);
        
        console.log('Time slot available:', isAvailable);
        
        if (!isAvailable) {
            throw new Error('TIME_SLOT_BOOKED');
        }
        
        console.log('Inserting analysis request into database...');
        
        // Use a transaction to prevent race conditions
        const connection = await db.promise().getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Double-check availability within the transaction
            const [checkRows] = await connection.query(
                `SELECT COUNT(*) as count FROM patient_analyses 
                 WHERE laboratory_id = ? 
                 AND status != "cancelled"
                 AND appointment_date = ?`,
                [laboratory_id, mysqlDateTime]
            );
            
            if (checkRows[0].count > 0) {
                await connection.rollback();
                throw new Error('TIME_SLOT_BOOKED');
            }
            
            // Insert the new request
            const [result] = await connection.query(
                'INSERT INTO patient_analyses (user_id, analysis_type_id, laboratory_id, appointment_date, notes) VALUES (?, ?, ?, ?, ?)',
                [user_id, analysis_type_id, laboratory_id, mysqlDateTime, notes]
            );
            
            await connection.commit();
            console.log('Analysis request created with ID:', result.insertId);
            return result.insertId;
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getPatientAnalyses(userId) {
        const [rows] = await db.promise().query(
            `SELECT 
                pa.id,
                pa.user_id,
                pa.analysis_type_id,
                pa.laboratory_id,
                pa.result,
                pa.status,
                DATE_FORMAT(pa.appointment_date, '%Y-%m-%d %H:%i:%s') AS appointment_date,
                DATE_FORMAT(pa.completion_date, '%Y-%m-%d %H:%i:%s') AS completion_date,
                pa.notes,
                DATE_FORMAT(pa.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                DATE_FORMAT(pa.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
                at.name AS analysis_name,
                u.name AS laboratory_name
             FROM patient_analyses pa
             JOIN analysis_types at ON pa.analysis_type_id = at.id
             JOIN laboratories l ON pa.laboratory_id = l.id
             JOIN users u ON u.id = l.user_id
             WHERE pa.user_id = ?
             ORDER BY pa.created_at DESC`,
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