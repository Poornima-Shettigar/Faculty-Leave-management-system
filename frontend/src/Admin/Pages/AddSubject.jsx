import React, { useEffect, useState } from "react";
import axios from "axios";

function AddSubject() {
  // Logged-in HOD details
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const hodDept = user.departmentType || "";

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(hodDept);

  const [faculties, setFaculties] = useState([]);
  const [facultyId, setFacultyId] = useState("");

  const [classNames, setClassNames] = useState([]);
  const [className, setClassName] = useState("");
  const [semester, setSemester] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  // Load all departments
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/department/list")
      .then((res) => setDepartments(res.data))
      .catch(() => alert("Failed to load departments"));
  }, []);

  // Auto-load classes and faculty for logged-in HOD's department
  useEffect(() => {
    if (departmentId && departments.length > 0) {
      const dept = departments.find((d) => d._id === departmentId);
      if (dept) setClassNames(dept.classNames);

      axios
        .get(`http://localhost:5000/api/faculty/getByDept/${departmentId}`)
        .then((res) => setFaculties(res.data))
        .catch((err) => console.log("Error loading faculty", err));
    }
  }, [departmentId, departments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/subject/add", {
        subjectName,
        subjectCode,
        department: departmentId,
        className,
        semester: Number(semester),
        faculty: facultyId,
      });

      alert("Subject Added Successfully!");

      // Reset Form
      setSubjectName("");
      setSubjectCode("");
      setClassName("");
      setSemester("");
      setFacultyId("");
    } catch (err) {
      alert("Error adding subject");
      console.error(err);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
      <h2 className="text-2xl font-bold text-center mb-5">Add Subject</h2>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Department (auto-selected & disabled) */}
        <div>
          <label className="font-semibold">Department</label>
          <select
            value={departmentId}
            disabled
            className="w-full border p-2 rounded-lg mt-1 bg-gray-100 cursor-not-allowed"
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </div>

        {/* Class Dropdown */}
        {classNames.length > 0 && (
          <div>
            <label className="font-semibold">Select Class</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
              className="w-full border p-2 rounded-lg mt-1"
            >
              <option value="">-- Select Class --</option>
              {classNames.map((cls, index) => (
                <option key={index} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Semester Dropdown */}
        <div>
          <label className="font-semibold">Semester <span className="text-red-500">*</span></label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
            className="w-full border p-2 rounded-lg mt-1"
          >
            <option value="">-- Select Semester --</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Faculty Dropdown */}
        {faculties.length > 0 && (
          <div>
            <label className="font-semibold">Select Faculty</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              required
              className="w-full border p-2 rounded-lg mt-1"
            >
              <option value="">-- Select Faculty --</option>
              {faculties.map((fac) => (
                <option key={fac._id} value={fac._id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject Name */}
        <div>
          <label className="font-semibold">Subject Name</label>
          <input
            type="text"
            placeholder="Enter Subject Name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Subject Code */}
        <div>
          <label className="font-semibold">Subject Code</label>
          <input
            type="text"
            placeholder="Ex: CS101"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            required
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
        >
          Add Subject
        </button>
      </form>
    </div>
  );
}

export default AddSubject;
