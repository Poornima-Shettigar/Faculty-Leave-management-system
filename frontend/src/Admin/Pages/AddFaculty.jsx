import React, { useState, useEffect } from "react";
import "../styles/AddFaculty.css";

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
      const res = await fetch("http://localhost:5000/api/users");
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

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email";

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
      email: form.email,
      password: form.password || "",
      phone: form.phone,
      departmentType: form.departmentType,
      employeeType: form.employeeType,
      role: roleMapping[form.employeeType] || "teaching",
      dateOfJoining: form.dateOfJoining
    };

    try {
      const url = form._id ? `http://localhost:5000/api/users/${form._id}` : "http://localhost:5000/api/faculty/add";
      const method = form._id ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        alert(`User ${form._id ? "updated" : "added"} successfully`);
        setForm({ _id: null, name: "", email: "", phone: "", password: "", departmentType: "", employeeType: "", dateOfJoining: "" });
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
      dateOfJoining: user.dateOfJoining
    });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) { alert("User deleted successfully"); fetchUsers(); }
      else alert(data.message);
    } catch (err) { console.error(err); alert("Server Error"); }
  };

  return (
    <div className="adduser-card">
      <h2>{form._id ? "Edit Faculty" : "Add New Faculty"}</h2>
      <form className="adduser-form" onSubmit={handleSubmit}>
        {/* Form fields same as before */}
        <div className="form-group"><label>Name</label><input type="text" name="name" value={form.name} onChange={handleChange} />{errors.name && <p className="error-text">{errors.name}</p>}</div>
        <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} />{errors.email && <p className="error-text">{errors.email}</p>}</div>
        <div className="form-group"><label>Password (Leave blank to auto-generate)</label><input type="text" name="password" value={form.password} onChange={handleChange} /></div>
        <div className="form-group"><label>Phone</label><input type="text" name="phone" value={form.phone} onChange={handleChange} />{errors.phone && <p className="error-text">{errors.phone}</p>}</div>
        <div className="form-group"><label>Department</label>
          <select name="departmentType" value={form.departmentType} onChange={handleChange}>
            <option value="">Select Department</option>
            {departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.departmentName}</option>)}
          </select>
          {errors.departmentType && <p className="error-text">{errors.departmentType}</p>}
        </div>
        <div className="form-group"><label>Employee Type</label>
          <select name="employeeType" value={form.employeeType} onChange={handleChange}>
            <option value="">Select</option>
            <option value="teaching">Teaching</option>
            <option value="non-teaching">Non-Teaching</option>
            <option value="hod">HOD</option>
            <option value="director">Director</option>
          </select>
          {errors.employeeType && <p className="error-text">{errors.employeeType}</p>}
        </div>
        <div className="form-group"><label>Date of Joining</label><input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} />{errors.dateOfJoining && <p className="error-text">{errors.dateOfJoining}</p>}</div>
        <button className="adduser-btn" type="submit">{form._id ? "Update" : "Add Faculty"}</button>
      </form>

      <h2 style={{ marginTop: "30px" }}>All Users</h2>
      <div className="users-grid" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {users.map((user) => (
          <div key={user._id} className="user-card" style={{ padding: "15px" }}>
            <h3>{user.name}</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Department:</strong> {user.departmentType?.name || "N/A"}</p>
            <p><strong>Employee Type:</strong> {user.employeeType}</p>
            <p><strong>Date of Joining:</strong> {user.dateOfJoining}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <div style={{ marginTop: "10px" }}>
              <button className="edit-btn" onClick={() => handleEdit(user)} style={{ marginRight: "10px" }}>Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(user._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageFaculty;
