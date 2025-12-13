import React, { useEffect, useState } from "react";
import axios from "axios";

function ManageClasses() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const departmentId = user.departmentType; // HOD's department ObjectId
  const [department, setDepartment] = useState(null);
  const [classList, setClassList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editClassName, setEditClassName] = useState("");
  const [message, setMessage] = useState("");

  // Fetch department and classes
  const loadDepartment = async () => {
    if (!departmentId) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/department/get-by-id/${departmentId}`
      );
      setDepartment(res.data);
      setClassList(res.data.classNames || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete class
  const deleteClass = async (cls) => {
    if (!department) return;
    if (!window.confirm(`Delete class "${cls}"?`)) return;

    try {
      await axios.put("http://localhost:5000/api/department/remove-class", {
        departmentName: department.departmentName,
        className: cls,
      });
      setMessage(`Class "${cls}" deleted successfully.`);
      loadDepartment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error deleting class");
    }
  };

  // Start editing
  const startEdit = (index, cls) => {
    setEditIndex(index);
    setEditClassName(cls);
  };

  // Save edited class
  const saveEdit = async (index) => {
    if (!editClassName.trim()) {
      setMessage("Class name cannot be empty.");
      return;
    }

    try {
      await axios.put("http://localhost:5000/api/department/update-class", {
        departmentName: department.departmentName,
        oldClassName: classList[index],
        newClassName: editClassName.trim(),
      });
      setMessage(`Class updated successfully.`);
      setEditIndex(null);
      setEditClassName("");
      loadDepartment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error updating class");
    }
  };

  useEffect(() => {
    loadDepartment();
  }, [departmentId]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Manage Classes – {department?.departmentName || "Loading..."}
      </h1>

      {message && (
        <div className="mb-6 p-4 text-green-800 bg-green-100 rounded shadow">
          {message}
        </div>
      )}

      {/* Classes Grid */}
      {classList.length === 0 ? (
        <p className="text-gray-500 text-center text-lg mt-10">
          No classes found for this department.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classList.map((cls, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-xl border border-gray-200 p-5 flex flex-col justify-between hover:shadow-lg transition"
            >
              {editIndex === index ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(index)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditIndex(null)}
                      className="flex-1 bg-gray-400 text-white px-3 py-2 rounded-lg hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-800">{cls}</h2>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => startEdit(index, cls)}
                      className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteClass(cls)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageClasses;
