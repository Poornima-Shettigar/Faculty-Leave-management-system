import React, { useState, useEffect } from "react";
import axios from "axios";

function EditDepartmentModal({ department, close, refresh }) {
  const [departmentName, setDepartmentName] = useState(department.departmentName);
  const [level, setLevel] = useState(department.level);
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

    // Check for duplicate (case-insensitive), but exclude current department
    const isDuplicate = departments.some(
      dept => dept._id !== department._id && dept.departmentName.toLowerCase() === trimmedName.toLowerCase()
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validate department name
    const validationErrors = validateDepartmentName(departmentName);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/department/update/${department._id}`, {
        departmentName: departmentName.trim(),
        level
      });

      alert("Department updated successfully");
      refresh();
      close();
    } catch (err) {
      if (err.response?.data?.message?.includes("already exists")) {
        setErrors({ departmentName: "Department name already exists" });
      } else {
        alert("Error updating department");
      }
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
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.departmentName ? 'border-red-500' : ''
              }`}
              value={departmentName}
              onChange={handleDepartmentNameChange}
              required
            />
            {errors.departmentName && (
              <p className="text-red-500 text-sm mt-1">{errors.departmentName}</p>
            )}
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
