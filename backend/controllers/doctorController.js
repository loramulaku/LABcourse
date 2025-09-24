const db = require("../db");

// POST /api/doctors
// Creates a user with role 'doctor' and doctor profile linked by user_id
const createDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    specialization,
    degree,
    experience_years,
    about,
    fees,
    address_line1,
    address_line2,
    available = true
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

      // 2) insert into doctors with new schema
      const insertDoctorSql = `
        INSERT INTO doctors (
          user_id, image, specialization, degree, experience_years, about, 
          consultation_fee, address_line1, address_line2, available, avatar_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        userId,
        imagePath,
        specialization || null,
        degree || null,
        experience_years || 0,
        about || null,
        fees || null,
        address_line1 || null,
        address_line2 || null,
        available ? 1 : 0,
        imagePath || '/uploads/avatars/default.png'
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
// Returns ALL fields from doctors table for admin management
const getDoctors = (req, res) => {
  const sql = `
    SELECT 
      d.id,
      u.name,
      u.email,
      d.image,
      d.avatar_path,
      d.specialization,
      d.degree,
      d.experience,
      d.experience_years,
      d.consultation_fee,
      d.fees,
      d.about,
      d.address_line1,
      d.address_line2,
      d.available,
      d.first_name,
      d.last_name,
      d.phone,
      d.department,
      d.license_number,
      d.facebook,
      d.x,
      d.linkedin,
      d.instagram,
      d.country,
      d.city_state,
      d.postal_code,
      d.created_at,
      d.updated_at
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE u.account_status = 'active'
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
      d.avatar_path,
      d.specialization,
      d.degree,
      d.experience,
      d.experience_years,
      d.consultation_fee,
      d.fees,
      d.about,
      d.address_line1,
      d.address_line2,
      d.available,
      d.first_name,
      d.last_name,
      d.phone,
      d.department,
      d.license_number,
      d.facebook,
      d.x,
      d.linkedin,
      d.instagram,
      d.country,
      d.city_state,
      d.postal_code
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = ? AND u.account_status = 'active'
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
    specialization,
    degree,
    experience_years,
    about,
    fees,
    address_line1,
    address_line2,
    available,
    first_name,
    last_name,
    phone,
    department,
    license_number,
    facebook,
    x,
    linkedin,
    instagram,
    country,
    city_state,
    postal_code
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
        avatar_path = COALESCE(?, avatar_path),
        specialization = COALESCE(?, specialization),
        degree = COALESCE(?, degree),
        experience_years = COALESCE(?, experience_years),
        about = COALESCE(?, about),
        consultation_fee = COALESCE(?, consultation_fee),
        fees = COALESCE(?, fees),
        address_line1 = COALESCE(?, address_line1),
        address_line2 = COALESCE(?, address_line2),
        available = COALESCE(?, available),
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        license_number = COALESCE(?, license_number),
        facebook = COALESCE(?, facebook),
        x = COALESCE(?, x),
        linkedin = COALESCE(?, linkedin),
        instagram = COALESCE(?, instagram),
        country = COALESCE(?, country),
        city_state = COALESCE(?, city_state),
        postal_code = COALESCE(?, postal_code)
      WHERE id = ?
    `;
    const params = [
      imagePath,
      imagePath || null,
      specialization || null,
      degree || null,
      experience_years || null,
      about || null,
      fees || null,
      fees || null, // fees for backward compatibility
      address_line1 || null,
      address_line2 || null,
      typeof available !== "undefined" ? available : null,
      first_name || null,
      last_name || null,
      phone || null,
      department || null,
      license_number || null,
      facebook || null,
      x || null,
      linkedin || null,
      instagram || null,
      country || null,
      city_state || null,
      postal_code || null,
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

// GET /api/doctors/me (doctor's own profile)
const getMyProfile = (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT 
      d.id,
      u.name,
      u.email,
      d.image,
      d.avatar_path,
      d.specialization,
      d.degree,
      d.experience,
      d.experience_years,
      d.consultation_fee,
      d.fees,
      d.about,
      d.address_line1,
      d.address_line2,
      d.available,
      d.first_name,
      d.last_name,
      d.phone,
      d.department,
      d.license_number,
      d.facebook,
      d.x,
      d.linkedin,
      d.instagram,
      d.country,
      d.city_state,
      d.postal_code
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ?
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) {
      // If no doctor profile exists, create a default one
      const createDefaultProfile = `
        INSERT INTO doctors (user_id, first_name, last_name, phone, department, license_number, experience, facebook, x, linkedin, instagram, country, city_state, postal_code, specialization, degree, experience_years, consultation_fee, fees, about, address_line1, address_line2, available, image, avatar_path)
        VALUES (?, '', '', '', '', '', '', '', '', '', '', '', '', '', 'General Physician', 'MD', '0', '50', '50', 'Experienced medical professional', '', '', 1, '', '/uploads/avatars/default.png')
      `;
      
      db.query(createDefaultProfile, [userId], (createErr, createResults) => {
        if (createErr) {
          console.error("Error creating default doctor profile:", createErr);
          return res.status(500).json({ error: "Failed to create doctor profile" });
        }
        
        // Now fetch the newly created profile
        db.query(sql, [userId], (fetchErr, fetchResults) => {
          if (fetchErr) return res.status(500).json({ error: fetchErr.message });
          if (!fetchResults || fetchResults.length === 0)
            return res.status(404).json({ error: "Doctor profile not found" });
          res.json(fetchResults[0]);
        });
      });
    } else {
      res.json(results[0]);
    }
  });
};

// PUT /api/doctors/me (doctor updates own profile)
const updateMyProfile = (req, res) => {
  const userId = req.user.id;
  const {
    first_name,
    last_name,
    phone,
    department,
    license_number,
    experience,
    facebook,
    x,
    linkedin,
    instagram,
    country,
    city_state,
    postal_code
  } = req.body;

  const updateSql = `
    UPDATE doctors SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      department = COALESCE(?, department),
      license_number = COALESCE(?, license_number),
      experience = COALESCE(?, experience),
      facebook = COALESCE(?, facebook),
      x = COALESCE(?, x),
      linkedin = COALESCE(?, linkedin),
      instagram = COALESCE(?, instagram),
      country = COALESCE(?, country),
      city_state = COALESCE(?, city_state),
      postal_code = COALESCE(?, postal_code)
    WHERE user_id = ?
  `;
  
  const params = [
    first_name || null,
    last_name || null,
    phone || null,
    department || null,
    license_number || null,
    experience || null,
    facebook || null,
    x || null,
    linkedin || null,
    instagram || null,
    country || null,
    city_state || null,
    postal_code || null,
    userId
  ];
  
  db.query(updateSql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: "Profile updated successfully" });
  });
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getMyProfile,
  updateMyProfile,
};
