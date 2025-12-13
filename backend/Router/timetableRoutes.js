const express = require("express");
const router = express.Router();
const controller = require("../Controller/timetableController");

// Create timetable
router.post("/create", controller.createTimetable);

// MUST COME FIRST
// router.get("/getById/:id", controller.getById);

// Get user's personal timetable
router.get("/user/:userId", controller.getUserTimetable);

// Get timetable by dept + class + semester
router.get("/:deptId/:className/:semester", controller.getTimetable);

// Update ONE period
router.put("/update/period/:id", controller.updateOnePeriod);

// Delete day or entire timetable
router.delete("/delete/day/:id/:day", controller.deleteDay);
router.delete("/delete/:id", controller.deleteTimetable);

module.exports = router;
