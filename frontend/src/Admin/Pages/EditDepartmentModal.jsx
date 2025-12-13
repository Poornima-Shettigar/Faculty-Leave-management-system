import React, { useState } from "react";
import axios from "axios";

function EditDepartmentModal({ department, close, refresh }) {
  const [departmentName, setDepartmentName] = useState(department.departmentName);
  const [level, setLevel] = useState(department.level);

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`http://localhost:5000/api/department/update/${department._id}`, {
        departmentName,
        level
      });

      alert("Department updated successfully");
      refresh();
      close();
    } catch (err) {
      alert("Error updating department");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl animate-fadeIn">

        <h2 className="text-2xl font-bold text-center mb-4">Edit Department</h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-gray-600 font-medium">Department Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-4 py-2"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>

          {/* UG/PG */}
          <div>
            <label className="text-gray-600 font-medium">Course Level</label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
            >
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Update
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default EditDepartmentModal;
