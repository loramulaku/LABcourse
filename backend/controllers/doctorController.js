const db = require("../db");

// POST /api/doctors
// Creates a user with role 'doctor' and doctor profile linked by user_id
const createDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    speciality,
    degree,
    experience,
    about,
    fees,
    address_line1,
    address_line2,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password required" });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // 1) create user with role doctor
    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash(password, 10);

    const insertUserSql =
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'doctor')";

    db.query(insertUserSql, [name, email, hashed], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const userId = result.insertId;

      // 2) insert into doctors
      const insertDoctorSql = `
        INSERT INTO doctors (
          user_id, image, speciality, degree, experience, about, fees, address_line1, address_line2, available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        userId,
        imagePath,
        speciality || null,
        degree || null,
        experience || null,
        about || null,
        fees || null,
        address_line1 || null,
        address_line2 || null,
        1,
      ];

      db.query(insertDoctorSql, params, (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ message: "Doctor created", user_id: userId });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/doctors
// Returns minimal list for frontend cards
const getDoctors = (req, res) => {
  const sql = `
    SELECT 
      d.id,
      u.name,
      d.image,
      d.speciality,
      d.available
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// GET /api/doctors/:id
const getDoctorById = (req, res) => {
  const sql = `
    SELECT 
      d.id,
      u.name,
      u.email,
      d.image,
      d.speciality,
      d.degree,
      d.experience,
      d.about,
      d.fees,
      d.address_line1,
      d.address_line2,
      d.available
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(results[0]);
  });
};

// PUT /api/doctors/:id (admin)
const updateDoctor = (req, res) => {
  const id = req.params.id;
  const {
    name,
    email,
    speciality,
    degree,
    experience,
    about,
    fees,
    address_line1,
    address_line2,
    available,
  } = req.body;

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  // Update users (name,email) and doctors
  const updateUserSql =
    "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = (SELECT user_id FROM doctors WHERE id = ?)";
  db.query(updateUserSql, [name || null, email || null, id], (e1) => {
    if (e1) return res.status(500).json({ error: e1.message });

    const updateDoctorSql = `
      UPDATE doctors SET
        image = COALESCE(?, image),
        speciality = COALESCE(?, speciality),
        degree = COALESCE(?, degree),
        experience = COALESCE(?, experience),
        about = COALESCE(?, about),
        fees = COALESCE(?, fees),
        address_line1 = COALESCE(?, address_line1),
        address_line2 = COALESCE(?, address_line2),
        available = COALESCE(?, available)
      WHERE id = ?
    `;
    const params = [
      imagePath,
      speciality || null,
      degree || null,
      experience || null,
      about || null,
      fees || null,
      address_line1 || null,
      address_line2 || null,
      typeof available !== "undefined" ? available : null,
      id,
    ];
    db.query(updateDoctorSql, params, (e2) => {
      if (e2) return res.status(500).json({ error: e2.message });
      return res.json({ message: "Doctor updated" });
    });
  });
};

// DELETE /api/doctors/:id (admin)
const deleteDoctor = (req, res) => {
  const id = req.params.id;
  // ON DELETE CASCADE on users(user_id) requires deleting user; here we delete doctor and user
  const selectUserSql = "SELECT user_id FROM doctors WHERE id = ?";
  db.query(selectUserSql, [id], (e1, rows) => {
    if (e1) return res.status(500).json({ error: e1.message });
    if (!rows || rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    const userId = rows[0].user_id;
    db.query("DELETE FROM users WHERE id = ?", [userId], (e2) => {
      if (e2) return res.status(500).json({ error: e2.message });
      return res.json({ message: "Doctor deleted" });
    });
  });
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
