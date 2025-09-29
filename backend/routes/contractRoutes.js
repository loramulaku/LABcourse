//backend\routes\lectureRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all lectures with lecturer name
router.get("/", (req, res) => {
  db.query("SELECT Contract.ContractID, Contract.ContractTitle, Contract.ContractDescription ,Employee.EmployeeName FROM Contract JOIN Employee ON Contract.EmployeeID = Employee.EmployeeID", (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// Add lecture
router.post("/", (req, res) => {
  const { ContractTitle, ContractDescription, EmployeeID } = req.body;
  db.query("INSERT INTO Contract (ContractTitle, ContractDescription, EmployeeID) VALUES (?,?,?)", [ContractTitle, ContractDescription, EmployeeID], (err) => {
    if (err) return res.json(err);
    res.json("Contract added");
  });
});

// Update lecture
router.put("/:id", (req, res) => {
  const { ContractTitle, ContractDescription,EmployeeID } = req.body;
  db.query("UPDATE Contract SET ContractTitle=?, ContractDescription=? ,EmployeeID=? WHERE ContractID=?", [ContractTitle, ContractDescription,EmployeeID, req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Contract updated");
  });
});

// Delete lecture
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM Contract WHERE ContractID=?", [req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Contract deleted");
  });
});

module.exports = router;