// models/Laboratory.js
const db = require('../db');

class Laboratory {
    static async getAll() {
        const [rows] = await db.promise().query(
            `SELECT l.id,
                    l.user_id,
                    u.name AS name,
                    u.email AS login_email,
                    l.email AS contact_email,
                    l.address,
                    l.phone,
                    l.description,
                    l.working_hours,
                    l.created_at,
                    l.updated_at
             FROM laboratories l
             JOIN users u ON u.id = l.user_id
             WHERE u.role = 'lab'`
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.promise().query(
            `SELECT l.id,
                    l.user_id,
                    u.name AS name,
                    u.email AS login_email,
                    l.email AS contact_email,
                    l.address,
                    l.phone,
                    l.description,
                    l.working_hours,
                    l.created_at,
                    l.updated_at
             FROM laboratories l
             JOIN users u ON u.id = l.user_id
             WHERE l.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async create(data) {
        // Prefer route-level transaction for creating user + laboratory.
        // Kept for compatibility if used elsewhere: expects user_id provided.
        const { user_id, address, phone, contact_email, description, working_hours } = data;
        const [result] = await db.promise().query(
            'INSERT INTO laboratories (user_id, address, phone, email, description, working_hours) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, address, phone, contact_email, description, working_hours]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { address, phone, contact_email, description, working_hours } = data;
        await db.promise().query(
            'UPDATE laboratories SET address=?, phone=?, email=?, description=?, working_hours=? WHERE id=?',
            [address, phone, contact_email, description, working_hours, id]
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

    // Check if a specific date/time is available (reserve exact 30-minute slot only)
    static async isTimeSlotAvailable(labId, appointmentDate) {
        console.log('Laboratory.isTimeSlotAvailable called with:', { labId, appointmentDate });

        try {
            // Normalize to MySQL 'YYYY-MM-DD HH:MM:SS' without timezone conversion
            const normalized = typeof appointmentDate === 'string'
                ? (appointmentDate.includes('T') ? appointmentDate.replace('T', ' ') : appointmentDate)
                : appointmentDate;
            const mysqlDateTime = /\d{2}:\d{2}$/.test(normalized) ? `${normalized}:00` : normalized;

            const [rows] = await db.promise().query(
                `SELECT COUNT(*) as count FROM patient_analyses 
                 WHERE laboratory_id = ? 
                 AND status != "cancelled"
                 AND appointment_date = ?`,
                [labId, mysqlDateTime]
            );
            const available = rows[0].count === 0;
            console.log('Time slot available:', available);
            return available;
        } catch (error) {
            console.error('Error in isTimeSlotAvailable:', error);
            throw error;
        }
    }

    // Get all booked time slots for a specific date (no margins)
    static async getTimeSlotsWithMargins(labId, date) {
        console.log(`Getting booked time slots for lab ${labId} on date ${date}`);
        const [rows] = await db.promise().query(
            `SELECT appointment_date FROM patient_analyses 
             WHERE laboratory_id = ? 
             AND DATE(appointment_date) = ?
             AND status != "cancelled"
             ORDER BY appointment_date`,
            [labId, date]
        );
        const booked = rows.map(row => {
            // Keep as local 'YYYY-MM-DD HH:MM:SS'
            const d = new Date(row.appointment_date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hour = String(d.getHours()).padStart(2, '0');
            const minute = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hour}:${minute}:00`;
        });
        console.log(`Booked slots (exact only): ${booked.length}`);
        return booked;
    }

    // Check if a specific time slot is available (exact 30-minute slot only)
    static async isTimeSlotAvailableForDisplay(labId, slotLocal) {
        try {
            // Expect 'YYYY-MM-DDTHH:MM' or 'YYYY-MM-DD HH:MM(:SS)'
            const normalized = typeof slotLocal === 'string'
                ? (slotLocal.includes('T') ? slotLocal.replace('T', ' ') : slotLocal)
                : slotLocal;
            const mysqlDateTime = /\d{2}:\d{2}$/.test(normalized) ? `${normalized}:00` : normalized;
            const [rows] = await db.promise().query(
                `SELECT COUNT(*) as count FROM patient_analyses 
                 WHERE laboratory_id = ? 
                 AND status != "cancelled"
                 AND appointment_date = ?`,
                [labId, mysqlDateTime]
            );
            return rows[0].count === 0;
        } catch (error) {
            console.error('Error in isTimeSlotAvailableForDisplay:', error);
            return false; // If there's an error, consider it unavailable
        }
    }

    // Check if a date is fully booked (all time slots booked)
    static async isDateFullyBooked(labId, date) {
        const bookedSlots = await this.getTimeSlotsWithMargins(labId, date);
        
        // Generate all possible 30-minute slots for the day (8 AM to 6 PM)
        const allPossibleSlots = [];
        const startHour = 8;
        const endHour = 18;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                allPossibleSlots.push(`${date} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
            }
        }
        
        // Check if all slots are booked exactly
        return allPossibleSlots.every(slot => bookedSlots.includes(slot));
    }
}

module.exports = Laboratory;