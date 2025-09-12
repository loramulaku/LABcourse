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
}

module.exports = Laboratory;