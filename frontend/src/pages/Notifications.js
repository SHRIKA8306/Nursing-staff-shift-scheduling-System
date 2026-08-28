import { useState } from "react";
import NurseSidebar from "../components/NurseSidebar";
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

import "../styles/Notifications.css";

function Notifications() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");

  const nurseName = user ? user.username : "Nurse";
  const getInitials = (name) => {
    if (!name) return "NS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "Shift",
      title: "Morning Shift Reminder",
      message:
        "Your morning shift starts at 6:00 AM tomorrow in ICU Ward A. Please ensure punctual arrival.",
      time: "5 minutes ago",
      unread: true,
      icon: CalendarDays,
    },
    {
      id: 2,
      type: "Leave",
      title: "Leave Request Approved",
      message:
        "Your annual leave request (LR-008) for June 15–19 has been approved by Dr. James Miller.",
      time: "1 hour ago",
      unread: true,
      icon: CheckCircle,
    },
    {
      id: 3,
      type: "Emergency",
      title: "Emergency Staffing Alert",
      message:
        "URGENT: ICU Ward B is understaffed for night shift Aug 7. Volunteers needed. Contact supervisor.",
      time: "3 hours ago",
      unread: true,
      icon: AlertTriangle,
    },
    {
      id: 4,
      type: "Admin",
      title: "Schedule Updated",
      message:
        "Your August shift schedule has been updated by the administrator. Please review your schedule.",
      time: "Yesterday",
      unread: false,
      icon: Settings,
    },
    {
      id: 5,
      type: "Shift",
      title: "Shift Swap Request",
      message:
        "Sarah requested a shift swap with you for the morning shift on August 10.",
      time: "Yesterday",
      unread: false,
      icon: CalendarDays,
    },
  ]);

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
            notification.type === activeFilter
        );

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const markAllAsRead = () => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  return (
    <div className="notifications-page">

      {/* SIDEBAR */}
      <NurseSidebar />

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

                  const Icon =
                    notification.icon;

                  return (

                    <div
                      key={notification.id}
                      className={`notification-card ${
                        notification.unread
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

                          {notification.unread && (
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
                        {notification.time}
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