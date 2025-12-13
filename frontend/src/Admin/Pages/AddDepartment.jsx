import React, { useState } from "react";
import axios from "axios";

function AddDepartment() {
  const [departmentName, setDepartmentName] = useState("");
  const [level, setLevel] = useState(""); // UG or PG

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/department/add", {
        departmentName,
        level
      });

      alert("Department Added Successfully!");

      setDepartmentName("");
      setLevel("");

    } catch (err) {
      alert("Error adding department");
    }
  };

  return (
    <div className="w-full flex justify-center items-center py-10 px-4">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-8 border">

        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">
          Add Department (Admin Only)
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Department Name */}
          <div>
            <label className="block text-gray-600 mb-1 font-medium">
              Department Name
            </label>
            <input
              type="text"
              placeholder="Enter Department Name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* UG / PG Selector */}
          <div>
            <label className="block text-gray-600 mb-1 font-medium">
              Course Level (UG / PG)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Level</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg 
                       hover:bg-blue-700 transition-all font-semibold"
          >
            Add Department
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddDepartment;
