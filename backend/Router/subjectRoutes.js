const express = require("express");
const router = express.Router();
const subjectController = require("../Controller/SubjectController");

router.post("/add", subjectController.addSubject);
router.get("/faculty/:facultyId", subjectController.getSubjectsByFaculty);

// Get subjects by class and semester (semester can be "all" or a number)
router.get("/:deptId/:className/:semester", subjectController.getSubjectsByClass);

// ⭐ NEW ENDPOINT → get all subjects of department
router.get("/dept/:deptId", subjectController.getSubjectsOnlyDept);

router.put("/edit/:id", subjectController.editSubject);
router.delete("/delete/:id", subjectController.deleteSubject);

module.exports = router;
