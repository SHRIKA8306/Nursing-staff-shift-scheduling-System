import { useState, useEffect } from "react";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import NurseSidebar from "../components/NurseSidebar";
import {
  Bell,
  Menu,
  Eye,
  EyeOff,
} from "lucide-react";
import { getInitials } from "../utils/helpers";
import "../styles/Settings.css";

function Settings() {
  const { user, logout, unreadCount, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nurseName = user ? user.username : "Nurse";

  // Appearance / Theme
  const [appearance, setAppearance] = useState(() => {
    return localStorage.getItem("nursesync_theme") || "Light";
  });

  const applyTheme = (themeMode) => {
    setAppearance(themeMode);
    localStorage.setItem("nursesync_theme", themeMode);
    
    const root = document.documentElement;
    if (themeMode === "Dark") {
      document.body.classList.add("dark-theme");
      root.setAttribute("data-theme", "dark");
    } else if (themeMode === "Light") {
      document.body.classList.remove("dark-theme");
      root.setAttribute("data-theme", "light");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.body.classList.add("dark-theme");
        root.setAttribute("data-theme", "dark");
      } else {
        document.body.classList.remove("dark-theme");
        root.setAttribute("data-theme", "light");
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("nursesync_theme") || "Light";
    applyTheme(saved);
  }, []);

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

  return (
    <div className="nurse-layout">

      {/* SIDEBAR */}
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

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
              Appearance Theme
            </h2>

            <div className="appearance-options">

              <button
                type="button"
                className={`appearance-button ${
                  appearance === "System"
                    ? "selected"
                    : ""
                }`}
                onClick={() => applyTheme("System")}
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
                onClick={() => applyTheme("Light")}
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
                onClick={() => applyTheme("Dark")}
              >
                🌙
                <span>Dark</span>
              </button>

            </div>

          </section>


          {/* =====================================
              ACCOUNT & SESSION (LOGOUT)
          ===================================== */}
          <section className="settings-card logout-card" style={{ borderLeft: '4px solid #ef4444', marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ color: '#ef4444', margin: 0, fontSize: '18px', fontWeight: '800' }}>
                  Account Session & Logout
                </h2>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
                  Active User: <strong style={{ color: '#0f172a' }}>{nurseName}</strong> ({role ? role.toUpperCase() : 'USER'}) · Employee ID: {user ? user.employeeId || 'EMP-001' : 'EMP-001'}
                </p>
              </div>
              <button
                type="button"
                className="settings-logout-btn"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out of NurseSync AI?")) {
                    logout();
                    window.location.href = "/";
                  }
                }}
              >
                <span>🔒</span> Sign Out of NurseSync AI
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