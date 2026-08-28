import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/admin-dashboard",
    },
    {
      name: "Nurse Management",
      icon: "👥",
      path: "/nurse-management",
    },
    {
      name: "Schedule Management",
      icon: "📅",
      path: "/my-schedule",
    },
    {
      name: "Shift Swaps",
      icon: "⇄",
      path: "/shift-swap",
    },
    {
      name: "Leave Requests",
      icon: "▤",
      path: "/leave-management",
    },
    {
      name: "Attendance Logs",
      icon: "◷",
      path: "/attendance",
    },
    {
      name: "Notifications",
      icon: "♧",
      path: "/notifications",
    },
    {
      name: "Settings",
      icon: "⚙",
      path: "/settings",
    },
  ];

  return (
    <aside className="nurse-sidebar">

      {/* Brand Logo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          ⚡
        </div>
        <div>
          <h2>NurseSync AI</h2>
          <p>Admin Control Portal</p>
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
            </button>
          );
        })}
      </nav>

      {/* Bottom User Info & Logout */}
      <div className="sidebar-bottom">
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

        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: '#059669', color: 'white' }}>
            AD
          </div>
          <div className="user-info">
            <strong>{user ? user.username : 'Administrator'}</strong>
            <span>Admin · System Controller</span>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default AdminSidebar;
