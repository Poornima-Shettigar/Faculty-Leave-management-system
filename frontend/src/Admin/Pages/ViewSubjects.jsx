import React, { useEffect, useState } from "react";
import axios from "axios";
import EditSubjectModal from "./EditSubjectModal";

function ViewSubjects() {
  // Logged-in HOD details
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const hodDept = user.departmentType || "";

  const [departments, setDepartments] = useState([]);
  const [deptId, setDeptId] = useState(hodDept);
  const [className, setClassName] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [classes, setClasses] = useState([]);

  const [subjects, setSubjects] = useState([]);
  const [timetableExists, setTimetableExists] = useState(false);
  const [timetableId, setTimetableId] = useState(null);

  const [editData, setEditData] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load departments
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/department/list")
      .then((res) => setDepartments(res.data))
      .catch(() => setDepartments([]));
  }, []);

  // Auto-load classes when dept selected
  useEffect(() => {
    if (deptId && departments.length > 0) {
      const dept = departments.find((d) => d._id === deptId);
      setClasses(dept ? dept.classNames : []);
    }
  }, [deptId, departments]);

  // Handle Class
  const handleClassChange = (cls) => {
    setClassName(cls);
    setSubjects([]);
    setTimetableExists(false);
    setTimetableId(null);
  };

  // Load subjects by department + class + semester
  const loadSubjects = async () => {
    if (!deptId || !className) return;

    setHasLoaded(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/subject/${deptId}/${className}/${selectedSemester}`
      );
      setSubjects(res.data);
    } catch (err) {
      setSubjects([]);
    }

    if (selectedSemester !== "all") {
      checkTimetable();
    }
  };

  // ⭐ Load all subjects of department only
  const loadDeptSubjects = async () => {
    setHasLoaded(true);
    setClassName("");

    try {
      const res = await axios.get(
        `http://localhost:5000/api/subject/dept/${deptId}`
      );
      setSubjects(res.data);
    } catch (err) {
      setSubjects([]);
    }

    setTimetableExists(false);
    setTimetableId(null);
  };

  // Check timetable exists (need semester to check)
  const checkTimetable = async () => {
    if (!deptId || !className || selectedSemester === "all") {
      setTimetableExists(false);
      setTimetableId(null);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/timetable/${deptId}/${className}/${selectedSemester}`
      );

      if (res.data?.timetable && res.data.timetable.length > 0) {
        setTimetableExists(true);
        setTimetableId(res.data._id);
      } else {
        setTimetableExists(false);
        setTimetableId(null);
      }
    } catch (err) {
      setTimetableExists(false);
      setTimetableId(null);
    }
  };

  // Delete a subject
  const deleteSubject = async (id) => {
    if (!window.confirm("Delete this subject?")) return;

    await axios.delete(`http://localhost:5000/api/subject/delete/${id}`);
    className ? loadSubjects() : loadDeptSubjects();
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-5">
        Subjects & Timetable (HOD Panel)
      </h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">

        {/* Department */}
        <select
          className="border p-2 rounded-lg bg-gray-100 cursor-not-allowed"
          value={deptId}
          disabled
        >
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.departmentName}
            </option>
          ))}
        </select>

        {/* Class */}
        {classes.length > 0 && (
          <select
            className="border p-2 rounded-lg"
            value={className}
            onChange={(e) => {
              handleClassChange(e.target.value);
              setSelectedSemester("all");
            }}
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls, idx) => (
              <option key={idx} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        )}

        {/* Semester Filter */}
        {className && (
          <select
            className="border p-2 rounded-lg"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        )}

        {/* Load Class Subjects */}
        <button
          onClick={loadSubjects}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Load
        </button>

        {/* ⭐ Load All Department Subjects */}
        <button
          onClick={loadDeptSubjects}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Load All Dept Subjects
        </button>
      </div>

      {/* Show subjects */}
      {hasLoaded && subjects.length > 0 ? (
        <table className="w-full border text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Subject Name</th>
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Semester</th>
              <th className="p-2 border">Class</th>
              <th className="p-2 border">Faculty</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((sub) => (
              <tr key={sub._id}>
                <td className="p-2 border">{sub.subjectName}</td>
                <td className="p-2 border">{sub.subjectCode}</td>
                <td className="p-2 border font-semibold">Sem {sub.semester || "N/A"}</td>
                <td className="p-2 border">{sub.className}</td>
                <td className="p-2 border">
                  {sub.faculty?.name || "Not Assigned"}
                </td>

                <td className="p-2 border flex justify-center gap-2">
                  <button
                    className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    onClick={() => setEditData(sub)}
                  >
                    Edit
                  </button>

                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => deleteSubject(sub._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : hasLoaded ? (
        <p>No subjects found.</p>
      ) : null}

      {/* Edit Modal */}
      {editData && (
        <EditSubjectModal
          subject={editData}
          close={() => setEditData(null)}
          reload={className ? loadSubjects : loadDeptSubjects}
        />
      )}
    </div>
  );
}

export default ViewSubjects;
