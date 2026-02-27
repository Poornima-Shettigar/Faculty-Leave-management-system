import React, { useState, useEffect } from "react";
import axios from "axios";

function AddDepartment() {
  const [departmentName, setDepartmentName] = useState("");
  const [level, setLevel] = useState(""); // UG or PG
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);

  // Fetch departments for duplicate check
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/department/list");
        setDepartments(res.data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, []);

  const validateDepartmentName = (name) => {
    const trimmedName = name.trim();
    const newErrors = {};

    // Required field
    if (!trimmedName) {
      newErrors.departmentName = "Department name is required";
      return newErrors;
    }

    // Minimum 3 characters
    if (trimmedName.length < 3) {
      newErrors.departmentName = "Department name must be at least 3 characters";
      return newErrors;
    }

    // Maximum 50 characters
    if (trimmedName.length > 50) {
      newErrors.departmentName = "Department name must not exceed 50 characters";
      return newErrors;
    }

    // Only alphabets and spaces allowed
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      newErrors.departmentName = "Only alphabets and spaces are allowed";
      return newErrors;
    }

    // Check for duplicate (case-insensitive)
    const isDuplicate = departments.some(
      dept => dept.departmentName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      newErrors.departmentName = "Department name already exists";
      return newErrors;
    }

    return newErrors;
  };

  const handleDepartmentNameChange = (e) => {
    const value = e.target.value;
    setDepartmentName(value);
    
    // Clear errors when user starts typing
    if (errors.departmentName) {
      setErrors({ ...errors, departmentName: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate department name
    const validationErrors = validateDepartmentName(departmentName);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/department/add", {
        departmentName: departmentName.trim(),
        level
      });

      alert("Department Added Successfully!");

      setDepartmentName("");
      setLevel("");
      setErrors({});

    } catch (err) {
      if (err.response?.data?.message?.includes("already exists")) {
        setErrors({ departmentName: "Department name already exists" });
      } else {
        alert("Error adding department");
      }
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
              onChange={handleDepartmentNameChange}
              required
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.departmentName ? 'border-red-500' : ''
              }`}
            />
            {errors.departmentName && (
              <p className="text-red-500 text-sm mt-1">{errors.departmentName}</p>
            )}
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
