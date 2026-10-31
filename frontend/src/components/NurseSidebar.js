import { useNavigate, useLocation } from "react-router-dom";
import { getInitials } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

function NurseSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
        <div className="sidebar-logo" style={{ background: 'transparent', boxShadow: 'none', padding: 0, overflow: 'hidden' }}>
          <img src="/logo.png" alt="NurseSync AI" style={{ width: '44px', height: '44px', objectFit: 'contain', display: 'block' }} />
        </div>
        <div className="sidebar-brand-text">
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

        {/* Logout Button */}
        <button
          type="button"
          className="logout-button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          title="Logout"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default NurseSidebar;
