import React, { useEffect, useState } from "react";
import axios from "axios";

function ManageClasses() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const departmentId = user.departmentType; // HOD's department ObjectId
console.log(user);
  const [department, setDepartment] = useState(null); // store full department
  const [classList, setClassList] = useState([]);
  const [newClass, setNewClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch department by ID
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

  // Add new class
  const addClass = async () => {
    if (!newClass.trim() || !department) {
      setMessage("Class name cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put(
        "http://localhost:5000/api/department/add-class",
        {
          departmentName: department.departmentName, // use actual name
          className: newClass.trim(),
        }
      );
      setMessage("Class added successfully!");
      setNewClass("");
      loadDepartment(); // reload classes
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error adding class");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartment();
  }, [departmentId]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Manage Classes – {department?.departmentName || "Loading..."}
      </h1>

      {/* Add Class */}
      <div className="bg-white shadow-lg p-6 rounded-xl border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Class</h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter class name (e.g., 'FY-BCA A')"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addClass}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        {message && (
          <p className="mt-3 text-sm text-green-700 font-medium">{message}</p>
        )}
      </div>

      {/* Existing Classes */}
      <div className="bg-white shadow-lg p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Existing Classes</h2>

        {classList.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes added yet.</p>
        ) : (
          <ul className="space-y-2">
            {classList.map((cls, index) => (
              <li key={index} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                {cls}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ManageClasses;
