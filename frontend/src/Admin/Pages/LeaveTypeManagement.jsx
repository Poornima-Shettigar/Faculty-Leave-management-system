import React, { useEffect, useState } from "react";
import axios from "axios";

function LeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [search, setSearch] = useState("");

  const [editingLeave, setEditingLeave] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    allowedLeaves: "",
    roles: [],
    isForwarding: false,
  });

  const roleList = ["admin", "teaching", "non-teaching", "hod", "director"];

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaveType/list");
      setLeaveTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const handleSearch = async (value) => {
    setSearch(value);
    if (!value.trim()) return fetchLeaveTypes();
    const res = await axios.get(`http://localhost:5000/api/leaveType/search?q=${value}`);
    setLeaveTypes(res.data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave type?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/leaveType/delete/${id}`);
      fetchLeaveTypes();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (lt) => {
    setEditingLeave(lt._id);
    setEditForm({
      name: lt.name,
      allowedLeaves: lt.allowedLeaves,
      roles: lt.roles,
      isForwarding: lt.isForwarding,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/leaveType/update/${editingLeave}`,
        editForm
      );
      alert("Leave Type Updated");
      setEditingLeave(null);
      fetchLeaveTypes();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRole = (role) => {
    setEditForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
        Leave Type Management
      </h1>

      {/* Search */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search leave type..."
          className="w-full max-w-md p-3 rounded-2xl border border-gray-300 shadow-sm
                     focus:ring-2 focus:ring-blue-400 outline-none transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full rounded-2xl overflow-hidden shadow-xl bg-white/90 backdrop-blur-md border border-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Allowed Leaves</th>
              <th className="p-4 text-left">Roles</th>
              <th className="p-4 text-left">Forwarding</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.map((lt) => (
              <tr
                key={lt._id}
                className="border-b hover:bg-gray-100 transition cursor-pointer"
              >
                <td className="p-4 font-medium">{lt.name}</td>
                <td className="p-4">{lt.allowedLeaves}</td>
                <td className="p-4 flex flex-wrap gap-2">
                  {lt.roles.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"
                    >
                      {r}
                    </span>
                  ))}
                </td>
                <td className="p-4">{lt.isForwarding ? "Yes" : "No"}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button
                    onClick={() => openEditModal(lt)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lt._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
  {/* Edit Modal */}
{editingLeave && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 animate-fadeIn">
    <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-95 animate-scaleUp">
      
      <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800 drop-shadow-sm">
        Edit Leave Type
      </h2>

      <form onSubmit={handleUpdate} className="space-y-6">

        {/* Leave Name */}
        <div className="relative">
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
            className="peer w-full p-4 pt-6 rounded-2xl border border-gray-300 bg-transparent focus:border-blue-600 focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 transition"
          />
          <label className="absolute left-4 top-1 text-gray-500 text-sm transition-all
            peer-focus:text-blue-600 peer-focus:top-1 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base">
            Leave Name
          </label>
        </div>

        {/* Allowed Leaves */}
        <div className="relative">
          <input
            type="number"
            value={editForm.allowedLeaves}
            onChange={(e) =>
              setEditForm({ ...editForm, allowedLeaves: e.target.value })
            }
            required
            className="peer w-full p-4 pt-6 rounded-2xl border border-gray-300 bg-transparent focus:border-blue-600 focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 transition"
          />
          <label className="absolute left-4 top-1 text-gray-500 text-sm transition-all
            peer-focus:text-blue-600 peer-focus:top-1 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base">
            Allowed Leaves
          </label>
        </div>

        {/* Roles */}
        <div>
          <p className="font-semibold text-gray-700 mb-3">Roles</p>
          <div className="flex flex-wrap gap-3">
            {roleList.map((role) => (
              <label
                key={role}
                className={`px-4 py-2 rounded-full cursor-pointer border transition-all
                  ${
                    editForm.roles.includes(role)
                      ? "bg-blue-600 text-white border-blue-700 shadow-md scale-105"
                      : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-blue-50"
                  }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={editForm.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </div>

        {/* Forwarding */}
        <label className="flex items-center gap-4 mt-2">
          <input
            type="checkbox"
            checked={editForm.isForwarding}
            onChange={() =>
              setEditForm({ ...editForm, isForwarding: !editForm.isForwarding })
            }
            className="w-6 h-6 accent-blue-600"
          />
          <span className="font-semibold text-gray-700 text-lg">
            Forwarding Leave
          </span>
        </label>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => setEditingLeave(null)}
            className="px-5 py-3 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-3 bg-gradient-to-r from-blue-700 to-blue-900 text-white font-semibold rounded-2xl shadow-lg hover:from-blue-800 hover:to-blue-950 transition transform hover:scale-[1.03]"
          >
            Update
          </button>
        </div>

      </form>
    </div>
  </div>
)}

    </div>
  );
}

export default LeaveTypeManagement;
