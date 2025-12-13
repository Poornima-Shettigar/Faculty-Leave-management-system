import React, { useEffect, useState } from "react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function TimetableView() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = (user.role || "").toLowerCase();
  const isHOD = userRole === "hod";

  // --- Selection State ---
  const [departments, setDepartments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  // --- Data State ---
  const [timetable, setTimetable] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // --- Edit Modal State ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ day: "", period: "", subjectId: "", facultyId: "" });

  // --- Fetch Departments ---
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/department/list")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Failed to load departments", err));
  }, []);

  // --- Auto-select HOD department ---
  useEffect(() => {
    if (isHOD && departments.length > 0) {
      const userDeptId = user.departmentType?._id || user.departmentType;
      if (departments.some((d) => d._id === userDeptId)) setSelectedDept(userDeptId);
    }
  }, [departments, user, isHOD]);

  // --- Populate Classes when department is selected ---
  useEffect(() => {
    if (selectedDept) {
      const deptObj = departments.find((d) => d._id === selectedDept);
      setAvailableClasses(deptObj?.classNames || []);
    } else {
      setAvailableClasses([]);
    }
    setSelectedClass(""); // Reset class
    setSelectedSemester(""); // Reset semester
  }, [selectedDept, departments]);

  // --- Fetch timetable & resources ---
  useEffect(() => {
    if (selectedDept && selectedClass && selectedSemester) {
      fetchTimetable();
      fetchResources();
    } else {
      setTimetable([]);
      setTableId(null);
      setSubjectsList([]);
      setFacultyList([]);
    }
  }, [selectedDept, selectedClass, selectedSemester]);

  const fetchTimetable = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/timetable/${selectedDept}/${selectedClass}/${selectedSemester}`
      );
      setTimetable(res.data?.timetable || []);
      setTableId(res.data?._id || null);
    } catch (err) {
      console.error("Error fetching timetable:", err);
      setTimetable([]);
      setTableId(null);
    }
  };

  const fetchResources = async () => {
    try {
      const [subRes, facRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/subject/${selectedDept}/${selectedClass}/${selectedSemester}`),
        axios.get(`http://localhost:5000/api/faculty/getByDept/${selectedDept}`)
      ]);
      setSubjectsList(subRes.data || []);
      setFacultyList(facRes.data || []);
    } catch (err) {
      console.error("Error fetching resources:", err);
    }
  };

  const openEditModal = (day, period, entry) => {
    setEditData({
      day,
      period,
      subjectId: entry?.subjectId || "",
      facultyId: entry?.facultyId || ""
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!tableId) return alert("No timetable found!");
    try {
      await axios.put(`http://localhost:5000/api/timetable/update/period/${tableId}`, editData);
      alert("Period updated successfully!");
      setIsEditOpen(false);
      fetchTimetable();
    } catch (err) {
      console.error(err);
      alert("Failed to update period");
    }
  };

  const deleteDay = async (day) => {
    if (!tableId) return;
    if (!window.confirm(`Are you sure you want to delete all periods for ${day}?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/timetable/delete/day/${tableId}/${day}`);
      alert(`${day} deleted successfully!`);
      fetchTimetable();
    } catch (err) {
      console.error(err);
      alert("Failed to delete day");
    }
  };

  const deleteEntireTimetable = async () => {
    if (!tableId) return;
    if (!window.confirm(`Are you sure you want to delete the entire timetable for ${selectedClass}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/timetable/delete/${tableId}`);
      alert("Timetable deleted successfully!");
      setTimetable([]);
      setTableId(null);
      setSelectedClass("");
    } catch (err) {
      console.error(err);
      alert("Failed to delete timetable");
    }
  };

  const getSubjectName = (subjectId) =>
    subjectsList.find((s) => s._id === subjectId)?.subjectName || 
    timetable.find((s) => s.subjectId === subjectId)?.subject || "—";
  const getFacultyName = (facultyId) =>
    facultyList.find((f) => f._id === facultyId)?.name || 
    timetable.find((f) => f.facultyId === facultyId)?.faculty || "—";

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Timetable Viewer</h2>
        {isHOD && tableId && (
          <button
            onClick={deleteEntireTimetable}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Delete Entire Timetable
          </button>
        )}
      </div>

      {/* Department, Class & Semester Selection */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <select
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setSelectedClass("");
            setSelectedSemester("");
          }}
          value={selectedDept}
          disabled={isHOD}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="">-- Select Dept --</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.departmentName}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedSemester("");
          }}
          value={selectedClass}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="">-- Select Class --</option>
          {availableClasses.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        {selectedClass && (
          <select
            onChange={(e) => setSelectedSemester(e.target.value)}
            value={selectedSemester}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="">-- Select Semester --</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Timetable Table */}
      {selectedDept && selectedClass && selectedSemester && (
        <>
          {timetable.length === 0 ? (
            <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>
              No timetable available for {selectedClass}.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}
              >
                <thead style={{ background: "#2563eb", color: "white" }}>
                  <tr>
                    <th>Day</th>
                    {PERIODS.map((p) => (
                      <th key={p}>Period {p}</th>
                    ))}
                    {isHOD && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const dayRows = timetable.filter((t) => t.day === day);
                    return (
                      <tr key={day}>
                        <td style={{ fontWeight: "bold", background: "#f3f4f6" }}>{day}</td>
                        {PERIODS.map((period) => {
                          const entry = dayRows.find((e) => Number(e.period) === period);
                          return (
                            <td key={period} style={{ height: "80px", verticalAlign: "top" }}>
                              {entry ? (
                                <>
                                  <div style={{ fontWeight: "bold", color: "#007BFF", marginBottom: "4px" }}>
                                    {getSubjectName(entry.subjectId)}
                                  </div>
                                  <div style={{ fontSize: "0.85em", color: "#555" }}>
                                    {getFacultyName(entry.facultyId)}
                                  </div>
                                  {isHOD && (
                                    <button
                                      onClick={() => openEditModal(day, period, entry)}
                                      style={{
                                        marginTop: "8px",
                                        padding: "4px 8px",
                                        fontSize: "0.75em",
                                        backgroundColor: "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                      }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span style={{ color: "#ccc" }}>Free</span>
                                  {isHOD && (
                                    <button
                                      onClick={() => openEditModal(day, period, null)}
                                      style={{
                                        display: "block",
                                        margin: "8px auto 0",
                                        padding: "4px 8px",
                                        fontSize: "0.75em",
                                        backgroundColor: "#6366f1",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                      }}
                                    >
                                      Add
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          );
                        })}
                        {isHOD && (
                          <td style={{ verticalAlign: "middle" }}>
                            <button
                              onClick={() => deleteDay(day)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.85em"
                              }}
                            >
                              Delete Day
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={() => setIsEditOpen(false)}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
              maxWidth: "90%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#1f2937" }}>
              Edit Period - {editData.day} Period {editData.period}
            </h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Subject
              </label>
              <select
                value={editData.subjectId}
                onChange={(e) => {
                  const selectedSub = subjectsList.find((s) => s._id === e.target.value);
                  setEditData({
                    ...editData,
                    subjectId: e.target.value,
                    facultyId: selectedSub?.faculty?._id || editData.facultyId
                  });
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="">Select Subject</option>
                {subjectsList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
                Faculty
              </label>
              <select
                value={editData.facultyId}
                onChange={(e) => setEditData({ ...editData, facultyId: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="">Select Faculty</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
