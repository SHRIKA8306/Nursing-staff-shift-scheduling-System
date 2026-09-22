import React, { useEffect, useState } from "react";
import { Bell, Menu, CircleHelp } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../styles/Certifications.css";
import "../styles/Attendance.css";

function Certifications() {
  const { user, token, role, unreadCount } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminName = user ? user.username : "Administrator";

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await fetch('/api/certifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setCerts(data);
      } catch (err) {
        console.error('Failed to fetch certifications', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCerts();
  }, [token]);

  if (role !== 'admin') return <p style={{ color: "white", padding: 40 }}>Access denied.</p>;

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
            <h1>Certifications</h1>
            <p>View and manage nurse certifications</p>
          </div>

          <section className="weekly-attendance-card">
            <div className="weekly-attendance-header">
              <h2>Nurse Certifications</h2>
              <p>All certification records</p>
            </div>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>NURSE</th>
                    <th>CERTIFICATION</th>
                    <th>ISSUED</th>
                    <th>EXPIRES</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
                  ) : certs.length === 0 ? (
                    <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>No certifications found.</td></tr>
                  ) : (
                    certs.map((c) => (
                      <tr key={c._id}>
                        <td>{c.nurseName}</td>
                        <td>{c.name}</td>
                        <td>{new Date(c.issuedAt).toLocaleDateString()}</td>
                        <td>{new Date(c.expiresAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`attendance-status ${c.isValid ? 'on-time' : 'overtime'}`}>
                            {c.isValid ? 'Valid' : 'Expired'}
                          </span>
                        </td>
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

export default Certifications;
