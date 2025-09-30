//backend\routes\lecturerRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all Ligjerusi
router.get("/", (req, res) => {
  db.query("SELECT * FROM Ligjerusi", (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// Add Ligjerusi
router.post("/", (req, res) => {
  const { LecturerName, LecturerSurname,LecturerSpeciality } = req.body;
  db.query("INSERT INTO Ligjerusi ( LecturerName, LecturerSurname,LecturerSpeciality ) VALUES (?,?,?)", [ LecturerName, LecturerSurname,LecturerSpeciality ], (err) => {
    if (err) return res.json(err);
    res.json("Lecturer added");
  });
});

// Update Ligjerusi
router.put("/:id", (req, res) => {
  const { LecturerName, LecturerSurname,LecturerSpeciality  } = req.body;
  db.query("UPDATE Ligjerusi SET  LecturerName=?, LecturerSurname=?,LecturerSpeciality=?  WHERE LecturerID=?", [ LecturerName, LecturerSurname,LecturerSpeciality , req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Lecturer updated");
  });
});

// Delete Ligjerusi
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM Ligjerusi WHERE LecturerID=?", [req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Lecturer deleted");
  });
});

module.exports = router;

