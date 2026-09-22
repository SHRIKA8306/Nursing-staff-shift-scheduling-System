import { useState } from "react";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import {
  Heart,
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  FileText,
  Clock3,
  Bell,
  UserRound,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { getInitials } from "../utils/helpers";
import "../styles/Settings.css";

function Settings() {
  const { user, logout, unreadCount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nurseName = user ? user.username : "Nurse";
  const nurseDept = user ? user.department || "General Ward" : "ICU";
  const nurseEmpId = user ? user.employeeId || "EMP-001" : "EMP-001";

  // Notification settings
  const [notifications, setNotifications] = useState({
    shiftReminders: true,
    leaveUpdates: true,
    emergencyAlerts: true,
    shiftSwapRequests: true,
    systemAnnouncements: false,
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // Appearance
  const [appearance, setAppearance] = useState("Light");

  const toggleNotification = (name) => {
    setNotifications((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  const handlePasswordUpdate = (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    alert("Password updated successfully.");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: user?.role === 'admin' ? "/admin-dashboard" : "/nurse-dashboard",
    },
    {
      name: "My Schedule",
      icon: CalendarDays,
      path: "/my-schedule",
    },
    {
      name: "Shift Swap",
      icon: ArrowLeftRight,
      path: "/shift-swap",
    },
    {
      name: "Leave Management",
      icon: FileText,
      path: "/leave-management",
    },
    {
      name: "Attendance",
      icon: Clock3,
      path: "/attendance",
    },
    {
      name: "Notifications",
      icon: Bell,
      path: "/notifications",
      badge: 2,
    },
    {
      name: "Profile",
      icon: UserRound,
      path: "/profile",
    },
    {
      name: "Settings",
      icon: SettingsIcon,
      path: "/settings",
    },
  ];

  return (
    <div className="settings-page">

      {/* SIDEBAR */}
      <aside
        className={`settings-sidebar ${
          sidebarOpen ? "settings-sidebar-open" : ""
        }`}
      >

        {/* Mobile Close */}
        <button
          className="settings-sidebar-close"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={22} />
        </button>

        {/* Brand */}
        <div className="settings-brand">

          <div className="settings-brand-icon">
            <Heart
              size={25}
              strokeWidth={2.3}
            />
          </div>

          <div>
            <h2>NurseSync AI</h2>
            <p>Nurse Portal</p>
          </div>

        </div>

        {/* Navigation */}
        <nav className="settings-navigation">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                type="button"
                className={`settings-nav-item ${
                  item.name === "Settings"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  window.location.href = item.path;
                }}
              >

                <Icon
                  size={21}
                  strokeWidth={1.8}
                />

                <span>{item.name}</span>

                {item.badge && (
                  <span className="settings-notification-badge">
                    {item.badge}
                  </span>
                )}

              </button>
            );
          })}

        </nav>

        {/* Bottom Sidebar */}
        <div className="settings-sidebar-bottom">

          <button
            type="button"
            className="settings-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={21} />
            <span>Logout</span>
          </button>

          <div className="settings-sidebar-profile">

            <div className="settings-profile-avatar">
              {getInitials(nurseName)}
            </div>

            <div className="settings-profile-info">
              <strong>{nurseName}</strong>

              <span>
                {nurseDept} · {nurseEmpId}
              </span>
            </div>

          </div>

        </div>

      </aside>

      {/* MAIN AREA */}
      <main className="settings-main">

        {/* HEADER */}
        <header className="settings-header">
          <div className="settings-header-left">
            <button
              className="settings-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={25} />
            </button>

            <div className="settings-welcome">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="settings-header-right">
            <button className="settings-header-notification">
              <Bell size={21} />
              <span>{unreadCount || 0}</span>
            </button>

            <div className="settings-header-avatar">
              {getInitials(nurseName)}
            </div>
          </div>
        </header>


        {/* =====================================
            PAGE CONTENT
        ===================================== */}

        <div className="settings-content">

          {/* Page Heading */}

          <div className="settings-page-heading">

            <h1>
              Settings
            </h1>

            <p>
              Manage your account preferences
            </p>

          </div>


          {/* =====================================
              NOTIFICATION SETTINGS
          ===================================== */}

          <section className="settings-card">

            <h2>
              Notification Settings
            </h2>

            <div className="notification-settings-list">

              {/* Shift Reminders */}

              <div className="notification-setting">

                <div>
                  <h3>
                    Shift Reminders
                  </h3>

                  <p>
                    Reminders 2 hours before your shift starts
                  </p>
                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifications.shiftReminders
                      ? "toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    toggleNotification(
                      "shiftReminders"
                    )
                  }
                  aria-label="Toggle shift reminders"
                >
                  <span></span>
                </button>

              </div>


              {/* Leave Request Updates */}

              <div className="notification-setting">

                <div>
                  <h3>
                    Leave Request Updates
                  </h3>

                  <p>
                    Approval, rejection, and status changes
                  </p>
                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifications.leaveUpdates
                      ? "toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    toggleNotification(
                      "leaveUpdates"
                    )
                  }
                  aria-label="Toggle leave request updates"
                >
                  <span></span>
                </button>

              </div>


              {/* Emergency Alerts */}

              <div className="notification-setting">

                <div>
                  <h3>
                    Emergency Alerts
                  </h3>

                  <p>
                    Urgent staffing and emergency notifications
                  </p>
                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifications.emergencyAlerts
                      ? "toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    toggleNotification(
                      "emergencyAlerts"
                    )
                  }
                  aria-label="Toggle emergency alerts"
                >
                  <span></span>
                </button>

              </div>


              {/* Shift Swap Requests */}

              <div className="notification-setting">

                <div>
                  <h3>
                    Shift Swap Requests
                  </h3>

                  <p>
                    When colleagues request a shift swap with you
                  </p>
                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifications.shiftSwapRequests
                      ? "toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    toggleNotification(
                      "shiftSwapRequests"
                    )
                  }
                  aria-label="Toggle shift swap requests"
                >
                  <span></span>
                </button>

              </div>


              {/* System Announcements */}

              <div className="notification-setting">

                <div>
                  <h3>
                    System Announcements
                  </h3>

                  <p>
                    Platform updates and hospital announcements
                  </p>
                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifications.systemAnnouncements
                      ? "toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    toggleNotification(
                      "systemAnnouncements"
                    )
                  }
                  aria-label="Toggle system announcements"
                >
                  <span></span>
                </button>

              </div>

            </div>

          </section>


          {/* =====================================
              SECURITY
          ===================================== */}

          <section className="settings-card security-card">

            <h2>
              Security
            </h2>

            <form
              className="password-form"
              onSubmit={handlePasswordUpdate}
            >

              {/* Current Password */}

              <div className="password-group">

                <label>
                  Current Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    placeholder="••••••••••"
                  />

                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>


              {/* New Password */}

              <div className="password-group">

                <label>
                  New Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="••••••••••"
                  />

                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>


              {/* Confirm Password */}

              <div className="password-group">

                <label>
                  Confirm New Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="••••••••••"
                  />

                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>


              <button
                type="submit"
                className="update-password-button"
              >
                Update Password
              </button>

            </form>

          </section>


          {/* =====================================
              APPEARANCE
          ===================================== */}

          <section className="settings-card appearance-card">

            <h2>
              Appearance
            </h2>

            <div className="appearance-options">

              <button
                type="button"
                className={`appearance-button ${
                  appearance === "System"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setAppearance("System")
                }
              >
                💻
                <span>System</span>
              </button>


              <button
                type="button"
                className={`appearance-button ${
                  appearance === "Light"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setAppearance("Light")
                }
              >
                🌞
                <span>Light</span>
              </button>


              <button
                type="button"
                className={`appearance-button ${
                  appearance === "Dark"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setAppearance("Dark")
                }
              >
                🌙
                <span>Dark</span>
              </button>

            </div>

          </section>

        </div>


        {/* =====================================
            FOOTER
        ===================================== */}

        <footer className="settings-footer">

          <span>
            © 2026 NurseSync AI · Nurse Portal
          </span>

          <span className="settings-system-status">
            <span className="settings-status-dot"></span>
            System Online
          </span>

        </footer>


        {/* Help */}

        <button className="settings-help-button">
          ?
        </button>

      </main>

    </div>
  );
}

export default Settings;