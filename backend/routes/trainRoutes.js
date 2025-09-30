//backend\routes\lectureRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all trains w
router.get("/", (req, res) => {
  db.query("SELECT Trajnimi.TrainID, Trajnimi.TrainTitle,Trajnimi.TrainDescription ,Ligjerusi.LecturerName FROM Ligjerusi JOIN Trajnimi ON Trajnimi.LecturerID = Ligjerusi.LecturerID", (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// Add Trains
router.post("/", (req, res) => {
  const { TrainTitle,TrainDescription, LecturerID } = req.body;
  db.query("INSERT INTO Trajnimi (TrainTitle,TrainDescription, LecturerID ) VALUES (?,?,?)", [TrainTitle,TrainDescription, LecturerID  ], (err) => {
    if (err) return res.json(err);
    res.json("Trajnimi added");
  });
});

// Update trains
router.put("/:id", (req, res) => {
  const { TrainTitle,TrainDescription, LecturerID  } = req.body;
  db.query("UPDATE Trajnimi SET TrainTitle=?,TrainDescription=?, LecturerID=?  WHERE TrainID=?", [TrainTitle,TrainDescription, LecturerID , req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Trajnimi updated");
  });
});

// Delete Trains
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM Trajnimi WHERE TrainID=?", [req.params.id], (err) => {
    if (err) return res.json(err);
    res.json("Trajnimi deleted");
  });
});

module.exports = router;