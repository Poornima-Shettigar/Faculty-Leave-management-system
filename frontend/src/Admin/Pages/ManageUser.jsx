import React, { useState, useEffect } from "react";

function ManageFaculty() {
  const [form, setForm] = useState({
    _id: null,
    name: "",
    email: "",
    phone: "",
    password: "",
    departmentType: "",
    employeeType: "",
    dateOfJoining: "",
    address: "",
    highestQualification: "",
    specialization: "",
    yearsOfExperience: ""
  });

  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const getDepartments = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/department/list");
        const data = await response.json();
        setDepartments(data);
      } catch (err) {
        console.error("Error loading departments:", err);
      }
    };
    getDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/faculty/list");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = async () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (!/^[A-Za-z ]+$/.test(form.name)) newErrors.name = "Only alphabets allowed";

    if (!form.phone.trim()) newErrors.phone = "Phone number required";
    else if (!/^[6-9]\d{9}$/.test(form.phone)) newErrors.phone = "Enter a valid 10-digit Indian mobile number";
    else {
      // Check phone number uniqueness for editing
      try {
        const response = await fetch(`http://localhost:5000/api/faculty/check-phone/${form.phone}`);
        const data = await response.json();
        
        if (data.exists && data.userId !== form._id) {
          newErrors.phone = "This phone number is already registered with another user.";
        }
      } catch (err) {
        console.error("Error checking phone uniqueness:", err);
      }
    }

    if (form.address && form.address.trim().length > 0 && form.address.trim().length < 10)
      newErrors.address = "Address must be at least 10 characters";

    if (form.highestQualification && form.highestQualification.trim().length > 0 &&
      !/^[a-zA-Z\s.]+$/.test(form.highestQualification))
      newErrors.highestQualification = "Only letters, spaces, and dots allowed";

    if (form.specialization && form.specialization.trim().length > 0 &&
      !/^[a-zA-Z\s]+$/.test(form.specialization))
      newErrors.specialization = "Only letters and spaces allowed";

    if (form.yearsOfExperience !== "" && form.yearsOfExperience !== undefined) {
      const exp = Number(form.yearsOfExperience);
      if (isNaN(exp) || exp < 0 || exp > 50) newErrors.yearsOfExperience = "Must be between 0 and 50";
    }

    if (!form.departmentType) newErrors.departmentType = "Select a department";
    if (!form.employeeType) newErrors.employeeType = "Select employee type";
    if (!form.dateOfJoining) newErrors.dateOfJoining = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validate();
    if (!isValid) return;

    const roleMapping = { teaching: "teaching", "non-teaching": "non-teaching", hod: "hod", director: "director" };
    const payload = {
      name: form.name,
      phone: form.phone,
      departmentType: form.departmentType,
      employeeType: form.employeeType,
      role: roleMapping[form.employeeType] || "teaching",
      dateOfJoining: form.dateOfJoining,
      address: form.address,
      highestQualification: form.highestQualification,
      specialization: form.specialization,
      yearsOfExperience: form.yearsOfExperience !== "" ? Number(form.yearsOfExperience) : undefined
    };

    if (form.password) payload.password = form.password;

    try {
      const url = `http://localhost:5000/api/faculty/${form._id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("User updated successfully");
        setIsEditing(false);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (err) { console.error(err); alert("Server Error"); }
  };

  const handleEdit = (user) => {
    setForm({
      _id: user._id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      departmentType: user.departmentType?._id || "",
      employeeType: user.employeeType || "",
      dateOfJoining: user.dateOfJoining ? user.dateOfJoining.split("T")[0] : "",
      address: user.address || "",
      highestQualification: user.highestQualification || "",
      specialization: user.specialization || "",
      yearsOfExperience: user.yearsOfExperience !== undefined ? user.yearsOfExperience : ""
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/faculty/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) { alert(data.message); fetchUsers(); }
      else alert(data.message);
    } catch (err) { console.error(err); alert("Server Error"); }
  };

  const inputCls = "mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700";
  const errorCls = "text-red-500 text-xs mt-1";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Faculty Management</h2>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Phone", "Department", "Date of Joining", "Role", "Qualification", "Experience", "Actions"].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.departmentType?.departmentName || "N/A"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : "N/A"}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.highestQualification || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.yearsOfExperience !== undefined ? `${user.yearsOfExperience} yrs` : "—"}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(user)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition">Edit</button>
                  <button onClick={() => handleDelete(user._id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Popup Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Faculty Details</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-blue-200 hover:text-white transition text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} className={inputCls} />
                  {errors.name && <p className={errorCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className={labelCls}>Email (read-only)</label>
                  <input type="email" name="email" value={form.email} readOnly className={`${inputCls} bg-gray-100 cursor-not-allowed`} />
                </div>
              </div>

              {/* Row 2: Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone * (starts with 9, 10 digits)</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
                  {errors.phone && <p className={errorCls}>{errors.phone}</p>}
                </div>
                <div>
                  <label className={labelCls}>Password (Leave blank to keep unchanged)</label>
                  <input type="text" name="password" value={form.password} onChange={handleChange} className={inputCls} placeholder="Leave blank to keep" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className={labelCls}>Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2} className={`${inputCls} resize-none`} placeholder="Enter address (min 10 characters)" />
                {errors.address && <p className={errorCls}>{errors.address}</p>}
              </div>

              {/* Row 3: Qualification & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Highest Qualification</label>
                  <input type="text" name="highestQualification" value={form.highestQualification} onChange={handleChange} className={inputCls} placeholder="e.g. M.Tech" />
                  {errors.highestQualification && <p className={errorCls}>{errors.highestQualification}</p>}
                </div>
                <div>
                  <label className={labelCls}>Specialization</label>
                  <input type="text" name="specialization" value={form.specialization} onChange={handleChange} className={inputCls} placeholder="e.g. Computer Science" />
                  {errors.specialization && <p className={errorCls}>{errors.specialization}</p>}
                </div>
              </div>

              {/* Row 4: Years of Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Years of Experience</label>
                  <input type="number" name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange} className={inputCls} min={0} max={50} placeholder="0–50" />
                  {errors.yearsOfExperience && <p className={errorCls}>{errors.yearsOfExperience}</p>}
                </div>
                <div>
                  <label className={labelCls}>Date of Joining *</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={form.dateOfJoining}
                    onChange={handleChange}
                    className={inputCls}
                  />
                  {errors.dateOfJoining && <p className={errorCls}>{errors.dateOfJoining}</p>}
                </div>
              </div>

              {/* Row 5: Department & Employee Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Department *</label>
                  <select name="departmentType" value={form.departmentType} onChange={handleChange} className={inputCls}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.departmentName}</option>)}
                  </select>
                  {errors.departmentType && <p className={errorCls}>{errors.departmentType}</p>}
                </div>
                <div>
                  <label className={labelCls}>Employee Type *</label>
                  <select name="employeeType" value={form.employeeType} onChange={handleChange} className={inputCls}>
                    <option value="">Select</option>
                    <option value="teaching">Teaching</option>
                    <option value="non-teaching">Non-Teaching</option>
                    <option value="hod">HOD</option>
                    <option value="director">Director</option>
                  </select>
                  {errors.employeeType && <p className={errorCls}>{errors.employeeType}</p>}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold shadow"
                >
                  Update Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageFaculty;
