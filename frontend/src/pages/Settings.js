import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import NurseSidebar from "../components/NurseSidebar";
import {
  Bell,
  Eye,
  EyeOff,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  Monitor,
  Sun,
  Moon,
  LogOut
} from "lucide-react";
import { getInitials } from "../utils/helpers";
import { getSavedTheme, applyTheme as applyGlobalTheme } from "../utils/theme";
import "../styles/Settings.css";

function Settings() {
  const navigate = useNavigate();
  const { user, logout, unreadCount, role, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nurseName = user ? user.username : "Nurse";

  // Appearance / Theme
  const [appearance, setAppearance] = useState(getSavedTheme);

  const applyTheme = (themeMode) => {
    setAppearance(themeMode);
    applyGlobalTheme(themeMode);
  };

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail.themeMode) {
        setAppearance(e.detail.themeMode);
      }
    };
    window.addEventListener("nursesync-theme-changed", handleThemeChange);
    return () => window.removeEventListener("nursesync-theme-changed", handleThemeChange);
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

  // Test Email State
  const [testEmailTarget, setTestEmailTarget] = useState(user?.email || "shrika080306@gmail.com");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setTestEmailLoading(true);
    setTestEmailResult(null);

    const authToken = token || localStorage.getItem("nurse_sync_token") || localStorage.getItem("token");

    try {
      const res = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ to: testEmailTarget })
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err) {
      setTestEmailResult({
        success: false,
        message: "Failed to connect to backend server: " + err.message
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  return (
    <div className="nurse-layout">

      {/* SIDEBAR */}
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN AREA */}
      <main className="nurse-main">

        {/* HEADER */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>Settings</h1>
              <p>Manage your account preferences, themes, and configuration · NurseSync AI</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              className="header-notification"
              type="button"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell size={20} />
              <span>{unreadCount || 0}</span>
            </button>

            {role !== 'admin' && (
              <div className="header-avatar" onClick={() => navigate("/profile")}>
                {getInitials(nurseName)}
              </div>
            )}
          </div>
        </header>

        {/* =====================================
            PAGE CONTENT
        ===================================== */}

        <div style={{ padding: "24px 32px 32px" }}>
          <div className="settings-content" style={{ padding: 0 }}>

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
              EMAIL NOTIFICATIONS & SMTP DIAGNOSTICS
          ===================================== */}
          <section className="settings-card" style={{ borderLeft: "4px solid #0284c7", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f0f9ff", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={18} color="#0284c7" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>Email Notification & SMTP Diagnostics</h2>
                  <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                    Verify that approval/rejection emails and leave notifications reach real inboxes.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendTestEmail} style={{ marginTop: "16px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Send Test Email To:
                </label>
                <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
                  <input
                    type="email"
                    required
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    placeholder="Enter email (e.g. shrikasenthilkumar8@gmail.com)"
                    style={{
                      flex: 1,
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    type="submit"
                    disabled={testEmailLoading}
                    style={{
                      height: "44px",
                      background: "#0284c7",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 20px",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      cursor: testEmailLoading ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      opacity: testEmailLoading ? 0.7 : 1,
                      boxSizing: "border-box"
                    }}
                  >
                    {testEmailLoading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Send Test Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {testEmailResult && (
                <div style={{
                  padding: "14px 18px",
                  borderRadius: "8px",
                  marginTop: "16px",
                  background: testEmailResult.success ? "#ecfdf5" : "#fef2f2",
                  border: `1px solid ${testEmailResult.success ? "#a7f3d0" : "#fecaca"}`,
                  color: testEmailResult.success ? "#065f46" : "#991b1b"
                }}>
                  <div style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {testEmailResult.success ? (
                      <>
                        <CheckCircle2 size={17} />
                        <span>Success!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={17} />
                        <span>Delivery Issue</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
                    {testEmailResult.message}
                  </div>
                  {testEmailResult.hint && (
                    <div style={{ marginTop: "8px", fontSize: "0.825rem", color: "#b91c1c", background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <Info size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Required Action:</strong> {testEmailResult.hint}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </section>

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
                <Monitor size={17} />
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
                <Sun size={17} />
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
                <Moon size={17} />
                <span>Dark</span>
              </button>

            </div>

          </section>

          {/* =====================================
              ACCOUNT & SESSION (LOGOUT)
          ===================================== */}
          <section className="settings-card logout-card" style={{ borderLeft: '4px solid #ef4444', borderRadius: '12px', marginTop: '32px' }}>
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
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                  transition: 'background-color 0.15s ease, transform 0.15s ease'
                }}
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out of NurseSync AI?")) {
                    logout();
                    window.location.href = "/";
                  }
                }}
              >
                <LogOut size={16} />
                <span>Sign Out of NurseSync AI</span>
              </button>
            </div>
          </section>

        </div>
        </div>

        {/* =====================================
            FOOTER
        ===================================== */}

        {/* Help */}

        <button className="settings-help-button">
          ?
        </button>

      </main>

    </div>
  );
}

export default Settings;