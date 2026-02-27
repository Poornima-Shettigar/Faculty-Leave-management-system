import React, { useState, useEffect } from "react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6];

// Professional light-color palette for subjects
const SUBJECT_PALETTES = [
  { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", badge: "#DBEAFE", dot: "#3B82F6" },   // Blue
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", badge: "#DCFCE7", dot: "#22C55E" },   // Green
  { bg: "#FDF4FF", border: "#E9D5FF", text: "#6B21A8", badge: "#F3E8FF", dot: "#A855F7" },   // Purple
  { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", badge: "#FFEDD5", dot: "#F97316" },   // Orange
  { bg: "#FFF1F2", border: "#FECDD3", text: "#9F1239", badge: "#FFE4E6", dot: "#F43F5E" },   // Rose
  { bg: "#F0FDFA", border: "#99F6E4", text: "#0F766E", badge: "#CCFBF1", dot: "#14B8A6" },   // Teal
  { bg: "#FEFCE8", border: "#FEF08A", text: "#854D0E", badge: "#FEF9C3", dot: "#EAB308" },   // Yellow
  { bg: "#F0F9FF", border: "#BAE6FD", text: "#0C4A6E", badge: "#E0F2FE", dot: "#0EA5E9" },   // Sky
];

const PERIOD_TIMES = {
  1: "9:00 – 10:00",
  2: "10:00 – 11:00",
  3: "11:00 – 12:00",
  4: "12:00 – 1:00",
  5: "2:00 – 3:00",
  6: "3:00 – 4:00",
};

function MyTimetable() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id || user.id;

  const [schedule, setSchedule] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [totalPeriods, setTotalPeriods] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [subjectColorMap, setSubjectColorMap] = useState({});

  useEffect(() => {
    loadMyTimetable();
  }, [userId]);

  const loadMyTimetable = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/timetable/user/${userId}`);
      const subjectsData = res.data.subjects || [];
      setSchedule(res.data.schedule || {});
      setSubjects(subjectsData);
      setUserInfo(res.data.user || {});
      setTotalPeriods(res.data.totalPeriods || 0);

      // Build a stable subject → palette map
      const map = {};
      subjectsData.forEach((s, i) => {
        map[s.subjectName] = SUBJECT_PALETTES[i % SUBJECT_PALETTES.length];
      });
      setSubjectColorMap(map);
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
    return daySchedule.find((entry) => entry.period === period);
  };

  const getPalette = (subjectName) => {
    return subjectColorMap[subjectName] || SUBJECT_PALETTES[0];
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.spinnerRing}></div>
        <p style={styles.loadingText}>Loading your timetable…</p>
        <style>{spinnerKeyframes}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{globalStyles}</style>

      {/* ── Header ── */}
      <div style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.headerTitle}>My Timetable</h1>
            <p style={styles.headerSubtitle}>
              Poornaprajna Institute of Management — Weekly Academic Schedule
            </p>
          </div>
          <div style={styles.todayBadge}>
            <span style={styles.todayDot}></span>
            {today}
          </div>
        </div>

        <div style={styles.statsRow}>
          {[
            { label: "Faculty", value: userInfo.name || user.name || "—", icon: "👤" },
            { label: "Department", value: userInfo.department || "Management", icon: "🏛️" },
            { label: "Weekly Periods", value: `${totalPeriods}`, icon: "📅" },
            { label: "Subjects", value: `${subjects.length}`, icon: "📚" },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <span style={styles.statIcon}>{s.icon}</span>
              <div>
                <div style={styles.statLabel}>{s.label}</div>
                <div style={styles.statValue}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Subject Legend ── */}
      {subjects.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionDot}></span>
            <h2 style={styles.sectionTitle}>Subject Legend</h2>
          </div>
          <div style={styles.legendGrid}>
            {subjects.map((subject, index) => {
              const palette = SUBJECT_PALETTES[index % SUBJECT_PALETTES.length];
              return (
                <div
                  key={index}
                  style={{
                    ...styles.legendItem,
                    backgroundColor: palette.bg,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <span style={{ ...styles.legendDot, backgroundColor: palette.dot }}></span>
                  <div>
                    <div style={{ ...styles.legendSubjectName, color: palette.text }}>
                      {subject.subjectName}
                    </div>
                    {subject.subjectCode && (
                      <div style={styles.legendCode}>{subject.subjectCode}</div>
                    )}
                    <div style={styles.legendClasses}>
                      {subject.classes.join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Timetable Grid ── */}
      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionDot}></span>
          <h2 style={styles.sectionTitle}>Weekly Schedule</h2>
          <span style={styles.sectionHint}>Click a row to expand day details</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thDay }}>Day</th>
                {PERIODS.map((p) => (
                  <th key={p} style={styles.th}>
                    <div style={styles.thPeriodLabel}>Period {p}</div>
                    <div style={styles.thTimeLabel}>{PERIOD_TIMES[p]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dayIndex) => {
                const daySchedule = schedule[day] || [];
                const isToday = today === day;
                const isSelected = selectedDay === day;

                return (
                  <tr
                    key={day}
                    style={{
                      ...styles.tr,
                      backgroundColor: isToday
                        ? "#EFF6FF"
                        : dayIndex % 2 === 0
                          ? "#FFFFFF"
                          : "#F9FAFB",
                    }}
                    className="timetable-row"
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                  >
                    {/* Day cell */}
                    <td style={styles.tdDay}>
                      <div style={styles.dayNameWrap}>
                        {isToday && <span style={styles.todayIndicator}></span>}
                        <span style={{ ...styles.dayName, color: isToday ? "#1D4ED8" : "#111827" }}>
                          {day}
                        </span>
                        {isToday && <span style={styles.todayTag}>Today</span>}
                      </div>
                      {daySchedule.length > 0 && (
                        <div style={styles.dayCount}>
                          {daySchedule.length} class{daySchedule.length !== 1 ? "es" : ""}
                        </div>
                      )}
                    </td>

                    {/* Period cells */}
                    {PERIODS.map((period) => {
                      const entry = getPeriodEntry(day, period);
                      const palette = entry ? getPalette(entry.subject) : null;

                      return (
                        <td key={period} style={styles.td}>
                          {entry ? (
                            <div
                              style={{
                                ...styles.subjectCell,
                                backgroundColor: palette.bg,
                                border: `1.5px solid ${palette.border}`,
                              }}
                              className="subject-pill"
                            >
                              <span
                                style={{ ...styles.subjectDot, backgroundColor: palette.dot }}
                              ></span>
                              <div style={{ ...styles.subjectName, color: palette.text }}>
                                {entry.subject}
                              </div>
                              {entry.subjectCode && (
                                <div style={styles.subjectCode}>{entry.subjectCode}</div>
                              )}
                              <div
                                style={{
                                  ...styles.classBadge,
                                  backgroundColor: palette.badge,
                                  color: palette.text,
                                }}
                              >
                                {entry.className}
                              </div>
                            </div>
                          ) : (
                            <div style={styles.freeCell}>—</div>
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

      {/* ── Day Detail Panel ── */}
      {selectedDay && schedule[selectedDay] && schedule[selectedDay].length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionDot}></span>
            <h2 style={styles.sectionTitle}>{selectedDay} — Detailed Schedule</h2>
            <button style={styles.closeBtn} onClick={() => setSelectedDay(null)}>
              ✕ Close
            </button>
          </div>

          <div style={styles.detailGrid}>
            {schedule[selectedDay].map((entry, index) => {
              const palette = getPalette(entry.subject);
              return (
                <div
                  key={index}
                  style={{
                    ...styles.detailCard,
                    backgroundColor: palette.bg,
                    border: `1.5px solid ${palette.border}`,
                  }}
                >
                  <div
                    style={{
                      ...styles.detailPeriodBadge,
                      backgroundColor: palette.dot,
                    }}
                  >
                    P{entry.period}
                  </div>
                  <div style={styles.detailBody}>
                    <div style={{ ...styles.detailSubjectName, color: palette.text }}>
                      {entry.subject}
                    </div>
                    {entry.subjectCode && (
                      <div style={styles.detailCode}>{entry.subjectCode}</div>
                    )}
                    <div style={styles.detailMeta}>
                      <span style={styles.detailMetaItem}>
                        🕐 {PERIOD_TIMES[entry.period]}
                      </span>
                      <span style={styles.detailMetaItem}>🏫 {entry.className}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {totalPeriods === 0 && (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📭</div>
          <h3 style={styles.emptyTitle}>No Schedule Assigned Yet</h3>
          <p style={styles.emptyDesc}>
            No periods have been assigned to you. Please contact your HOD or Administrator.
          </p>
          <div style={styles.emptyContact}>
            📧 admin@pim.ac.in &nbsp;|&nbsp; Contact your HOD
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F3F4F6",
    padding: "32px 24px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  // Header
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
    padding: "28px 32px",
    marginBottom: "24px",
  },
  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  headerTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px",
    letterSpacing: "-0.4px",
  },
  headerSubtitle: {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  },
  todayBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    color: "#1D4ED8",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 16px",
    borderRadius: "999px",
  },
  todayDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "12px 16px",
  },
  statIcon: { fontSize: "20px" },
  statLabel: { fontSize: "11px", color: "#6B7280", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" },
  statValue: { fontSize: "15px", fontWeight: "700", color: "#111827" },

  // Shared card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
    padding: "24px 28px",
    marginBottom: "24px",
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  sectionDot: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#6366F1",
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
    flex: 1,
  },
  sectionHint: {
    fontSize: "12px",
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  // Legend
  legendGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "10px",
  },
  legendItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    borderRadius: "10px",
    padding: "12px 14px",
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "4px",
  },
  legendSubjectName: {
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.3",
  },
  legendCode: {
    fontSize: "11px",
    color: "#6B7280",
    marginTop: "2px",
  },
  legendClasses: {
    fontSize: "11px",
    color: "#9CA3AF",
    marginTop: "2px",
  },

  // Table
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "800px",
  },
  th: {
    padding: "14px 10px",
    textAlign: "center",
    backgroundColor: "#F9FAFB",
    borderBottom: "2px solid #E5E7EB",
    borderRight: "1px solid #F3F4F6",
    verticalAlign: "middle",
  },
  thDay: {
    textAlign: "left",
    paddingLeft: "20px",
    minWidth: "160px",
  },
  thPeriodLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#374151",
  },
  thTimeLabel: {
    fontSize: "11px",
    color: "#9CA3AF",
    marginTop: "3px",
    fontWeight: "400",
  },
  tr: {
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
  tdDay: {
    padding: "14px 20px",
    borderBottom: "1px solid #F3F4F6",
    borderRight: "2px solid #E5E7EB",
    verticalAlign: "middle",
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #F3F4F6",
    borderRight: "1px solid #F3F4F6",
    verticalAlign: "top",
    minWidth: "130px",
  },
  dayNameWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  todayIndicator: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    flexShrink: 0,
  },
  dayName: {
    fontSize: "14px",
    fontWeight: "700",
  },
  todayTag: {
    fontSize: "10px",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    padding: "2px 8px",
    borderRadius: "999px",
    fontWeight: "600",
    letterSpacing: "0.3px",
  },
  dayCount: {
    fontSize: "11px",
    color: "#9CA3AF",
    marginTop: "3px",
    fontWeight: "500",
  },

  // Subject pill in grid
  subjectCell: {
    borderRadius: "8px",
    padding: "10px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    transition: "box-shadow 0.2s, transform 0.15s",
    minHeight: "80px",
    justifyContent: "center",
  },
  subjectDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    marginBottom: "2px",
  },
  subjectName: {
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.3",
  },
  subjectCode: {
    fontSize: "10px",
    color: "#9CA3AF",
    fontWeight: "500",
  },
  classBadge: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: "600",
    padding: "2px 7px",
    borderRadius: "999px",
    marginTop: "4px",
    alignSelf: "flex-start",
  },

  freeCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60px",
    color: "#D1D5DB",
    fontSize: "14px",
  },

  // Detail Cards
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "12px",
  },
  detailCard: {
    borderRadius: "12px",
    padding: "18px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    transition: "box-shadow 0.2s",
  },
  detailPeriodBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    color: "#FFFFFF",
    flexShrink: 0,
  },
  detailBody: { flex: 1 },
  detailSubjectName: {
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1.3",
    marginBottom: "2px",
  },
  detailCode: {
    fontSize: "12px",
    color: "#9CA3AF",
    marginBottom: "8px",
  },
  detailMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  detailMetaItem: {
    fontSize: "12px",
    color: "#6B7280",
    backgroundColor: "#FFFFFF",
    padding: "3px 10px",
    borderRadius: "999px",
    border: "1px solid #E5E7EB",
    fontWeight: "500",
  },
  closeBtn: {
    marginLeft: "auto",
    fontSize: "12px",
    color: "#6B7280",
    background: "#F3F4F6",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: "600",
  },

  // Empty state
  emptyCard: {
    backgroundColor: "#FFFBEB",
    border: "1.5px dashed #FCD34D",
    borderRadius: "16px",
    padding: "48px 32px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: "48px", marginBottom: "12px" },
  emptyTitle: { fontSize: "20px", fontWeight: "700", color: "#92400E", margin: "0 0 8px" },
  emptyDesc: { fontSize: "14px", color: "#B45309", marginBottom: "16px" },
  emptyContact: {
    display: "inline-block",
    backgroundColor: "#FFFFFF",
    border: "1px solid #FCD34D",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13px",
    color: "#92400E",
    fontWeight: "500",
  },

  // Loading
  loadingWrapper: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    backgroundColor: "#F3F4F6",
  },
  spinnerRing: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "4px solid #E5E7EB",
    borderTopColor: "#6366F1",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6B7280",
    fontWeight: "500",
  },
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .timetable-row:hover td {
    background-color: rgba(99, 102, 241, 0.03) !important;
  }

  .subject-pill:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
`;

const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default MyTimetable;
