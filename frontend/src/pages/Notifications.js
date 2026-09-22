import { useState, useEffect } from "react";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  CheckCircle,
  AlertTriangle,
  Settings,
  CircleHelp,
  Bell,
} from "lucide-react";
import { getInitials } from "../utils/helpers";
import "../styles/Notifications.css";

function Notifications() {
  const { user, token, role, unreadCount, setUnreadCount } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const nurseName = user ? user.username : "Nurse";

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    "All",
    "Shift",
    "Leave",
    "Emergency",
    "Admin",
  ];

  const filteredNotifications =
    activeFilter === "All"
      ? notifications
      : notifications.filter(
          (notification) =>
            notification.type && notification.type.toLowerCase() === activeFilter.toLowerCase()
        );

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notifications-page">

      {/* SIDEBAR */}
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

      {/* MAIN AREA */}
      <div className="notifications-main">

        {/* TOP HEADER */}
        <header className="notifications-header">
          <div className="notifications-header-left">
            <button
              className="notifications-menu-button"
              type="button"
            >
              ☰
            </button>

            <div className="notifications-welcome">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="notifications-header-right">
            <button
              className="notifications-bell"
              type="button"
            >
              <Bell size={22} />

              {unreadCount > 0 && (
                <span className="header-notification-count">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="notifications-avatar">
              {getInitials(nurseName)}
            </div>
          </div>
        </header>


        {/* ==========================================
            PAGE CONTENT
        ========================================== */}

        <main className="notifications-content">

          {/* Page heading */}

          <div className="notifications-title-row">

            <div>

              <h1>
                Notifications
              </h1>

              <p>
                {unreadCount} unread notifications
              </p>

            </div>

            <button
              className="mark-read-button"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>

          </div>


          {/* ==========================================
              FILTERS
          ========================================== */}

          <div className="notification-filters">

            {filters.map((filter) => (

              <button
                key={filter}
                type="button"
                className={`notification-filter ${
                  activeFilter === filter
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveFilter(filter)
                }
              >
                {filter}
              </button>

            ))}

          </div>


          {/* ==========================================
              NOTIFICATION LIST
          ========================================== */}

          <section className="notification-list">

            {filteredNotifications.length === 0 ? (

              <div className="empty-notifications">

                <Bell size={40} />

                <h3>
                  No notifications
                </h3>

                <p>
                  There are no notifications in this category.
                </p>

              </div>

            ) : (

              filteredNotifications.map(
                (notification) => {

                  const getIconForType = (type) => {
                    switch (type?.toLowerCase()) {
                      case "shift": return CalendarDays;
                      case "leave": return CheckCircle;
                      case "emergency": return AlertTriangle;
                      case "admin": return Settings;
                      default: return Bell;
                    }
                  };
                  const Icon = notification.icon || getIconForType(notification.type);

                  return (

                    <div
                      key={notification.id}
                      className={`notification-card ${
                        !notification.read
                          ? "unread"
                          : ""
                      }`}
                    >

                      {/* Icon */}

                      <div
                        className={`notification-icon ${
                          notification.type.toLowerCase()
                        }`}
                      >
                        <Icon
                          size={24}
                          strokeWidth={2}
                        />
                      </div>


                      {/* Content */}

                      <div className="notification-body">

                        <div className="notification-title">

                          <h3>
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="unread-dot"></span>
                          )}

                        </div>

                        <p className="notification-message">
                          {notification.message}
                        </p>


                        <span
                          className={`notification-type ${
                            notification.type.toLowerCase()
                          }`}
                        >
                          {notification.type}
                        </span>

                      </div>


                      {/* Time */}

                      <div className="notification-time">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : notification.time}
                      </div>

                    </div>

                  );
                }
              )

            )}

          </section>

        </main>


        {/* ==========================================
            FOOTER
        ========================================== */}

        <footer className="notifications-footer">

          <span>
            © 2026 NurseSync AI · Nurse Portal
          </span>

          <span className="system-status">

            <span className="system-dot"></span>

            System Online

          </span>

        </footer>


        {/* Help button */}

        <button
          className="notifications-help-button"
          type="button"
        >
          <CircleHelp size={24} />
        </button>

      </div>

    </div>
  );
}

export default Notifications;