import React, { useEffect, useState } from "react";
import axios from "axios";
import EditDepartmentModal from "./EditDepartmentModal";
import { FaTrash, FaEdit } from "react-icons/fa";

function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Load departments
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/department/list");
      setDepartments(res.data);
    } catch (err) {
      alert("Error loading departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Delete Department
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/department/delete/${id}`);
      alert("Department deleted");
      fetchDepartments();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-5 text-gray-700">Department List</h1>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <div
            key={dept._id}
            className="border p-4 rounded-lg shadow flex justify-between items-center hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">{dept.departmentName}</h2>
              <p className="text-sm text-gray-500">Level: {dept.level}</p>
            </div>

            <div className="flex gap-4">
              {/* Edit Button */}
              <button
                onClick={() => {
                  setSelectedDept(dept);
                  setOpenEdit(true);
                }}
                className="text-yellow-500 hover:text-yellow-600 text-xl"
              >
                <FaEdit />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(dept._id)}
                className="text-red-600 hover:text-red-700 text-xl"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <p className="text-gray-500 text-center">No departments found.</p>
        )}
      </div>

      {/* Edit Modal */}
      {openEdit && (
        <EditDepartmentModal
          department={selectedDept}
          close={() => setOpenEdit(false)}
          refresh={fetchDepartments}
        />
      )}
    </div>
  );
}

export default DepartmentList;
