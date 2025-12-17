import React, { useEffect, useState } from "react";
import axios from "axios";

function HodFacultyList() {
  // 🔐 Get logged-in user
  const user = JSON.parse(localStorage.getItem("user")) || {};

  // ✅ Ensure only HOD can access
  const isHod = user.role === "hod";

  // ✅ Safely extract department ID
  const departmentId =
    user?.departmentType?._id ||
    user?.departmentType ||
    user?.department ||
    null;

  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isHod && departmentId) {
      loadFacultyList();
    } else {
      setLoading(false);
      setError("Unauthorized or Department not assigned");
    }
  }, []);

  // 📡 Fetch faculty by HOD department
  const loadFacultyList = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/faculty/hod/department/${departmentId}`
      );

      setFacultyList(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Error fetching faculty list:", err);
      setFacultyList([]);
      setError("Failed to load faculty list");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Loading UI
  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-center">
        Loading faculty list...
      </div>
    );
  }

  // ❌ Unauthorized / Error
  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Department Faculty & Subject Allocation
        </h2>

        {/* Optional Refresh */}
        <button
          onClick={loadFacultyList}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {facultyList.length === 0 ? (
        <p className="text-gray-500 text-center">
          No faculty found in your department.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Faculty
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Subject
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Class
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Semester
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {facultyList.map((faculty) =>
                faculty?.subjects?.length > 0 ? (
                  faculty.subjects.map((subject, index) => (
                    <tr
                      key={`${faculty._id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {faculty.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {faculty.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {subject.subjectName}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {subject.className}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {subject.semester}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key={faculty._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {faculty.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {faculty.email}
                    </td>
                    <td
                      colSpan="3"
                      className="px-4 py-3 text-gray-400 italic text-center"
                    >
                      No subjects assigned
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HodFacultyList;
