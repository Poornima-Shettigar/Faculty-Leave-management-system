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
    dateOfJoining: ""
  });

  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch departments
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

  // Fetch users
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

  const validate = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (!/^[A-Za-z ]+$/.test(form.name)) newErrors.name = "Only alphabets allowed";

    if (!form.phone.trim()) newErrors.phone = "Phone number required";
    else if (!/^[0-9]{10}$/.test(form.phone)) newErrors.phone = "Must be 10 digits";

    if (!form.departmentType) newErrors.departmentType = "Select a department";
    if (!form.employeeType) newErrors.employeeType = "Select employee type";
    if (!form.dateOfJoining) newErrors.dateOfJoining = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const roleMapping = { teaching: "teaching", "non-teaching": "non-teaching", hod: "hod", director: "director" };
    const payload = {
      name: form.name,
      phone: form.phone,
      departmentType: form.departmentType,
      employeeType: form.employeeType,
      role: roleMapping[form.employeeType] || "teaching",
      dateOfJoining: form.dateOfJoining
    };

    if (form.password) payload.password = form.password;

    try {
      const url = `http://localhost:5000/api/faculty/${form._id}`;
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "",
      departmentType: user.departmentType?._id || "",
      employeeType: user.employeeType,
      dateOfJoining: user.dateOfJoining.split("T")[0]
    });
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Faculty Management</h2>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name","Email","Phone","Department","Date of Joining","Role","Actions"].map((header) => (
                <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.phone}</td>
                <td className="px-4 py-2">{user.departmentType?.departmentName|| "N/A"}</td>
                {/* <td className="px-4 py-2">{user.employeeType}</td> */}
                <td className="px-4 py-2">{new Date(user.dateOfJoining).toLocaleDateString()}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(user)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
                  <button onClick={() => handleDelete(user._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup Form */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg relative">
            <h2 className="text-xl font-semibold mb-4">Edit Faculty</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-gray-700">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700">Email (read-only)</label>
                <input type="email" name="email" value={form.email} readOnly className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700">Password (Leave blank to keep unchanged)</label>
                <input type="text" name="password" value={form.password} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700">Phone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Department */}
              <div>
                <label className="block text-gray-700">Department</label>
                <select name="departmentType" value={form.departmentType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Department</option>
                  {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.departmentName}</option>)}
                </select>
                {errors.departmentType && <p className="text-red-500 text-sm mt-1">{errors.departmentName}</p>}
              </div>

              {/* Employee Type */}
              <div>
                <label className="block text-gray-700">Employee Type</label>
                <select name="employeeType" value={form.employeeType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                  <option value="hod">HOD</option>
                  <option value="director">Director</option>
                </select>
                {errors.employeeType && <p className="text-red-500 text-sm mt-1">{errors.employeeType}</p>}
              </div>

              {/* Date of Joining */}
              <div>
                <label className="block text-gray-700">Date of Joining</label>
                <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.dateOfJoining && <p className="text-red-500 text-sm mt-1">{errors.dateOfJoining}</p>}
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageFaculty;
