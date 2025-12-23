import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment"; // Useful for formatting dates in the table

function LeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [search, setSearch] = useState("");

  const [editingLeave, setEditingLeave] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    allowedLeaves: "",
    roles: [],
    isForwarding: false,
    isHalfDayAllowed: false, // NEW
    startDate: "", // NEW
    endDate: "",   // NEW
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
    if (!window.confirm("Are you sure? This will not remove existing allocated balances, only the type definition.")) return;
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
      isHalfDayAllowed: lt.isHalfDayAllowed || false,
      // Use moment to force the exact YYYY-MM-DD format the date input requires
      startDate: lt.startDate ? moment(lt.startDate).format("YYYY-MM-DD") : "",
      endDate: lt.endDate ? moment(lt.endDate).format("YYYY-MM-DD") : "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/leaveType/update/${editingLeave}`, editForm);
      alert("Leave Type Updated Successfully");
      setEditingLeave(null);
      fetchLeaveTypes();
    } catch (err) {
      console.error(err);
      alert("Error updating leave type");
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
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-extrabold text-center text-blue-900 mb-8">
        Policy & Leave Management
      </h1>

      {/* Search */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search policy name..."
          className="w-full max-w-md p-4 rounded-2xl border shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-2xl rounded-2xl">
        <table className="w-full bg-white border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Qty</th>
              <th className="p-4 text-left">Half-Day</th>
              <th className="p-4 text-left">Validity Range</th>
              <th className="p-4 text-left">Roles</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.map((lt) => (
              <tr key={lt._id} className="border-b hover:bg-blue-50 transition">
                <td className="p-4 font-bold text-gray-800">{lt.name}</td>
                <td className="p-4 text-gray-600">{lt.allowedLeaves}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${lt.isHalfDayAllowed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {lt.isHalfDayAllowed ? "Enabled" : "Disabled"}
                    </span>
                </td>
                <td className="p-4 text-xs text-gray-500">
                    {moment(lt.startDate).format("DD MMM YY")} - {moment(lt.endDate).format("DD MMM YY")}
                </td>
                <td className="p-4 flex flex-wrap gap-1">
                  {lt.roles.map((r) => (
                    <span key={r} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] uppercase font-bold">
                      {r}
                    </span>
                  ))}
                </td>
                <td className="p-4 text-center">
                   <div className="flex justify-center gap-2">
                    <button onClick={() => openEditModal(lt)} className="text-blue-600 hover:text-blue-800 font-bold text-sm">Edit</button>
                    <button onClick={() => handleDelete(lt._id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Delete</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingLeave && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">Edit Policy Rules</h2>

            <form onSubmit={handleUpdate} className="space-y-5">
              
              {/* Name and Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500">Leave Name</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Total Leaves</label>
                    <input type="number" value={editForm.allowedLeaves} onChange={(e) => setEditForm({ ...editForm, allowedLeaves: e.target.value })} className="w-full p-3 border rounded-xl" />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                <div>
                    <label className="text-xs font-bold text-gray-500">Start Date</label>
                    <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">End Date</label>
                    <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <button type="button" onClick={() => setEditForm({ ...editForm, isHalfDayAllowed: !editForm.isHalfDayAllowed })}
                  className={`flex-1 p-3 rounded-xl border font-bold text-sm ${editForm.isHalfDayAllowed ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}>
                  {editForm.isHalfDayAllowed ? "✓ Half-Day On" : "Half-Day Off"}
                </button>
                <button type="button" onClick={() => setEditForm({ ...editForm, isForwarding: !editForm.isForwarding })}
                  className={`flex-1 p-3 rounded-xl border font-bold text-sm ${editForm.isForwarding ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}>
                  {editForm.isForwarding ? "✓ Forwarding On" : "Forwarding Off"}
                </button>
              </div>

              {/* Roles */}
              <div>
                <p className="font-bold text-gray-700 text-sm mb-2">Applicable Roles</p>
                <div className="flex flex-wrap gap-2">
                  {roleList.map((role) => (
                    <button key={role} type="button" onClick={() => toggleRole(role)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${editForm.roles.includes(role) ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingLeave(null)} className="px-6 py-3 bg-gray-200 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-blue-900 text-white rounded-xl font-bold shadow-lg">Update Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveTypeManagement;