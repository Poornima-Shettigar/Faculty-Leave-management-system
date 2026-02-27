import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ─── Mini Components ─────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color, sub }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: `5px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'transform .18s, box-shadow .18s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
  >
    <div style={{
      width: 52, height: 52, borderRadius: 12,
      background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, flexShrink: 0
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const ActionCard = ({ icon, title, desc, link, badge, color = '#667eea' }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(link)}
      style={{
        background: '#fff',
        border: '1.5px solid #e8eaf6',
        borderRadius: 14,
        padding: '16px 20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'all .18s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + '08'; e.currentTarget.style.transform = 'translateX(3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaf6'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</div>
      </div>
      {badge != null && badge > 0 && (
        <span style={{
          background: '#ef4444', color: '#fff',
          borderRadius: 20, padding: '2px 10px',
          fontSize: 12, fontWeight: 700,
          flexShrink: 0
        }}>{badge}</span>
      )}
      <span style={{ color: '#94a3b8', fontSize: 18, flexShrink: 0 }}>›</span>
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 14, marginTop: 0 }}>{children}</h2>
);

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #667eea',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Role-Specific Dashboards ────────────────────────────────────────────────

// ADMIN DASHBOARD
function AdminDashboard({ userId }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [totalDepts, setTotalDepts] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/faculty/admin/stats');
        const data = Array.isArray(res.data) ? res.data : [];
        setStats(data);
        setTotalDepts(data.length);
        setTotalFaculty(data.reduce((s, d) => s + (d.total || 0), 0));
      } catch (e) {
        console.error('Admin stats error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <StatCard label="Total Departments" value={totalDepts} icon="🏢" color="#667eea" />
        <StatCard label="Total Faculty" value={totalFaculty} icon="👩‍🏫" color="#06b6d4" />
        <StatCard label="Academic Year" value="2025-26" icon="🎓" color="#f59e0b" />
        <StatCard label="System" value="Online" icon="✅" color="#10b981" sub="All services running" />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionTitle>Quick Actions</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          <ActionCard icon="👤" title="Add User" desc="Create new faculty/HOD account" link="/admin/dashboard/add-user" color="#667eea" />
          <ActionCard icon="👥" title="Manage Users" desc="View, edit, delete accounts" link="/admin/dashboard/delete-user" color="#06b6d4" />
          <ActionCard icon="📋" title="Leave Reports" desc="View faculty present days report" link="/admin/dashboard/leave-report" color="#f59e0b" />
          <ActionCard icon="🏢" title="Departments" desc="Manage department structure" link="/admin/dashboard/add-dept" color="#10b981" />
          <ActionCard icon="📅" title="Leave Types" desc="Allocate & configure leave types" link="/admin/dashboard/leave-add" color="#8b5cf6" />
        </div>
      </div>

      {/* Department Stats Table */}
      {stats.length > 0 && (
        <div>
          <SectionTitle>Department-wise Faculty Count</SectionTitle>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg,#667eea,#764ba2)' }}>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'left' }}>Department</th>
                  <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>Total Staff</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((d, i) => (
                  <tr key={d.departmentId || i} style={{ background: i % 2 === 0 ? '#f8faff' : '#fff', borderBottom: '1px solid #e8eaf6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{d.departmentName}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ background: '#667eea', color: '#fff', borderRadius: 8, padding: '3px 12px', fontWeight: 700, fontSize: 13 }}>{d.total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// HOD DASHBOARD
function HodDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const deptId = user?.departmentType?._id || user?.departmentType || user?.departmentId;

  useEffect(() => {
    if (!deptId) { setLoading(false); return; }
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/leave-request/hod/stats/${deptId}`);
        setStats(res.data);
      } catch (e) {
        console.error('HOD stats error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [deptId]);

  if (loading) return <Spinner />;

  const s = stats || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <StatCard label="Total Faculty" value={s.totalFaculty ?? '—'} icon="👩‍🏫" color="#667eea" sub={s.departmentName} />
        <StatCard label="Available Today" value={s.availableFaculty ?? '—'} icon="✅" color="#10b981" />
        <StatCard label="On Leave" value={s.facultyOnLeave ?? '—'} icon="🏖️" color="#f59e0b" />
        <StatCard label="Pending Approvals" value={s.pendingLeaves ?? '—'} icon="⏳" color="#ef4444" />
        <StatCard label="Approved Leaves" value={s.approvedLeaves ?? '—'} icon="✔️" color="#06b6d4" />
        <StatCard label="Rejected Leaves" value={s.rejectedLeaves ?? '—'} icon="❌" color="#8b5cf6" />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionTitle>Quick Actions</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          <ActionCard icon="✅" title="Approve Leave" desc="Review pending leave requests" link="/hod/dashboard/approve-leave" badge={s.pendingLeaves} color="#ef4444" />
          <ActionCard icon="📊" title="Department Leaves" desc="View all department leave history" link="/hod/dashboard/view-department-leaves" color="#667eea" />
          <ActionCard icon="👥" title="Faculty List" desc="View all department faculty" link="/hod/dashboard/faculty-list" color="#06b6d4" />
          <ActionCard icon="✍️" title="Apply Leave" desc="Apply for your own leave" link="/hod/dashboard/apply-leave-hod" color="#10b981" />
          <ActionCard icon="🔄" title="Substitution Requests" desc="Review substitution assignments" link="/hod/dashboard/substitution-details" color="#8b5cf6" />
        </div>
      </div>

      {/* Faculty on Leave Today */}
      {s.absenceDetails && s.absenceDetails.length > 0 && (
        <div>
          <SectionTitle>Faculty Currently on Approved Leave</SectionTitle>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444)' }}>
                  {['Faculty', 'Role', 'Leave Type', 'From', 'To', 'Days'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.absenceDetails.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fffbf0' : '#fff', borderBottom: '1px solid #e8eaf6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{a.facultyName}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{a.facultyRole}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{a.leaveType}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{new Date(a.startDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{new Date(a.endDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>{a.totalDays}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Faculty */}
      {s.availableFacultyList && s.availableFacultyList.length > 0 && (
        <div>
          <SectionTitle>Faculty Available Today ({s.availableFacultyList.length})</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
            {s.availableFacultyList.map((f, i) => (
              <div key={i} style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {f.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#065f46' }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: '#34d399', textTransform: 'capitalize' }}>{f.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// DIRECTOR DASHBOARD
function DirectorDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/leave-request/director/stats');
        setStats(res.data);
      } catch (e) {
        console.error('Director stats error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const s = stats || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <StatCard label="Total Departments" value={s.totalDepartments ?? '—'} icon="🏢" color="#667eea" />
        <StatCard label="Total Faculty" value={s.totalFaculty ?? '—'} icon="👩‍🏫" color="#06b6d4" />
        <StatCard label="Faculty on Leave Today" value={s.facultyOnLeaveToday ?? '—'} icon="🏖️" color="#f59e0b" />
        <StatCard label="Pending Your Approval" value={s.pendingLeaves ?? '—'} icon="⏳" color="#ef4444" />
        <StatCard label="Approved Leaves" value={s.approvedLeaves ?? '—'} icon="✔️" color="#10b981" />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionTitle>Quick Actions</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          <ActionCard icon="✅" title="Approve Leaves" desc="Review pending leave requests" link="/director/dashboard/approve-leave" badge={s.pendingLeaves} color="#ef4444" />
          <ActionCard icon="📊" title="All Dept Reports" desc="Comprehensive institute-wide report" link="/director/dashboard/all-dept-report" color="#667eea" />
          <ActionCard icon="👥" title="Dept Faculty & Leaves" desc="Department-wise faculty overview" link="/director/dashboard/department-faculty" color="#06b6d4" />
          <ActionCard icon="👤" title="My Profile" desc="View and update your profile" link="/director/dashboard/profile" color="#10b981" />
        </div>
      </div>

      {/* Department Stats */}
      {s.departmentStats && s.departmentStats.length > 0 && (
        <div>
          <SectionTitle>Department Summary</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {s.departmentStats.map((dept, i) => (
              <div key={i} style={{
                background: '#fff', border: '1.5px solid #e0e7ff',
                borderRadius: 14, padding: '16px 20px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 10 }}>{dept.departmentName}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    👥 {dept.totalFaculty} Total
                  </span>
                  <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                    ✅ {dept.availableFaculty} Available
                  </span>
                  {dept.facultyOnLeave > 0 && (
                    <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                      🏖️ {dept.facultyOnLeave} On Leave
                    </span>
                  )}
                </div>
                {dept.leaveDetails && dept.leaveDetails.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444', fontStyle: 'italic' }}>
                    {dept.leaveDetails.map((l, j) => (
                      <div key={j}>{l.facultyName} — {l.leaveType}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// FACULTY / NON-TEACHING DASHBOARD
function FacultyDashboard({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const empId = user?._id || user?.id;
  const isTeaching = user?.role === 'teaching';
  const base = isTeaching ? '/faculty/dashboard' : '/non-teaching/dashboard';

  useEffect(() => {
    if (!empId) { setLoading(false); return; }
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/leave-request/my-requests/${empId}`);
        setLeaves(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Faculty leave error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [empId]);

  if (loading) return <Spinner />;

  const total = leaves.length;
  const pending = leaves.filter(l => l.status?.toLowerCase().includes('pending')).length;
  const approved = leaves.filter(l =>
    l.status === 'Approved by Director' || l.status === 'approved'
  ).length;
  const rejected = leaves.filter(l => l.status?.toLowerCase().includes('reject')).length;

  const statusColor = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('approved by director') || s === 'approved') return { bg: '#d1fae5', text: '#065f46' };
    if (s.includes('pending')) return { bg: '#fef3c7', text: '#92400e' };
    if (s.includes('reject')) return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#e0e7ff', text: '#3730a3' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        <StatCard label="Total Requests" value={total} icon="📋" color="#667eea" />
        <StatCard label="Pending" value={pending} icon="⏳" color="#f59e0b" />
        <StatCard label="Approved" value={approved} icon="✔️" color="#10b981" />
        <StatCard label="Rejected" value={rejected} icon="❌" color="#ef4444" />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionTitle>Quick Actions</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <ActionCard icon="✍️" title="Apply for Leave" desc="Submit a new leave request" link={`${base}/apply-leave`} color="#667eea" />
          <ActionCard icon="📋" title="My Leave Status" desc="Track your leave applications" link={`${base}/my-leave-status`} color="#06b6d4" />
          {isTeaching && <ActionCard icon="📅" title="My Timetable" desc="View your class schedule" link={`${base}/my-timetable`} color="#f59e0b" />}
          {isTeaching && <ActionCard icon="🔄" title="Substitutions" desc="Review substitute assignments" link={`${base}/substitution-details`} color="#8b5cf6" />}
          <ActionCard icon="👤" title="My Profile" desc="Update your profile details" link={`${base}/profile`} color="#10b981" />
        </div>
      </div>

      {/* Recent Leave Requests */}
      {leaves.length > 0 && (
        <div>
          <SectionTitle>My Recent Leave Requests</SectionTitle>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg,#667eea,#764ba2)' }}>
                  {['#', 'Leave Type', 'From', 'To', 'Days', 'Status'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.slice(0, 8).map((lr, i) => {
                  const sc = statusColor(lr.status);
                  return (
                    <tr key={lr._id || i} style={{ background: i % 2 === 0 ? '#f8faff' : '#fff', borderBottom: '1px solid #e8eaf6' }}>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{lr.leaveTypeId?.name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{new Date(lr.startDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{new Date(lr.endDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>{lr.totalDays}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: sc.bg, color: sc.text, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {lr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {leaves.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
          <h3 style={{ color: '#64748b', margin: 0 }}>No leave requests yet</h3>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>Apply for your first leave to get started!</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard Home ──────────────────────────────────────────────────────

const EnterpriseDashboardHome = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user?.role?.toLowerCase();

  const roleTitle = {
    admin: 'Administrator Dashboard',
    hod: 'Head of Department Dashboard',
    director: 'Director Dashboard',
    teaching: 'Faculty Dashboard',
    'non-teaching': 'Staff Dashboard',
  };

  const roleSub = {
    admin: 'System administration, user management, and reports',
    hod: 'Manage faculty leave requests and department overview',
    director: 'Institute-wide leave management and analytics',
    teaching: 'Manage your leave requests and academic schedule',
    'non-teaching': 'Apply for leave and track your requests',
  };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 28,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {roleTitle[role] || 'Dashboard'}
          </h1>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>
            {roleSub[role] || 'Poornaprajna Institute of Management – Leave Management System'}
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 12,
          padding: '10px 20px',
          backdropFilter: 'blur(8px)',
          fontSize: 13,
          fontWeight: 600
        }}>
          🗓️ {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Role-specific content */}
      {role === 'admin' && <AdminDashboard userId={user?._id} />}
      {role === 'hod' && <HodDashboard user={user} />}
      {role === 'director' && <DirectorDashboard user={user} />}
      {(role === 'teaching' || role === 'non-teaching') && <FacultyDashboard user={user} />}
    </div>
  );
};

export default EnterpriseDashboardHome;
