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

    // Check if a specific date/time is available with 30-minute margin
    static async isTimeSlotAvailable(labId, appointmentDate) {
        console.log('Laboratory.isTimeSlotAvailable called with:', { labId, appointmentDate });
        
        try {
            // Use the same logic as the display method for consistency
            const isAvailable = await this.isTimeSlotAvailableForDisplay(labId, appointmentDate);
            console.log('Time slot available:', isAvailable);
            return isAvailable;
        } catch (error) {
            console.error('Error in isTimeSlotAvailable:', error);
            throw error;
        }
    }

    // Get all time slots with 30-minute margins for a specific date
    static async getTimeSlotsWithMargins(labId, date) {
        console.log(`Getting time slots with margins for lab ${labId} on date ${date}`);
        
        const [rows] = await db.promise().query(
            `SELECT appointment_date FROM patient_analyses 
             WHERE laboratory_id = ? 
             AND DATE(appointment_date) = ?
             AND status != "cancelled"
             ORDER BY appointment_date`,
            [labId, date]
        );
        
        console.log(`Found ${rows.length} existing bookings for this date`);
        
        const bookedSlots = rows.map(row => new Date(row.appointment_date));
        const blockedSlots = new Set();
        
        // Add 30-minute margins around each booked slot
        bookedSlots.forEach(slot => {
            const thirtyMinutesBefore = new Date(slot.getTime() - 30 * 60 * 1000);
            const thirtyMinutesAfter = new Date(slot.getTime() + 30 * 60 * 1000);
            
            blockedSlots.add(thirtyMinutesBefore.toISOString());
            blockedSlots.add(slot.toISOString());
            blockedSlots.add(thirtyMinutesAfter.toISOString());
            
            console.log(`Blocked slots around ${slot.toISOString()}:`, {
                before: thirtyMinutesBefore.toISOString(),
                slot: slot.toISOString(),
                after: thirtyMinutesAfter.toISOString()
            });
        });
        
        const result = Array.from(blockedSlots);
        console.log(`Total blocked slots: ${result.length}`);
        return result;
    }

    // Check if a specific time slot is available (used by both frontend and backend)
    static async isTimeSlotAvailableForDisplay(labId, slotISO) {
        try {
            const appointmentDateTime = new Date(slotISO);
            const thirtyMinutesBefore = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
            const thirtyMinutesAfter = new Date(appointmentDateTime.getTime() + 30 * 60 * 1000);
            
            // Convert to MySQL datetime format
            const beforeMySQL = thirtyMinutesBefore.toISOString().slice(0, 19).replace('T', ' ');
            const afterMySQL = thirtyMinutesAfter.toISOString().slice(0, 19).replace('T', ' ');
            
            // Simple check: if any existing appointment falls within our 30-minute margin range, block this slot
            const [rows] = await db.promise().query(
                `SELECT COUNT(*) as count FROM patient_analyses 
                 WHERE laboratory_id = ? 
                 AND status != "cancelled"
                 AND appointment_date BETWEEN ? AND ?`,
                [labId, beforeMySQL, afterMySQL]
            );
            
            return rows[0].count === 0;
        } catch (error) {
            console.error('Error in isTimeSlotAvailableForDisplay:', error);
            return false; // If there's an error, consider it unavailable
        }
    }

    // Check if a date is fully booked (all time slots blocked)
    static async isDateFullyBooked(labId, date) {
        const timeSlots = await this.getTimeSlotsWithMargins(labId, date);
        
        // Generate all possible 30-minute slots for the day (8 AM to 6 PM)
        const allPossibleSlots = [];
        const startHour = 8;
        const endHour = 18;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const slotTime = new Date(date + `T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
                allPossibleSlots.push(slotTime.toISOString());
            }
        }
        
        // Check if all slots are blocked
        return allPossibleSlots.every(slot => timeSlots.includes(slot));
    }
}

module.exports = Laboratory;