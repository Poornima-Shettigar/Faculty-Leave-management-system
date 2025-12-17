import React, { useEffect, useState } from "react";
import axios from "axios";

function AllDeptReport() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyLoading, setFacultyLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/department/list");
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyForDept = async (deptId) => {
    setFacultyLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/faculty/hod/department/${deptId}`);
      setFacultyList(res.data);
      setSelectedDept(deptId);
    } catch (err) {
      console.error(err);
      setFacultyList([]);
    } finally {
      setFacultyLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500 p-6">Loading departments...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Departments</h2>

      {!selectedDept ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => loadFacultyForDept(dept._id)}
            >
              <h3 className="text-lg font-medium text-blue-800">{dept.departmentName}</h3>
              <p className="text-sm text-blue-600">Level: {dept.level}</p>
              <p className="text-sm text-blue-600">Total Classes: {dept.totalClasses}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedDept(null)}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Departments
          </button>
          <h3 className="text-lg font-semibold mb-4">
            Faculty in {departments.find(d => d._id === selectedDept)?.departmentName}
          </h3>

          {facultyLoading ? (
            <div className="text-gray-500">Loading faculty...</div>
          ) : facultyList.length === 0 ? (
            <p className="text-gray-500">No faculty found in this department.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Faculty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Semester
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facultyList.map((faculty) =>
                    faculty.subjects.length > 0 ? (
                      faculty.subjects.map((subj, idx) => (
                        <tr key={`${faculty._id}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {faculty.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {faculty.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {subj.subjectName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {subj.className}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {subj.semester}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={faculty._id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {faculty.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {faculty.email}
                        </td>
                        <td
                          colSpan="3"
                          className="px-4 py-3 text-sm text-gray-400 italic"
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
      )}
    </div>
  );
}

export default AllDeptReport;
