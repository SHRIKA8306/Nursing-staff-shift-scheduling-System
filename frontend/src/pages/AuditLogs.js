import React, { useEffect, useState } from "react";
import { Bell, Menu, CircleHelp } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../styles/Attendance.css";

function AuditLogs() {
  const { user, token, role, unreadCount } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminName = user ? user.username : "Administrator";

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setLogs(data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    if (token && role === "admin") fetchLogs();
    else setLoading(false);
  }, [token, role]);

  if (role !== "admin") return <p style={{ color: "white", padding: 40 }}>Access denied.</p>;

  return (
    <div className="attendance-layout">
      <AdminSidebar />

      <main className="attendance-main">
        <header className="attendance-header">
          <div className="attendance-header-left">
            <button className="attendance-menu-button" type="button">
              <Menu size={25} />
            </button>
            <div className="attendance-welcome">
              <h3>Welcome back, {adminName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>
          <div className="attendance-header-right">
            <button className="attendance-notification" type="button">
              <Bell size={21} /><span>{unreadCount || 0}</span>
            </button>
            <div className="attendance-avatar">{getInitials(adminName)}</div>
          </div>
        </header>

        <div className="attendance-content">
          <div className="attendance-page-heading">
            <h1>Audit Logs</h1>
            <p>View system activity and override records</p>
          </div>

          <section className="weekly-attendance-card">
            <div className="weekly-attendance-header">
              <h2>System Audit Trail</h2>
              <p>All recorded actions</p>
            </div>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>USER</th>
                    <th>ACTION</th>
                    <th>REASON</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>Loading logs...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>No audit logs found.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                        <td>{log.user?.username || "System"}</td>
                        <td>{log.action}</td>
                        <td>{log.reason || "—"}</td>
                        <td>{log.details ? JSON.stringify(log.details) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="attendance-footer">
          <span>© 2026 NurseSync AI · Admin Portal</span>
          <span className="attendance-system-status"><span></span>System Online</span>
        </footer>
      </main>
      <button className="attendance-help-button" type="button"><CircleHelp size={23} /></button>
    </div>
  );
}

export default AuditLogs;
