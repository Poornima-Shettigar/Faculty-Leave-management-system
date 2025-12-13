import React, { useEffect, useState } from "react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function TimetableView() {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  // --- Selection State ---
  const [departments, setDepartments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // --- Data State ---
  const [timetable, setTimetable] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // --- Edit Modal State ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ day: "", period: "", subjectId: "", facultyId: "" });

  // --- 1. Fetch Departments ---
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/department/list")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Failed to load departments", err));
  }, []);

  // --- 2. Auto-select HOD's department ---
  useEffect(() => {
    if ((user.role || "").toLowerCase() === "hod" && departments.length > 0) {
      const userDeptId = user.departmentType?._id || user.departmentType;
      if (departments.some((d) => d._id === userDeptId)) setSelectedDept(userDeptId);
    }
  }, [departments, user]);

  // --- 3. Populate Classes ---
  useEffect(() => {
    if (selectedDept) {
      const deptObj = departments.find((d) => d._id === selectedDept);
      setAvailableClasses(deptObj?.classNames || []);
    } else {
      setAvailableClasses([]);
    }
    setSelectedClass(""); // Reset class selection
  }, [selectedDept, departments]);

  // --- 4. Fetch timetable & resources ---
  useEffect(() => {
    if (selectedDept && selectedClass) {
      fetchTimetable();
      fetchResources();
    } else {
      setTimetable([]);
      setTableId(null);
      setSubjectsList([]);
      setFacultyList([]);
    }
  }, [selectedDept, selectedClass]);

  const fetchTimetable = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/timetable/${selectedDept}/${selectedClass}`);
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
        axios.get(`http://localhost:5000/api/subject/${selectedDept}/${selectedClass}`),
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
    if (!window.confirm(`Are you sure you want to clear ${day}?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/timetable/delete/day/${tableId}/${day}`);
      fetchTimetable();
    } catch (err) {
      console.error(err);
    }
  };

  const getSubjectName = (subjectId) =>
    subjectsList.find((s) => s._id === subjectId)?.subjectName || "—";
  const getFacultyName = (facultyId) =>
    facultyList.find((f) => f._id === facultyId)?.name || "—";

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Timetable Viewer</h2>

      {/* Department & Class Selection */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <select
          onChange={(e) => setSelectedDept(e.target.value)}
          value={selectedDept}
          disabled={(user.role || "").toLowerCase() === "hod"}
        >
          <option value="">-- Select Dept --</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.departmentName}
            </option>
          ))}
        </select>

        <select onChange={(e) => setSelectedClass(e.target.value)} value={selectedClass}>
          <option value="">-- Select Class --</option>
          {availableClasses.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Timetable Table */}
      {selectedDept && selectedClass && (
        <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
          <thead style={{ background: "#eee" }}>
            <tr>
              <th>Day</th>
              {PERIODS.map((p) => (
                <th key={p}>{p}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const dayRows = timetable.filter((t) => t.day === day);
              return (
                <tr key={day}>
                  <td style={{ fontWeight: "bold" }}>{day}</td>
                  {PERIODS.map((period) => {
                    const entry = dayRows.find((e) => Number(e.period) === period);
                    return (
                      <td key={period} style={{ height: "80px" }}>
                        {entry ? (
                          <>
                            <div style={{ fontWeight: "bold", color: "#007BFF" }}>{getSubjectName(entry.subjectId)}</div>
                            <div style={{ fontSize: "0.85em", color: "#555" }}>{getFacultyName(entry.facultyId)}</div>
                          </>
                        ) : (
                          <span style={{ color: "#ccc" }}>Free</span>
                        )}
                        <button
                          onClick={() => openEditModal(day, period, entry)}
                          style={{ display: "block", margin: "5px auto", fontSize: "0.7em" }}
                        >
                          Edit
                        </button>
                      </td>
                    );
                  })}
                  <td>
                    <button onClick={() => deleteDay(day)} style={{ color: "red" }}>
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          }}
        >
          <div style={{ background: "white", padding: 20, width: 300 }}>
            <h3>Edit Period</h3>
            <select
              value={editData.subjectId}
              onChange={(e) => setEditData({ ...editData, subjectId: e.target.value })}
              style={{ width: "100%", marginBottom: 10 }}
            >
              <option value="">Select Subject</option>
              {subjectsList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.subjectName}
                </option>
              ))}
            </select>
            <select
              value={editData.facultyId}
              onChange={(e) => setEditData({ ...editData, facultyId: e.target.value })}
              style={{ width: "100%", marginBottom: 10 }}
            >
              <option value="">Select Faculty</option>
              {facultyList.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setIsEditOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
