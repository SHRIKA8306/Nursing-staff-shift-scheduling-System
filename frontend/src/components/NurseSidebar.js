import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getInitials } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { getSavedTheme, applyTheme } from "../utils/theme";

function NurseSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(getSavedTheme);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail?.themeMode) {
        setCurrentTheme(e.detail.themeMode);
      }
    };
    window.addEventListener("nursesync-theme-changed", handleThemeChange);
    return () => window.removeEventListener("nursesync-theme-changed", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === "Dark" ? "Light" : "Dark";
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/nurse-dashboard",
    },
    {
      name: "My Schedule",
      icon: "□",
      path: "/my-schedule",
    },
    {
      name: "Shift Swap",
      icon: "⇄",
      path: "/shift-swap",
    },
    {
      name: "Leave Management",
      icon: "▤",
      path: "/leave-management",
    },
    {
      name: "Attendance",
      icon: "◷",
      path: "/attendance",
    },
    {
      name: "Notifications",
      icon: "♧",
      path: "/notifications",
    },
    {
      name: "Profile",
      icon: "♙",
      path: "/profile",
    },
    {
      name: "Settings",
      icon: "⚙",
      path: "/settings",
    },
  ];


  return (
    <aside className="nurse-sidebar">

      {/* Logo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          ♡
        </div>
        <div>
          <h2>NurseSync AI</h2>
          <p>Nurse Portal</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <button
              key={item.name}
              type="button"
              className={`sidebar-item ${active ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>

              {item.name === "Notifications" && (
                <span className="notification-count">2</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-theme-toggle"
          onClick={toggleTheme}
          title="Toggle Light / Dark Theme"
        >
          <span className="theme-toggle-label">
            {currentTheme === "Dark" ? "🌙 Dark Mode" : "🌞 Light Mode"}
          </span>
          <span className="theme-toggle-indicator">Switch</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          className="logout-button"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <span>↪</span>
          Logout
        </button>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {getInitials(user ? user.username : "Nurse")}
          </div>

          <div className="user-info">
            <strong>{user ? user.username : "Nurse User"}</strong>
            <span>
              {user ? user.department || "General" : "ICU"} · {user ? user.employeeId || "EMP-001" : "EMP-001"}
            </span>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default NurseSidebar;