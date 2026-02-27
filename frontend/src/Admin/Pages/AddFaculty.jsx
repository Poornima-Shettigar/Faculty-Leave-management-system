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
    dateOfJoining: "",
    address: "",
    highestQualification: "",
    specialization: "",
    yearsOfExperience: ""
  });

  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  //  const minDate = formatDate(today);
  const minDate = today.toISOString().split("T")[0];

  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 1);
  const maxDate = formatDate(maxDateObj);
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

  const validate = async () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (!/^[A-Za-z ]+$/.test(form.name)) newErrors.name = "Only alphabets allowed";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email";

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";
    } else {
      // Check phone number uniqueness
      try {
        const response = await fetch(`http://localhost:5000/api/faculty/check-phone/${form.phone}`);
        const data = await response.json();
        
        if (data.exists) {
          // For new user creation, any existing phone is duplicate
          if (!form._id) {
            newErrors.phone = "This phone number is already registered with another user.";
          } else {
            // For editing, check if the phone belongs to a different user
            if (data.userId !== form._id) {
              newErrors.phone = "This phone number is already registered with another user.";
            }
          }
        }
      } catch (err) {
        console.error("Error checking phone uniqueness:", err);
      }
    }

    if (!form.address.trim()) newErrors.address = "Address is required";
    else if (form.address.length < 10) newErrors.address = "Address must be at least 10 characters";

    if (!form.highestQualification.trim()) newErrors.highestQualification = "Highest Qualification is required";
    else if (!/^[a-zA-Z\s.]+$/.test(form.highestQualification)) newErrors.highestQualification = "Only letters, spaces, and dots allowed";

    if (!form.specialization.trim()) newErrors.specialization = "Specialization is required";
    else if (!/^[a-zA-Z\s]+$/.test(form.specialization)) newErrors.specialization = "Only letters and spaces allowed";

    if (form.yearsOfExperience === "") newErrors.yearsOfExperience = "Years of Experience is required";
    else {
      const exp = Number(form.yearsOfExperience);
      if (isNaN(exp) || exp < 0 || exp > 50) newErrors.yearsOfExperience = "Must be between 0 and 50";
    }

    if (!form._id) {
      if (form.password && form.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
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
      email: form.email,
      password: form.password || "pim@123",
      phone: form.phone,
      departmentType: form.departmentType,
      employeeType: form.employeeType,
      role: roleMapping[form.employeeType] || "teaching",
      dateOfJoining: form.dateOfJoining,
      address: form.address,
      highestQualification: form.highestQualification,
      specialization: form.specialization,
      yearsOfExperience: Number(form.yearsOfExperience)
    };

    try {
      const url = form._id ? `http://localhost:5000/api/users/${form._id}` : "http://localhost:5000/api/faculty/add";
      const method = form._id ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        alert(`User ${form._id ? "updated" : "added"} successfully`);
        setForm({ _id: null, name: "", email: "", phone: "", password: "", departmentType: "", employeeType: "", dateOfJoining: "", address: "", highestQualification: "", specialization: "", yearsOfExperience: "" });
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
      dateOfJoining: user.dateOfJoining,
      address: user.address || "",
      highestQualification: user.highestQualification || "",
      specialization: user.specialization || "",
      yearsOfExperience: user.yearsOfExperience || ""
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="adduser-card overflow-y-auto max-h-[90vh]">
        <h2>{form._id ? "Edit Faculty" : "Add New Faculty"}</h2>
        <form className="adduser-form" onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input type="text" name="name" value={form.name} onChange={handleChange} />{errors.name && <p className="error-text">{errors.name}</p>}</div>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} />{errors.email && <p className="error-text">{errors.email}</p>}</div>
          <div className="form-group"><label>Password </label><input type="text" name="password" value={form.password} onChange={handleChange} />{errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div className="form-group"><label>Phone</label><input type="text" name="phone" value={form.phone} onChange={handleChange} />{errors.phone && <p className="error-text">{errors.phone}</p>}</div>

          {/* New Profile Fields */}
          <div className="form-group">
            <label>Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} className="w-full border p-2 rounded" />
            {errors.address && <p className="error-text">{errors.address}</p>}
          </div>
          <div className="form-group">
            <label>Highest Qualification</label>
            <input type="text" name="highestQualification" value={form.highestQualification} onChange={handleChange} />
            {errors.highestQualification && <p className="error-text">{errors.highestQualification}</p>}
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input type="text" name="specialization" value={form.specialization} onChange={handleChange} />
            {errors.specialization && <p className="error-text">{errors.specialization}</p>}
          </div>
          <div className="form-group">
            <label>Years of Experience</label>
            <input type="number" name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange} />
            {errors.yearsOfExperience && <p className="error-text">{errors.yearsOfExperience}</p>}
          </div>

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
          <div className="form-group"><label>Date of Joining</label> <input
            type="date"
            name="dateOfJoining"
            value={form.dateOfJoining}
            onChange={handleChange}

            max={maxDate}
          />
            {errors.dateOfJoining && (
              <p className="error-text">{errors.dateOfJoining}</p>
            )}
          </div>
          <button className="adduser-btn" type="submit">{form._id ? "Update" : "Add Faculty"}</button>
        </form>
      </div>
    </div>
  );
}

export default ManageFaculty;

