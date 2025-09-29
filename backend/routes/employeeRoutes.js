//backend\routes\lecturerRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all Employee
router.get("/", (req, res) => {
  db.query("SELECT * FROM Employee", (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// Add Employee
router.post("/", (req, res) => {
  const { EmployeeName, EmployeeSurname } = req.body;
  db.query("INSERT INTO Employee (EmployeeName, EmployeeSurname) VALUES (?,?)", [EmployeeName, EmployeeSurname], (err) => {
    if (err) return res.json(err);
    res.json("Employee added");
  });
});

// Update lecturer
router.put("/:id", (req, res) => {
  const {EmployeeName, EmployeeSurname } = req.body;
  db.query("UPDATE Employee SET EmployeeName=?, EmployeeSurname=? WHERE EmployeeID=?", [EmployeeName, EmployeeSurname, req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Employee updated");
  });
});

// Delete lecturer
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM Employee WHERE EmployeeID=?", [req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Employee deleted");
  });
});

module.exports = router;

