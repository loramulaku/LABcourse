// models/Therapy.js
const db = require('../db');

class Therapy {
    static async getAll() {
        const [rows] = await db.promise().query(
            `SELECT t.id,
                    t.appointment_id,
                    t.doctor_id,
                    t.patient_id,
                    t.therapy_text,
                    t.medications,
                    t.dosage,
                    t.frequency,
                    t.duration,
                    t.instructions,
                    t.follow_up_date,
                    t.status,
                    t.created_at,
                    t.updated_at,
                    u.name as patient_name,
                    u.email as patient_email,
                    d.speciality as doctor_speciality,
                    a.scheduled_for,
                    a.status as appointment_status
             FROM therapies t
             JOIN users u ON u.id = t.patient_id
             JOIN doctors d ON d.id = t.doctor_id
             JOIN appointments a ON a.id = t.appointment_id`
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.promise().query(
            `SELECT t.id,
                    t.appointment_id,
                    t.doctor_id,
                    t.patient_id,
                    t.therapy_text,
                    t.medications,
                    t.dosage,
                    t.frequency,
                    t.duration,
                    t.instructions,
                    t.follow_up_date,
                    t.status,
                    t.created_at,
                    t.updated_at,
                    u.name as patient_name,
                    u.email as patient_email,
                    d.speciality as doctor_speciality,
                    a.scheduled_for,
                    a.status as appointment_status
             FROM therapies t
             JOIN users u ON u.id = t.patient_id
             JOIN doctors d ON d.id = t.doctor_id
             JOIN appointments a ON a.id = t.appointment_id
             WHERE t.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getByPatientId(patientId) {
        const [rows] = await db.promise().query(
            `SELECT t.id,
                    t.appointment_id,
                    t.doctor_id,
                    t.patient_id,
                    t.therapy_text,
                    t.medications,
                    t.dosage,
                    t.frequency,
                    t.duration,
                    t.instructions,
                    t.follow_up_date,
                    t.status,
                    t.created_at,
                    t.updated_at,
                    d.speciality as doctor_speciality,
                    a.scheduled_for,
                    a.status as appointment_status
             FROM therapies t
             JOIN doctors d ON d.id = t.doctor_id
             JOIN appointments a ON a.id = t.appointment_id
             WHERE t.patient_id = ?
             ORDER BY t.created_at DESC`,
            [patientId]
        );
        return rows;
    }

    static async getByDoctorId(doctorId) {
        const [rows] = await db.promise().query(
            `SELECT t.id,
                    t.appointment_id,
                    t.doctor_id,
                    t.patient_id,
                    t.therapy_text,
                    t.medications,
                    t.dosage,
                    t.frequency,
                    t.duration,
                    t.instructions,
                    t.follow_up_date,
                    t.status,
                    t.created_at,
                    t.updated_at,
                    u.name as patient_name,
                    u.email as patient_email,
                    a.scheduled_for,
                    a.status as appointment_status
             FROM therapies t
             JOIN users u ON u.id = t.patient_id
             JOIN appointments a ON a.id = t.appointment_id
             WHERE t.doctor_id = ?
             ORDER BY t.created_at DESC`,
            [doctorId]
        );
        return rows;
    }

    static async create(data) {
        const { 
            appointment_id, 
            doctor_id, 
            patient_id, 
            therapy_text, 
            medications, 
            dosage, 
            frequency, 
            duration, 
            instructions, 
            follow_up_date,
            therapy_type,
            start_date,
            end_date,
            priority,
            patient_notes,
            doctor_notes
        } = data;
        
        const [result] = await db.promise().query(
            `INSERT INTO therapies (
                appointment_id, doctor_id, patient_id, therapy_text, 
                medications, dosage, frequency, duration, instructions, 
                follow_up_date, therapy_type, start_date, end_date, 
                priority, patient_notes, doctor_notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [
                appointment_id, doctor_id, patient_id, therapy_text,
                medications, dosage, frequency, duration, instructions,
                follow_up_date, therapy_type, start_date, end_date,
                priority, patient_notes, doctor_notes
            ]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { 
            therapy_text, 
            medications, 
            dosage, 
            frequency, 
            duration, 
            instructions, 
            follow_up_date, 
            therapy_type,
            start_date,
            end_date,
            priority,
            patient_notes,
            doctor_notes,
            status 
        } = data;
        
        await db.promise().query(
            `UPDATE therapies SET 
                therapy_text=?, medications=?, dosage=?, frequency=?, 
                duration=?, instructions=?, follow_up_date=?, therapy_type=?,
                start_date=?, end_date=?, priority=?, patient_notes=?,
                doctor_notes=?, status=?
             WHERE id=?`,
            [
                therapy_text, medications, dosage, frequency,
                duration, instructions, follow_up_date, therapy_type,
                start_date, end_date, priority, patient_notes,
                doctor_notes, status, id
            ]
        );
    }

    static async delete(id) {
        await db.promise().query('DELETE FROM therapies WHERE id = ?', [id]);
    }

    // Get therapy statistics for doctor dashboard
    static async getDoctorStats(doctorId) {
        const [rows] = await db.promise().query(
            `SELECT 
                COUNT(*) as total_therapies,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_therapies,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_therapies,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_therapies
             FROM therapies 
             WHERE doctor_id = ?`,
            [doctorId]
        );
        return rows[0];
    }

    // Get therapy statistics for patient
    static async getPatientStats(patientId) {
        const [rows] = await db.promise().query(
            `SELECT 
                COUNT(*) as total_therapies,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_therapies,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_therapies
             FROM therapies 
             WHERE patient_id = ?`,
            [patientId]
        );
        return rows[0];
    }

    // Get upcoming follow-ups for doctor
    static async getUpcomingFollowUps(doctorId) {
        const [rows] = await db.promise().query(
            `SELECT t.id, t.follow_up_date, u.name as patient_name, t.therapy_text
             FROM therapies t
             JOIN users u ON u.id = t.patient_id
             WHERE t.doctor_id = ? 
             AND t.follow_up_date > NOW() 
             AND t.status = 'active'
             ORDER BY t.follow_up_date ASC`,
            [doctorId]
        );
        return rows;
    }

    // Get upcoming follow-ups for patient
    static async getPatientUpcomingFollowUps(patientId) {
        const [rows] = await db.promise().query(
            `SELECT t.id, t.follow_up_date, d.speciality as doctor_speciality, t.therapy_text
             FROM therapies t
             JOIN doctors d ON d.id = t.doctor_id
             WHERE t.patient_id = ? 
             AND t.follow_up_date > NOW() 
             AND t.status = 'active'
             ORDER BY t.follow_up_date ASC`,
            [patientId]
        );
        return rows;
    }

    // Get therapies by status for doctor dashboard
    static async getTherapiesByStatus(doctorId, status) {
        const [rows] = await db.promise().query(
            `SELECT t.id, t.therapy_type, t.start_date, t.end_date, t.priority,
                    t.status, t.created_at, t.updated_at,
                    u.name as patient_name, u.email as patient_email,
                    a.scheduled_for, a.status as appointment_status
             FROM therapies t
             JOIN users u ON u.id = t.patient_id
             JOIN appointments a ON a.id = t.appointment_id
             WHERE t.doctor_id = ? AND t.status = ?
             ORDER BY t.created_at DESC`,
            [doctorId, status]
        );
        return rows;
    }

    // Get therapy calendar data for doctor
    static async getTherapyCalendar(doctorId, startDate, endDate) {
        const [rows] = await db.promise().query(
            `SELECT t.id, t.start_date, t.follow_up_date, t.status, t.therapy_type,
                    u.name as patient_name, t.priority
             FROM therapies t
             JOIN users u ON u.id = t.patient_id
             WHERE t.doctor_id = ? 
             AND (t.start_date BETWEEN ? AND ? OR t.follow_up_date BETWEEN ? AND ?)
             ORDER BY t.start_date ASC`,
            [doctorId, startDate, endDate, startDate, endDate]
        );
        return rows;
    }

    // Update therapy status
    static async updateStatus(id, status) {
        await db.promise().query(
            'UPDATE therapies SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
    }

    // Get therapy templates (common therapies)
    static async getTherapyTemplates() {
        return [
            {
                id: 1,
                name: "Common Cold Treatment",
                therapy_type: "Medication",
                medications: "Paracetamol, Ibuprofen",
                dosage: "500mg",
                frequency: "Every 6 hours",
                duration: "5-7 days",
                instructions: "Take with food, rest well, drink plenty of fluids"
            },
            {
                id: 2,
                name: "Hypertension Management",
                therapy_type: "Lifestyle + Medication",
                medications: "ACE Inhibitor",
                dosage: "10mg daily",
                frequency: "Once daily",
                duration: "Long-term",
                instructions: "Monitor blood pressure, reduce salt intake, regular exercise"
            },
            {
                id: 3,
                name: "Diabetes Type 2",
                therapy_type: "Medication + Diet",
                medications: "Metformin",
                dosage: "500mg",
                frequency: "Twice daily",
                duration: "Long-term",
                instructions: "Monitor blood sugar, follow diabetic diet, regular check-ups"
            }
        ];
    }
}

module.exports = Therapy;
