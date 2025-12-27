import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";

function LeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [editingLeave, setEditingLeave] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    allowedLeaves: "",
    roles: [],
    isForwarding: false,
    isHalfDayAllowed: false,
    leaveEffect: "DEDUCT",
    startDate: "",
    endDate: "",
  });

  const roleList = ["admin", "teaching", "non-teaching", "hod", "director"];

  /* ================= FETCH ================= */
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

  /* ================= SEARCH ================= */
  const handleSearch = async (value) => {
    setSearch(value);
    if (!value.trim()) return fetchLeaveTypes();

    const res = await axios.get(
      `http://localhost:5000/api/leaveType/search?q=${value}`
    );
    setLeaveTypes(res.data);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/leaveType/delete/${id}`
      );
      fetchLeaveTypes();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= OPEN EDIT ================= */
  const openEditModal = (lt) => {
    setEditingLeave(lt._id);

    setEditForm({
      name: lt.name || "",
      allowedLeaves: lt.allowedLeaves || "",
      roles: lt.roles || [],
      isForwarding: lt.isForwarding || false,
      isHalfDayAllowed: lt.isHalfDayAllowed || false,
      leaveEffect: lt.leaveEffect || "DEDUCT",
      startDate: lt.startDate
        ? moment(lt.startDate).format("YYYY-MM-DD")
        : "",
      endDate: lt.endDate
        ? moment(lt.endDate).format("YYYY-MM-DD")
        : "",
    });
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !editForm.name ||
      !editForm.allowedLeaves ||
      !editForm.roles.length ||
      !editForm.startDate ||
      !editForm.endDate
    ) {
      return alert("Please fill all required fields");
    }

    try {
      await axios.put(
        `http://localhost:5000/api/leaveType/update/${editingLeave}`,
        editForm
      );
      alert("Leave Policy Updated Successfully");
      setEditingLeave(null);
      fetchLeaveTypes();
    } catch (err) {
      console.error(err);
      alert("Error updating leave policy");
    }
  };

  /* ================= ROLE TOGGLE ================= */
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

      {/* SEARCH */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search policy name..."
          className="w-full max-w-md p-4 rounded-2xl border shadow-sm"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto shadow-2xl rounded-2xl">
        <table className="w-full bg-white">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Qty</th>
              <th className="p-4">Half Day</th>
              <th className="p-4">Effect</th>
              <th className="p-4">Validity</th>
              <th className="p-4">Roles</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leaveTypes.map((lt) => (
              <tr key={lt._id} className="border-b hover:bg-blue-50">
                <td className="p-4 font-bold">{lt.name}</td>
                <td className="p-4">{lt.allowedLeaves}</td>
                <td className="p-4">
                  {lt.isHalfDayAllowed ? "Yes" : "No"}
                </td>
                <td className="p-4 font-bold">
                  {lt.leaveEffect}
                </td>
                <td className="p-4 text-xs">
                  {moment(lt.startDate).format("DD MMM YY")} -{" "}
                  {moment(lt.endDate).format("DD MMM YY")}
                </td>
                <td className="p-4 flex gap-1 flex-wrap">
                  {lt.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-1 bg-blue-100 rounded text-xs"
                    >
                      {r}
                    </span>
                  ))}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => openEditModal(lt)}
                    className="text-blue-600 font-bold mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lt._id)}
                    className="text-red-600 font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editingLeave && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">
              Edit Leave Policy
            </h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full p-3 border rounded-xl"
                placeholder="Leave Name"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  className="p-3 border rounded-xl"
                />
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  className="p-3 border rounded-xl"
                />
              </div>

              <input
                type="number"
                value={editForm.allowedLeaves}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    allowedLeaves: e.target.value,
                  })
                }
                className="w-full p-3 border rounded-xl"
                placeholder="Allowed Leaves"
              />

              {/* TOGGLES */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      isHalfDayAllowed: !editForm.isHalfDayAllowed,
                    })
                  }
                  className={`p-2 rounded-xl ${
                    editForm.isHalfDayAllowed
                      ? "bg-blue-600 text-white"
                      : "border"
                  }`}
                >
                  Half Day
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      isForwarding: !editForm.isForwarding,
                    })
                  }
                  className={`p-2 rounded-xl ${
                    editForm.isForwarding
                      ? "bg-blue-600 text-white"
                      : "border"
                  }`}
                >
                  Carry Forward
                </button>
              </div>

              {/* LEAVE EFFECT */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({ ...editForm, leaveEffect: "DEDUCT" })
                  }
                  className={`p-2 rounded-xl ${
                    editForm.leaveEffect === "DEDUCT"
                      ? "bg-red-600 text-white"
                      : "border"
                  }`}
                >
                  Deduct Leave
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditForm({ ...editForm, leaveEffect: "ADD" })
                  }
                  className={`p-2 rounded-xl ${
                    editForm.leaveEffect === "ADD"
                      ? "bg-green-600 text-white"
                      : "border"
                  }`}
                >
                  Credit Leave
                </button>
              </div>

              {/* ROLES */}
              <div className="flex flex-wrap gap-2">
                {roleList.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={`px-3 py-1 rounded-lg border ${
                      editForm.roles.includes(r)
                        ? "bg-blue-800 text-white"
                        : ""
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
                  className="px-6 py-3 bg-gray-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-900 text-white rounded-xl font-bold"
                >
                  Update Policy
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
