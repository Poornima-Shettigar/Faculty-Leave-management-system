import React, { useState } from "react";
import axios from "axios";

function AddLeaveType() {
  const [name, setName] = useState("");
  const [allowedLeaves, setAllowedLeaves] = useState("");
  const [roles, setRoles] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isHalfDayAllowed, setIsHalfDayAllowed] = useState(false);
  const [leaveEffect, setLeaveEffect] = useState("DEDUCT");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const roleList = ["teaching", "non-teaching", "hod", "admin", "director"];

  const handleRoleChange = (role) => {
    setRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !allowedLeaves || !roles.length || !startDate || !endDate) {
      return alert("Please fill all fields");
    }

    try {
      await axios.post("http://localhost:5000/api/leaveType/add", {
        name,
        allowedLeaves,
        roles,
        isForwarding,
        isHalfDayAllowed,
        leaveEffect,
        startDate,
        endDate
      });

      alert("Leave type created successfully");

    } catch (err) {
      alert(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl">

        <h2 className="text-2xl font-bold text-center mb-6">
          Create Leave Policy
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Leave Name"
            className="w-full p-3 border rounded-xl"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-3 border rounded-xl" />

            <input type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-3 border rounded-xl" />
          </div>

          <input
            type="number"
            placeholder="Allowed Leaves"
            className="w-full p-3 border rounded-xl"
            value={allowedLeaves}
            onChange={e => setAllowedLeaves(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => setIsHalfDayAllowed(!isHalfDayAllowed)}
              className={`p-2 rounded-xl ${isHalfDayAllowed ? "bg-blue-600 text-white" : "border"}`}>
              Half Day
            </button>

            <button type="button"
              onClick={() => setIsForwarding(!isForwarding)}
              className={`p-2 rounded-xl ${isForwarding ? "bg-blue-600 text-white" : "border"}`}>
              Carry Forward
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => setLeaveEffect("DEDUCT")}
              className={`p-2 rounded-xl ${leaveEffect === "DEDUCT" ? "bg-red-600 text-white" : "border"}`}>
              Deduct Leave
            </button>

            <button type="button"
              onClick={() => setLeaveEffect("ADD")}
              className={`p-2 rounded-xl ${leaveEffect === "ADD" ? "bg-green-600 text-white" : "border"}`}>
              Credit Leave
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {roleList.map(r => (
              <button key={r} type="button"
                onClick={() => handleRoleChange(r)}
                className={`px-3 py-1 rounded-lg border ${roles.includes(r) ? "bg-blue-800 text-white" : ""}`}>
                {r}
              </button>
            ))}
          </div>

          <button type="submit"
            className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold">
            Create Leave Policy
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddLeaveType;
