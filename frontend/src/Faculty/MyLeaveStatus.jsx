import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000";

/* ─────────── helpers ─────────── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";

const STATUS_CONFIG = {
  "Pending Substitute Approval": { label: "Waiting for Substitute", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  "Substitute Rejected": { label: "Substitute Rejected", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  "Pending HOD Approval": { label: "Pending HOD", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  "Approved by HOD": { label: "HOD Approved → Director", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  "Rejected by HOD": { label: "Rejected by HOD", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  "Pending Director Approval": { label: "Pending Director", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  "Approved by Director": { label: "Approved ✓", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  "Rejected by Director": { label: "Rejected by Director", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  "Cancelled": { label: "Cancelled ⊘", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
  // legacy
  approved: { label: "Approved ✓", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  pending_hod: { label: "Pending HOD", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  pending_director: { label: "Pending Director", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  rejected_by_hod: { label: "Rejected by HOD", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  rejected_by_director: { label: "Rejected by Director", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
  return (
    <span
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
};

/* ─────────── Leave Balance Card ─────────── */
const BalanceCard = ({ lb }) => {
  const isDeduct = lb.leaveEffect !== "ADD";
  const pct = isDeduct && lb.totalAvailable > 0
    ? Math.round(((lb.usedLeaves || 0) / lb.totalAvailable) * 100)
    : 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e8eaf6",
        borderRadius: 16,
        padding: "18px 20px",
        transition: "all .18s",
        cursor: "default",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>
        {lb.leaveTypeName}
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
        {isDeduct ? "Deductible Leave" : "Add/Credit Leave"}
      </div>

      {isDeduct ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Used</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Allotted</span>
          </div>
          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981",
                borderRadius: 8,
                transition: "width .5s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{lb.remainingLeaves ?? 0}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>remaining</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>{lb.usedLeaves ?? 0} / {lb.totalAvailable ?? 0}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>used / total</div>
            </div>
          </div>
          {(lb.carryForwardLeaves ?? 0) > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>
              + {lb.carryForwardLeaves} carry-forward days
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{lb.usedLeaves ?? 0}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>days taken this year</div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#6366f1" }}>
            Credited: {lb.usedLeaves ?? 0} days
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────── Detail Modal ─────────── */
const DetailModal = ({ request, onClose, canCancel, handleCancel }) => {
  if (!request) return null;
  const cfg = STATUS_CONFIG[request.status] || {};

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 680,
          maxHeight: "90vh", overflow: "hidden", display: "flex",
          flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1e293b" }}>Leave Application Details</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{request.leaveTypeId?.name || "N/A"}</div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {/* Dates & Days */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Start Date", value: fmt(request.startDate) },
              { label: "End Date", value: fmt(request.endDate) },
              { label: "Duration", value: `${request.isHalfDay ? 0.5 : request.totalDays} day(s)` },
            ].map((item) => (
              <div key={item.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 700, color: "#1e293b" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Reason</div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", color: "#374151", fontStyle: "italic", lineHeight: 1.6 }}>
              "{request.description}"
            </div>
          </div>

          {/* Workflow progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>Approval Workflow</div>
            {[
              {
                label: "Substitution",
                show: (request.periodAdjustments?.length || 0) > 0,
                done: request.periodAdjustments?.every(p => p.substituteApproval?.status === "approved"),
                detail: `${request.periodAdjustments?.filter(p => p.substituteApproval?.status === "approved").length || 0} / ${request.periodAdjustments?.length || 0} periods accepted`,
              },
              {
                label: "HOD Approval",
                show: true,
                done: !!request.hodApproval?.approvedAt,
                detail: request.hodApproval?.approvedAt
                  ? `Approved on ${fmt(request.hodApproval.approvedAt)}${request.hodApproval.comments ? ` — ${request.hodApproval.comments}` : ""}`
                  : "Pending HOD review",
              },
              {
                label: "Director Approval",
                show: true,
                done: !!request.directorApproval?.approvedAt,
                detail: request.directorApproval?.approvedAt
                  ? `Approved on ${fmt(request.directorApproval.approvedAt)}${request.directorApproval.comments ? ` — ${request.directorApproval.comments}` : ""}`
                  : "Pending Director review",
              },
            ]
              .filter(s => s.show)
              .map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: step.done ? "#10b981" : "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, color: step.done ? "#fff" : "#94a3b8", fontWeight: 800,
                    }}
                  >
                    {step.done ? "✓" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{step.detail}</div>
                  </div>
                </div>
              ))}
          </div>

          {/* Substitution table */}
          {(request.periodAdjustments?.length || 0) > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>
                Period Assignments
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Date", "Period", "Class", "Substitute", "Status"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {request.periodAdjustments.map((adj, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px", color: "#374151" }}>{fmt(adj.date)}</td>
                      <td style={{ padding: "8px 10px", color: "#374151", fontWeight: 600 }}>P{adj.period}</td>
                      <td style={{ padding: "8px 10px", color: "#374151" }}>{adj.className}</td>
                      <td style={{ padding: "8px 10px", color: "#374151" }}>{adj.substituteFacultyId?.name || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {adj.substituteApproval?.status === "approved" ? (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Accepted</span>
                        ) : adj.substituteApproval?.status === "rejected" ? (
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>✗ Declined</span>
                        ) : (
                          <span style={{ color: "#f59e0b", fontWeight: 700 }}>⏳ Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12, background: "#fafafa" }}>
          {canCancel && (
            <button
              onClick={handleCancel}
              style={{
                padding: "10px 24px", background: "#fef2f2", color: "#ef4444",
                border: "1.5px solid #fee2e2", borderRadius: 12, fontWeight: 700, fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel Request
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "10px 28px", background: "#1e293b", color: "#fff",
              border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
function MyLeaveStatus() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const employeeId = user._id || user.id;

  const [tab, setTab] = useState("requests"); // "requests" | "balance"
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadLeaveRequests = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/leave-request/my-requests/${employeeId}`);
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error("Error loading leave requests:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  const loadLeaveBalance = useCallback(async () => {
    if (!employeeId) return;
    try {
      setBalanceLoading(true);
      const res = await axios.get(`${API}/api/leaveType/faculty/${employeeId}/leaves`);
      setLeaveBalance(res.data || []);
    } catch (err) {
      console.error("Error loading leave balance:", err);
    } finally {
      setBalanceLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadLeaveRequests();
    loadLeaveBalance();
  }, [loadLeaveRequests, loadLeaveBalance]);

  /* ── cancel logic ── */
  const canCancel = (startDate, status) => {
    if (status === "Cancelled") return false;
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > today) return true;
    if (start.getTime() === today.getTime()) {
      return now.getHours() < 10;
    }
    return false;
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this leave request? This action cannot be undone.")) return;
    try {
      await axios.put(`${API}/api/leave-request/cancel/${requestId}`);
      alert("Leave request cancelled successfully.");
      loadLeaveRequests();
      loadLeaveBalance();
      setSelectedRequest(null);
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.message || "Failed to cancel leave request.");
    }
  };

  /* ── filter logic ── */
  const filteredRequests = leaveRequests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "approved") return r.status === "Approved by Director" || r.status === "approved";
    if (filter === "pending") return r.status.toLowerCase().includes("pending") || r.status.toLowerCase().includes("substitute");
    if (filter === "rejected") return r.status.toLowerCase().includes("rejected");
    return true;
  });

  /* ── quick tallies ── */
  const counts = {
    total: leaveRequests.length,
    approved: leaveRequests.filter(r => r.status === "Approved by Director" || r.status === "approved").length,
    pending: leaveRequests.filter(r => r.status.toLowerCase().includes("pending") || r.status.toLowerCase().includes("substitute")).length,
    rejected: leaveRequests.filter(r => r.status.toLowerCase().includes("rejected")).length,
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: 0 }}>Leave Centre</h1>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>
          Track your leave requests and real-time balance summary
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {[
          { id: "requests", label: "📋 My Requests" },
          { id: "balance", label: "📊 Leave Balance" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 20px", border: "none", borderRadius: 9,
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#1e293b" : "#64748b",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              boxShadow: tab === t.id ? "0 1px 6px rgba(0,0,0,.08)" : "none",
              transition: "all .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════ REQUESTS TAB ════════════ */}
      {tab === "requests" && (
        <>
          {/* Quick stat chips */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { key: "all", label: "All", count: counts.total, color: "#6366f1", bg: "#eef2ff" },
              { key: "pending", label: "Pending", count: counts.pending, color: "#f59e0b", bg: "#fffbeb" },
              { key: "approved", label: "Approved", count: counts.approved, color: "#10b981", bg: "#ecfdf5" },
              { key: "rejected", label: "Rejected", count: counts.rejected, color: "#ef4444", bg: "#fef2f2" },
            ].map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 14px", borderRadius: 20, border: "none",
                  background: filter === chip.key ? chip.bg : "#f8fafc",
                  color: filter === chip.key ? chip.color : "#64748b",
                  fontWeight: 700, fontSize: 12, cursor: "pointer",
                  boxShadow: filter === chip.key ? `0 0 0 2px ${chip.color}40` : "none",
                  transition: "all .15s",
                }}
              >
                {chip.label}
                <span
                  style={{
                    background: filter === chip.key ? chip.color : "#e2e8f0",
                    color: filter === chip.key ? "#fff" : "#64748b",
                    borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 800,
                  }}
                >
                  {chip.count}
                </span>
              </button>
            ))}
            <button
              onClick={() => { loadLeaveRequests(); loadLeaveBalance(); }}
              style={{
                marginLeft: "auto", padding: "6px 14px", borderRadius: 20,
                border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}
            >
              ↺ Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Loading your leave requests…
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "#f8fafc", borderRadius: 20, color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No {filter !== "all" ? filter : ""} leave requests found</div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #e8eaf6", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      {["Leave Type", "Date Range", "Days", "Substitution", "Status", "Applied On", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px", textAlign: "left",
                            fontSize: 11, fontWeight: 700, color: "#94a3b8",
                            textTransform: "uppercase", letterSpacing: 0.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => {
                      const subApproved = req.periodAdjustments?.filter(p => p.substituteApproval?.status === "approved").length || 0;
                      const subTotal = req.periodAdjustments?.length || 0;
                      return (
                        <tr
                          key={req._id}
                          style={{ borderBottom: "1px solid #f1f5f9", transition: "background .12s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                            {req.leaveTypeId?.name || "N/A"}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>
                            <div>{fmt(req.startDate)}</div>
                            {req.startDate !== req.endDate && (
                              <div style={{ color: "#94a3b8", fontSize: 11 }}>→ {fmt(req.endDate)}</div>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13, fontWeight: 700 }}>
                            {req.isHalfDay ? "0.5" : req.totalDays}
                            <span style={{ color: "#94a3b8", fontWeight: 400 }}> day(s)</span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {subTotal > 0 ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden", minWidth: 60 }}>
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${subTotal ? (subApproved / subTotal) * 100 : 0}%`,
                                      background: subApproved === subTotal ? "#10b981" : "#f59e0b",
                                      borderRadius: 4,
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                                  {subApproved}/{subTotal}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>N/A</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <StatusBadge status={req.status} />
                          </td>
                          <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 12 }}>
                            {fmt(req.createdAt)}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => setSelectedRequest(req)}
                                style={{
                                  padding: "6px 14px", border: "1.5px solid #e2e8f0",
                                  borderRadius: 10, background: "#f8fafc",
                                  color: "#374151", fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", transition: "all .12s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#1e293b"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                              >
                                Details
                              </button>
                              {canCancel(req.startDate, req.status) && (
                                <button
                                  onClick={() => handleCancel(req._id)}
                                  style={{
                                    padding: "6px 14px", border: "1.5px solid #fee2e2",
                                    borderRadius: 10, background: "#fef2f2",
                                    color: "#ef4444", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", transition: "all .12s",
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ef4444"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fee2e2"; }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════ BALANCE TAB ════════════ */}
      {tab === "balance" && (
        <>
          <div style={{
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "#fff",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginBottom: 4 }}>Leave Balance Summary</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {leaveBalance.filter(l => l.leaveEffect !== "ADD").reduce((s, l) => s + (l.remainingLeaves || 0), 0)} days remaining
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              Across all deductible leave types · Updated in real-time after each approval
            </div>
          </div>

          <div style={{ marginBottom: 8, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
            ⓘ Leave counts are deducted only after Director approval. Rejected or pending requests do not affect your balance.
          </div>

          {balanceLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Loading leave balance…
            </div>
          ) : leaveBalance.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "#f8fafc", borderRadius: 20, color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No leave types allocated yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Contact Admin to set up your leave allocation</div>
            </div>
          ) : (
            <>
              {/* DEDUCT section */}
              {leaveBalance.filter(l => l.leaveEffect !== "ADD").length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 10 }}>
                    Leave Entitlements (Deductible)
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 16,
                      marginBottom: 28,
                    }}
                  >
                    {leaveBalance.filter(l => l.leaveEffect !== "ADD").map((lb, i) => (
                      <BalanceCard key={i} lb={lb} />
                    ))}
                  </div>
                </>
              )}

              {/* ADD section */}
              {leaveBalance.filter(l => l.leaveEffect === "ADD").length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 10 }}>
                    Leave Accrual (Add Type)
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {leaveBalance.filter(l => l.leaveEffect === "ADD").map((lb, i) => (
                      <BalanceCard key={i} lb={lb} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          canCancel={canCancel(selectedRequest.startDate, selectedRequest.status)}
          handleCancel={() => handleCancel(selectedRequest._id)}
        />
      )}
    </div>
  );
}

export default MyLeaveStatus;
