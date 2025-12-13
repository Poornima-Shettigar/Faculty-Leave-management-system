import React, { useState, useEffect } from "react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function AddTimetable() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [selectedDept] = useState(user.departmentType || "");

  const [departments, setDepartments] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [subjectsList, setSubjectsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  const [gridData, setGridData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/department/list")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Error fetching departments", err));
  }, []);

  useEffect(() => {
    if (selectedDept && departments.length > 0) {
      const deptObj = departments.find((d) => d._id === selectedDept);
      setAvailableClasses(deptObj?.classNames || []);
    }
  }, [selectedDept, departments]);

  useEffect(() => {
    if (selectedDept && selectedClass && selectedSemester) fetchResources();
    else {
      setSubjectsList([]);
    }
  }, [selectedDept, selectedClass, selectedSemester]);

  const fetchResources = async () => {
    try {
      const subRes = await axios.get(
        `http://localhost:5000/api/subject/${selectedDept}/${selectedClass}/${selectedSemester}`
      );
      setSubjectsList(subRes.data);

      const facRes = await axios.get(
        `http://localhost:5000/api/faculty/getByDept/${selectedDept}`
      );
      setFacultyList(facRes.data);
    } catch (err) {
      console.error("Error loading resources", err);
    }
  };

  const handleCellChange = (day, period, field, value) => {
    const key = `${day}-${period}`;
    setGridData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSemester) {
      alert("Please select class and semester");
      return;
    }

    setLoading(true);
    const timetableArray = [];

    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        const key = `${day}-${period}`;
        const cell = gridData[key];

        if (cell && cell.subject) {
          timetableArray.push({
            day,
            period,
            subject: cell.subject,
            faculty: cell.faculty || null,
          });
        }
      });
    });

    if (timetableArray.length === 0) {
      alert("Please fill at least one subject.");
      setLoading(false);
      return;
    }

    const payload = {
      departmentType: selectedDept,
      className: selectedClass,
      semester: Number(selectedSemester),
      timetable: timetableArray,
    };

    try {
      await axios.post("http://localhost:5000/api/timetable/create", payload);
      alert("Timetable created successfully!");
      setGridData({});
    } catch (err) {
      console.error(err);
      alert("Error saving timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
          Create Timetable
        </h2>

        <p className="font-semibold text-green-700 mb-4 text-center">
          Department: {departments.find((d) => d._id === selectedDept)?.departmentName}
        </p>

        <div className="mb-6 text-center flex gap-4 justify-center items-center">
          <div>
            <label className="font-semibold mr-3">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSemester("");
                setGridData({});
              }}
              className="border border-gray-300 p-2 rounded-lg w-60 shadow-sm focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Select Class --</option>
              {availableClasses.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div>
              <label className="font-semibold mr-3">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setGridData({});
                }}
                className="border border-gray-300 p-2 rounded-lg w-48 shadow-sm focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Select Semester --</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedClass && selectedSemester ? (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse shadow-md">
                <thead>
                  <tr className="bg-blue-600 text-white text-sm">
                    <th className="p-2">Day</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="p-2">
                        Period {p}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="even:bg-gray-100">
                      <td className="font-bold bg-gray-200 p-2">{day}</td>

                      {PERIODS.map((period) => {
                        const key = `${day}-${period}`;
                        return (
                          <td key={period} className="p-2 border">
                            <select
                              className="w-full border border-gray-300 p-1 rounded mb-1 text-sm"
                              value={gridData[key]?.subject || ""}
                              onChange={(e) => {
                                const subjectId = e.target.value;
                                const selectedSub = subjectsList.find(
                                  (s) => s._id === subjectId
                                );

                                handleCellChange(day, period, "subject", subjectId);
                                handleCellChange(
                                  day,
                                  period,
                                  "faculty",
                                  selectedSub?.faculty?._id || ""
                                );
                              }}
                            >
                              <option value="">- Subject -</option>
                              {subjectsList.map((sub) => (
                                <option key={sub._id} value={sub._id}>
                                  {sub.subjectName} (Sem {sub.semester})
                                </option>
                              ))}
                            </select>

                            <input
                              disabled
                              value={
                                subjectsList.find(
                                  (s) => s._id === gridData[key]?.subject
                                )?.faculty?.name || ""
                              }
                              className="w-full bg-gray-100 text-gray-600 p-1 rounded text-sm"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-3 text-white rounded-lg shadow-md text-lg transition-all ${
                  loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Saving..." : "Save Timetable"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 text-lg">Select Class and Semester to continue</p>
        )}
      </div>
    </div>
  );
}