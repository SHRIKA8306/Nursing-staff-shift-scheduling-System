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
    <div className="nurse-layout">
      <AdminSidebar />

      <main className="nurse-main">
        <header className="nurse-header">
          <div className="header-left">
            <button className="menu-toggle" type="button">
              <Menu size={25} />
            </button>
            <div className="welcome-text">
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>System Audit Logs</h3>
              <LiveClock showDate={true} showTime={true} className="admin-header-clock" />
            </div>
          </div>
          <div className="header-right">
            <button className="header-notification" type="button">
              <Bell size={21} /><span>{unreadCount || 0}</span>
            </button>
            <div className="header-avatar">{getInitials(adminName)}</div>
          </div>
        </header>

        <div className="schedule-content" style={{ padding: '28px' }}>
          <div className="schedule-heading">
            <h1>Audit Logs</h1>
            <p>View system activity, shift assignments, and override records</p>
          </div>

          <section className="weekly-attendance-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <div className="weekly-attendance-header" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>System Audit Trail</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b' }}>All recorded administrative actions and rule engine logs</p>
            </div>
            <div className="attendance-table-wrapper">
              <table className="attendance-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>DATE & TIME</th>
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
                        <td style={{ fontWeight: '600', color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{log.user?.username || "System Admin"}</td>
                        <td>
                          <span style={{ 
                            background: '#e0f2fe', 
                            color: '#0369a1', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: '700' 
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.reason || "System Operation"}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AuditLogs;
