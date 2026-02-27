import React, { useState, useEffect } from "react";
import axios from "axios";

function ProfileEdit() {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const userId = user._id || user.id;

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Editable form state
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        highestQualification: "",
        specialization: "",
        yearsOfExperience: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/faculty/get/${userId}`);
                const data = res.data;
                setProfileData(data);
                setForm({
                    name: data.name || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    highestQualification: data.highestQualification || "",
                    specialization: data.specialization || "",
                    yearsOfExperience: data.yearsOfExperience !== undefined ? data.yearsOfExperience : "",
                    password: "",
                    confirmPassword: ""
                });
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
        setSuccessMsg("");
    };

    const validate = async () => {
        const newErrors = {};

        if (!form.name.trim()) newErrors.name = "Name is required";
        else if (!/^[A-Za-z\s.]+$/.test(form.name)) newErrors.name = "Only letters, spaces, and dots allowed";

        if (!form.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
            newErrors.phone = "Enter a valid 10-digit Indian mobile number";
        } else {
            // Check phone number uniqueness for profile editing
            try {
                const response = await fetch(`http://localhost:5000/api/faculty/check-phone/${form.phone}`);
                const data = await response.json();
                
                if (data.exists && data.userId !== userId) {
                    newErrors.phone = "This phone number is already registered with another user.";
                }
            } catch (err) {
                console.error("Error checking phone uniqueness:", err);
            }
        }
        if (form.address.trim().length > 0 && form.address.trim().length < 10)
            newErrors.address = "Address must be at least 10 characters";

        if (form.highestQualification.trim().length > 0 && !/^[a-zA-Z\s.]+$/.test(form.highestQualification))
            newErrors.highestQualification = "Only letters, spaces, and dots allowed";

        if (form.specialization.trim().length > 0 && !/^[a-zA-Z\s]+$/.test(form.specialization))
            newErrors.specialization = "Only letters and spaces allowed";

        if (form.yearsOfExperience !== "" && form.yearsOfExperience !== undefined) {
            const exp = Number(form.yearsOfExperience);
            if (isNaN(exp) || exp < 0 || exp > 50) newErrors.yearsOfExperience = "Must be a number between 0 and 50";
        }

        if (form.password) {
            if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
            if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await validate();
        if (!isValid) return;
        setSaving(true);
        setSuccessMsg("");

        try {
            const payload = {
                name: form.name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                highestQualification: form.highestQualification.trim(),
                specialization: form.specialization.trim(),
            };

            if (form.yearsOfExperience !== "") {
                payload.yearsOfExperience = Number(form.yearsOfExperience);
            }

            if (form.password) payload.password = form.password;

            const res = await axios.patch(`http://localhost:5000/api/faculty/profile/${userId}`, payload);

            // Update localStorage display name
            const updatedUser = { ...user, name: form.name };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            setProfileData(res.data.user || { ...profileData, ...payload });
            setSuccessMsg("Profile updated successfully!");
            setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update profile.";
            setErrors({ api: msg });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading your profile…</p>
                </div>
            </div>
        );
    }

    const inputCls = "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition";
    const labelCls = "block text-xs font-semibold text-gray-600 uppercase tracking-wide";
    const errorCls = "text-red-500 text-xs mt-1";

    const getDeptName = () => {
        if (!profileData?.departmentType) return "N/A";
        if (typeof profileData.departmentType === "object") return profileData.departmentType.departmentName || "N/A";
        return profileData.departmentType || "N/A";
    };

    const formatDate = (d) => {
        if (!d) return "N/A";
        return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                            {profileData?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{profileData?.name || "My Profile"}</h1>
                            <p className="text-purple-200 text-sm capitalize">{profileData?.role || user.role} — {getDeptName()}</p>
                            <p className="text-purple-200 text-xs mt-0.5">{profileData?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Read-Only Info Section */}
                <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-6">
                    <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center">🔒</span>
                        Account Information (Read-Only)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: "Email", value: profileData?.email },
                            { label: "Role", value: profileData?.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : "—" },
                            { label: "Department", value: getDeptName() },
                            { label: "Date of Joining", value: formatDate(profileData?.dateOfJoining) }
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</div>
                                <div className="text-sm text-gray-800 font-medium">{value || "—"}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editable Form */}
                <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
                    <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded text-xs flex items-center justify-center">✏️</span>
                        Edit Profile
                    </h2>

                    {successMsg && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-semibold">
                            ✓ {successMsg}
                        </div>
                    )}
                    {errors.api && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {errors.api}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className={inputCls}
                                    placeholder="Your full name"
                                />
                                {errors.name && <p className={errorCls}>{errors.name}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Phone Number * <span className="normal-case font-normal text-gray-400">(starts with 9, 10 digits)</span></label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={inputCls}
                                    placeholder="9XXXXXXXXX"
                                />
                                {errors.phone && <p className={errorCls}>{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className={labelCls}>Address</label>
                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                rows={2}
                                className={`${inputCls} resize-none`}
                                placeholder="Your complete address (minimum 10 characters)"
                            />
                            {errors.address && <p className={errorCls}>{errors.address}</p>}
                        </div>

                        {/* Qualification & Specialization */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Highest Qualification</label>
                                <input
                                    type="text"
                                    name="highestQualification"
                                    value={form.highestQualification}
                                    onChange={handleChange}
                                    className={inputCls}
                                    placeholder="e.g. M.Tech, Ph.D"
                                />
                                {errors.highestQualification && <p className={errorCls}>{errors.highestQualification}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Specialization</label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={form.specialization}
                                    onChange={handleChange}
                                    className={inputCls}
                                    placeholder="e.g. Machine Learning"
                                />
                                {errors.specialization && <p className={errorCls}>{errors.specialization}</p>}
                            </div>
                        </div>

                        {/* Years of Experience */}
                        <div>
                            <label className={labelCls}>Years of Experience</label>
                            <input
                                type="number"
                                name="yearsOfExperience"
                                value={form.yearsOfExperience}
                                onChange={handleChange}
                                className={inputCls}
                                placeholder="0–50"
                                min={0}
                                max={50}
                            />
                            {errors.yearsOfExperience && <p className={errorCls}>{errors.yearsOfExperience}</p>}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs text-gray-400 mb-4 font-medium">Change Password (optional — leave blank to keep current password)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>New Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    {errors.password && <p className={errorCls}>{errors.password}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    {errors.confirmPassword && <p className={errorCls}>{errors.confirmPassword}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 shadow shadow-purple-200 text-sm"
                            >
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfileEdit;
