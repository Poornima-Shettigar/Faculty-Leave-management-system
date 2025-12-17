import React, { useState, useEffect } from "react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6];

function MyTimetable() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id || user.id;

  const [schedule, setSchedule] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [totalPeriods, setTotalPeriods] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadMyTimetable();
  }, [userId]);

  const loadMyTimetable = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/timetable/user/${userId}`);
      setSchedule(res.data.schedule || {});
      setSubjects(res.data.subjects || []);
      setUserInfo(res.data.user || {});
      setTotalPeriods(res.data.totalPeriods || 0);
    } catch (err) {
      console.error("Error loading timetable:", err);
      setSchedule({});
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodEntry = (day, period) => {
    const daySchedule = schedule[day] || [];
    return daySchedule.find(entry => entry.period === period);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading your timetable...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Timetable</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name: </span>
              <span className="font-semibold text-gray-900">{userInfo.name || user.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Department: </span>
              <span className="font-semibold text-gray-900">{userInfo.department || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Periods: </span>
              <span className="font-semibold text-blue-600">{totalPeriods} per week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Summary */}
      {subjects.length > 0 && (
        <div className="mb-6 bg-white shadow-lg rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-blue-900 mb-1">{subject.subjectName}</h3>
                {subject.subjectCode && (
                  <p className="text-xs text-blue-700 mb-2">Code: {subject.subjectCode}</p>
                )}
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Classes: </span>
                  <span>{subject.classes.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-6 py-4 text-left font-semibold">Day</th>
                {PERIODS.map((p) => (
                  <th key={p} className="px-4 py-4 text-center font-semibold">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {DAYS.map((day) => {
                const daySchedule = schedule[day] || [];
                const hasClasses = daySchedule.length > 0;

                return (
                  <tr
                    key={day}
                    className={`hover:bg-gray-50 transition ${
                      hasClasses ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="px-6 py-4 font-bold text-gray-800 border-r border-gray-200">
                      {day}
                      {hasClasses && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          ({daySchedule.length} period{daySchedule.length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </td>
                    {PERIODS.map((period) => {
                      const entry = getPeriodEntry(day, period);
                      return (
                        <td
                          key={period}
                          className={`px-4 py-4 text-center border-r border-gray-200 ${
                            entry ? "bg-green-50" : ""
                          }`}
                          style={{ minHeight: "100px", verticalAlign: "top" }}
                        >
                          {entry ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-blue-700 text-sm">
                                {entry.subject}
                              </div>
                              {entry.subjectCode && (
                                <div className="text-xs text-gray-600">
                                  ({entry.subjectCode})
                                </div>
                              )}
                              <div className="text-xs font-medium text-gray-700 bg-white rounded px-2 py-1 inline-block">
                                {entry.className}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">Free</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day Detail View */}
      {selectedDay && schedule[selectedDay] && schedule[selectedDay].length > 0 && (
        <div className="mt-6 bg-white shadow-lg rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedDay} Schedule
          </h3>
          <div className="space-y-3">
            {schedule[selectedDay].map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                    {entry.period}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{entry.subject}</h4>
                    {entry.subjectCode && (
                      <p className="text-sm text-gray-600">Code: {entry.subjectCode}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white border border-gray-300 rounded-lg px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">
                      Class: {entry.className}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPeriods === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No periods assigned yet. Contact your HOD or Administrator.
          </p>
        </div>
      )}
    </div>
  );
}

export default MyTimetable;











