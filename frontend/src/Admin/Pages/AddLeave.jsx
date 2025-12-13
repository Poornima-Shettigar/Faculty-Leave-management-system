import React, { useState } from "react";
import axios from "axios";

function AddLeaveType() {
  const [name, setName] = useState("");
  const [allowedLeaves, setAllowedLeaves] = useState("");
  const [roles, setRoles] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);

  const handleRoleChange = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const roleList = ["teaching", "non-teaching", "hod", "admin", "director"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !allowedLeaves || roles.length === 0) {
      return alert("Please fill all fields");
    }

    try {
      await axios.post("http://localhost:5000/api/leaveType/add", {
        name,
        allowedLeaves,
        roles,
        isForwarding,
      });

      alert("Leave type added!");
      setName("");
      setAllowedLeaves("");
      setRoles([]);
      setIsForwarding(false);
    } catch (err) {
      alert("Error adding leave type");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
        bg-gradient-to-br from-blue-100 via-white to-blue-200 p-5">
      
      <div className="w-full max-w-xl bg-white/80 shadow-2xl rounded-3xl 
          border border-gray-200 backdrop-blur-xl p-10 animate-fadeIn 
          transform transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,0,0,0.15)]">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent 
              bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text drop-shadow-sm">
            Create Leave Type
          </h1>
          <p className="text-gray-600 mt-2">
            Configure annual leave rules for your institute
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Floating Label Input */}
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="peer w-full p-4 pt-6 border border-gray-300 rounded-2xl 
              bg-transparent focus:border-blue-600 outline-none text-gray-900"
            />
            <label
              className="absolute left-4 top-1 text-gray-500 text-sm 
              transition-all peer-focus:text-blue-600 peer-focus:top-1 
              peer-placeholder-shown:top-4 peer-placeholder-shown:text-base"
            >
              Leave Type
            </label>
          </div>

          {/* Allowed Leaves */}
          <div className="relative">
            <input
              type="number"
              value={allowedLeaves}
              onChange={(e) => setAllowedLeaves(e.target.value)}
              required
              className="peer w-full p-4 pt-6 border border-gray-300 rounded-2xl 
              bg-transparent focus:border-blue-600 outline-none text-gray-900"
            />
            <label
              className="absolute left-4 top-1 text-gray-500 text-sm 
              transition-all peer-focus:text-blue-600 peer-focus:top-1 
              peer-placeholder-shown:top-4 peer-placeholder-shown:text-base"
            >
              Allowed Leaves (per year)
            </label>
          </div>

          {/* Roles */}
          <div>
            <p className="font-semibold text-gray-700 mb-3">Applicable Roles</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {roleList.map((r) => (
                <label
                  key={r}
                  className={`cursor-pointer flex items-center gap-2 p-3 rounded-2xl 
                  border transition-all shadow-sm hover:shadow-md
                  ${
                    roles.includes(r)
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={roles.includes(r)}
                    onChange={() => handleRoleChange(r)}
                  />
                  <span className="capitalize font-medium">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between bg-gray-50 
          p-4 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-gray-800 font-semibold">
              Enable Leave Forwarding
            </span>

            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isForwarding}
                onChange={() => setIsForwarding(!isForwarding)}
              />
              <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 
                  transition relative">
                <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full
                    shadow-md transition peer-checked:translate-x-7"></div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 text-lg font-bold text-white rounded-2xl 
          bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg 
          hover:from-blue-800 hover:to-blue-950 hover:shadow-xl 
          transition transform hover:scale-[1.02]"
          >
            Add & Allocate
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddLeaveType;
