import React, { useState, useEffect, useRef } from "react";
import "../styles/Topbar.css";
import profileImg from "../../assets/image.png";
import axios from "axios";

function Topbar() {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id || user.id;

  // ============================
  // Role Mapping Logic
  // ============================
  const roleMapping = {
    "admin": "Admin",
    "hod": "Head of Department",
    "faculty": "Teaching Faculty",
    "teaching": "Teaching Faculty",
    "non-teaching": "Non-Teaching Staff",
    "director": "Director",
  };

  // Convert stored role → readable role
  const readableRole = roleMapping[user.role] || "User";

  // Name handling
  const name = user.name || user.email?.split("@")[0] || "User";

  // Fetch notifications
  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/leave-request/notifications/${userId}`);
      const fetchedNotifications = res.data || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/leave-request/notifications/${notificationId}/read`);
      loadNotifications(); // Reload to update read status
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // const handleNotificationClick = (notification) => {
  //   if (!notification.isRead) {
  //     markAsRead(notification._id);
  //   }
  //   setNotificationsOpen(false);
  //   // Navigate to relevant page based on notification type
  //   if (notification.type.includes("leave")) {
  //     if (user.role === "hod" || user.role === "director") {
  //       window.location.href = `/${user.role}/dashboard/approve-leave`;
  //     } else {
  //       window.location.href = `/${user.role === "teaching" ? "faculty" : "non-teaching"}/dashboard/my-leave-status`;
  //     }
  //   }
  // };
const handleNotificationClick = (notification) => {

  if (!notification.isRead) {
    markAsRead(notification._id);
  }

  setNotificationsOpen(false);

  // ============== substitute assignment navigation ============
  if (notification.type === "substitute_assignment") {
    window.location.href = "/faculty/dashboard/substitution-details";
    return;
  }

  // ============== leave flow =================
  if (notification.type.includes("leave")) {

    if (user.role === "hod" || user.role === "director") {
      window.location.href = `/${user.role}/dashboard/approve-leave`;
    } else {
      window.location.href = `/${user.role === "teaching" ? "faculty" : "non-teaching"}/dashboard/my-leave-status`;
    }

    return;
  }
};

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

const getNotificationIcon = (type) => {
  if (type === "substitute_assignment") return "👨‍🏫";
  if (type.includes("approved")) return "✓";
  if (type.includes("rejected")) return "✗";
  if (type.includes("requested")) return "📋";
  return "🔔";
};

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="topbar">
      <h3>
        Welcome {name}! <span className="role-tag">({readableRole} Dashboard)</span>
      </h3>

      <div className="profile-section" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Notification Icon */}
        <div ref={notificationRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(0,0,0,0.05)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "#4B5563" }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  backgroundColor: "#EF4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid white"
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                marginTop: "10px",
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                width: "380px",
                maxHeight: "500px",
                overflowY: "auto",
                zIndex: 1000
              }}
            >
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #E5E7EB",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#F9FAFB"
                }}
              >
                <h3 style={{ margin: 0, fontWeight: "600", color: "#1F2937" }}>
                  Notifications
                </h3>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#6B7280"
                  }}
                >
                  ×
                </button>
              </div>

              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                  <p>No notifications</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #E5E7EB",
                        cursor: "pointer",
                        backgroundColor: notification.isRead ? "white" : "#EFF6FF",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = notification.isRead ? "#F9FAFB" : "#DBEAFE";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notification.isRead ? "white" : "#EFF6FF";
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div
                          style={{
                            fontSize: "24px",
                            flexShrink: 0,
                            marginTop: "2px"
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: notification.isRead ? "500" : "600",
                              color: "#1F2937",
                              marginBottom: "4px",
                              fontSize: "14px"
                            }}
                          >
                            {notification.title}
                          </div>
                          <div
                            style={{
                              color: "#6B7280",
                              fontSize: "13px",
                              marginBottom: "6px",
                              lineHeight: "1.4"
                            }}
                          >
                            {notification.message}
                          </div>
                          <div
                            style={{
                              color: "#9CA3AF",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <span>{formatDate(notification.createdAt)}</span>
                            {!notification.isRead && (
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#3B82F6",
                                  display: "inline-block"
                                }}
                              ></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Image */}
        <img
          src={profileImg}
          alt="profile"
          className="profile-img"
          onClick={() => {
            setOpen(!open);
            setNotificationsOpen(false);
          }}
        />

        {open && (
          <div className="profile-dropdown">
            <p><strong>{name}</strong></p>
            <p>{user.email}</p>
            <p>Role: {readableRole}</p>

            <p className="dropdown-item" onClick={() => alert("Reset Password clicked!")}>
              Reset Password
            </p>

            <p className="dropdown-item logout" onClick={logout}>
              Logout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Topbar;
