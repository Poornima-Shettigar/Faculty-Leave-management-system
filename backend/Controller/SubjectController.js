const Subject = require("../Models/Subject");

// Add Subject
exports.addSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, department, className, semester, faculty } = req.body;

    if (!subjectName || !subjectCode || !department || !className || !semester || !faculty) {
      return res.status(400).json({ msg: "All fields are required including semester" });
    }

    const newSubject = new Subject({
      subjectName,
      subjectCode,
      department,
      className,
      semester: Number(semester),
      faculty
    });

    await newSubject.save();
    res.status(201).json({ msg: "Subject added", subject: newSubject });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
};
exports.getSubjectsByClass = async (req, res) => {
  try{
    const { deptId, className, semester } = req.params;
    console.log(`--- Fetching Subjects ---`);
    console.log(`Department ID: ${deptId}`);
    console.log(`Class Name:    ${className}`);
    console.log(`Semester:      ${semester}`);
    
    const query = {
      department: deptId,
      className: className
    };
    
    if (semester && semester !== "all") {
      query.semester = Number(semester);
    }
    
    const list = await Subject.find(query)
        .populate("department")
        .populate("faculty", "name")
        .sort({ semester: 1, subjectName: 1 });
    
    console.log(req.body);
    res.json(list);
  }catch(err){
    console.error("Error in getSubjectsByClass:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get all subjects by department
exports.getSubjectsByDept = async (req, res) => {
  try {
    const { deptId,className } = req.params;

    const subjects = await Subject.find({ department: deptId,className: className })
      .populate("faculty", "name");

    res.json(subjects);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ msg: "Subject deleted" });
  } catch (error) {
    res.status(500).json(error);
  }
};

// Edit subject
exports.editSubject = async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json(error);
  }
};
// Get subjects assigned to specific faculty
// SubjectController.js
exports.getSubjectsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;  // from frontend

    const subjects = await Subject.find({ faculty: facultyId })
      .populate("department", "departmentName")  // optional: only if you want department details
      .populate("faculty", "name email"); // optional: if you want faculty info

    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.getSubjectsOnlyDept = async (req, res) => {
  try {
    const { deptId } = req.params;

    const subjects = await Subject.find({ department: deptId })
      .populate("faculty", "name email")
      .populate("department", "departmentName");

    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
};
