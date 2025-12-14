import React, { useEffect, useState } from "react";
import axios from "axios";

function ViewSubjectsForFaculty() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const facultyId = user.id; // logged-in faculty ID

  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (facultyId) {
      loadFacultySubjects();
    }
  }, [facultyId]);

  const loadFacultySubjects = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/subject/faculty/${facultyId}`
      );
      setSubjects(res.data);
    } catch (err) {
      console.log(err);
      setSubjects([]);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Subjects</h2>

      {subjects.length === 0 ? (
        <p>No subjects assigned to you.</p>
      ) : (
        <table className="w-full border text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Subject Name</th>
              <th className="border p-2">Code</th>
              <th className="border p-2">Semester</th>
              <th className="border p-2">Department</th>
              <th className="border p-2">Class</th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((sub) => (
              <tr key={sub._id}>
                <td className="border p-2">{sub.subjectName}</td>
                <td className="border p-2">{sub.subjectCode}</td>
                <td className="border p-2 font-semibold">
                  Sem {sub.semester || "N/A"}
                </td>
                <td className="border p-2">
                  {sub.department?.departmentName || "-"}
                </td>
                <td className="border p-2">{sub.className}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ViewSubjectsForFaculty;
