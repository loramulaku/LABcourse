// models/Laboratory.js
const db = require('../db');

class Laboratory {
    static async getAll() {
        const [rows] = await db.promise().query('SELECT * FROM laboratories');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.promise().query('SELECT * FROM laboratories WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { name, address, phone, email, description, working_hours } = data;
        const [result] = await db.promise().query(
            'INSERT INTO laboratories (name, address, phone, email, description, working_hours) VALUES (?, ?, ?, ?, ?, ?)',
            [name, address, phone, email, description, working_hours]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { name, address, phone, email, description, working_hours } = data;
        await db.promise().query(
            'UPDATE laboratories SET name=?, address=?, phone=?, email=?, description=?, working_hours=? WHERE id=?',
            [name, address, phone, email, description, working_hours, id]
        );
    }

    static async delete(id) {
        await db.promise().query('DELETE FROM laboratories WHERE id = ?', [id]);
    }

    // Get booked time slots for a laboratory
    static async getBookedTimeSlots(labId) {
        const [rows] = await db.promise().query(
            'SELECT appointment_date FROM patient_analyses WHERE laboratory_id = ? AND status != "cancelled" ORDER BY appointment_date',
            [labId]
        );
        return rows.map(row => row.appointment_date);
    }

    // Get booked hours for a specific date
    static async getBookedHoursForDate(labId, date) {
        const [rows] = await db.promise().query(
            'SELECT TIME(appointment_date) as booked_time FROM patient_analyses WHERE laboratory_id = ? AND DATE(appointment_date) = ? AND status != "cancelled"',
            [labId, date]
        );
        return rows.map(row => row.booked_time);
    }

    // Check if a specific date/time is available
    static async isTimeSlotAvailable(labId, appointmentDate) {
        const [rows] = await db.promise().query(
            'SELECT COUNT(*) as count FROM patient_analyses WHERE laboratory_id = ? AND appointment_date = ? AND status != "cancelled"',
            [labId, appointmentDate]
        );
        return rows[0].count === 0;
    }
}

module.exports = Laboratory;