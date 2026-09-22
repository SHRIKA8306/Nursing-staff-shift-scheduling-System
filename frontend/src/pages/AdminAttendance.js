import { useState, useEffect, useCallback } from "react";
import { Bell, Menu, CircleHelp } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../styles/Attendance.css";

function AdminAttendance() {
  const { user, token, unreadCount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminName = user ? user.username : "Administrator";

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAttendanceData(data);
      }
    } catch (err) {
      console.error("Fetch attendance error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchAttendance();
  }, [token, fetchAttendance]);

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (inTime, outTime) => {
    if (!inTime) return "—";
    if (!outTime) return "In Progress";
    const diff = new Date(outTime) - new Date(inTime);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="attendance-layout">
      <AdminSidebar />
      {sidebarOpen && <div className="attendance-overlay" onClick={() => setSidebarOpen(false)} />}
      
      <main className="attendance-main">
        <header className="attendance-header">
          <div className="attendance-header-left">
            <button className="attendance-menu-button" onClick={() => setSidebarOpen(true)}>
              <Menu size={25} />
            </button>
            <div className="attendance-welcome">
              <h3>Welcome back, {adminName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>
          <div className="attendance-header-right">
            <button className="attendance-notification">
              <Bell size={21} /><span>{unreadCount || 0}</span>
            </button>
            <div className="attendance-avatar">{getInitials(adminName)}</div>
          </div>
        </header>

        <div className="attendance-content">
          <div className="attendance-page-heading">
            <h1>Staff Attendance Report</h1>
            <p>View all staff check-in history and timesheets</p>
          </div>

          <section className="weekly-attendance-card">
            <div className="weekly-attendance-header">
              <h2>All Staff Attendance</h2>
              <p>Current Week</p>
            </div>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>NURSE</th>
                    <th>DAY & DATE</th>
                    <th>CHECK IN</th>
                    <th>CHECK OUT</th>
                    <th>HOURS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
                  ) : attendanceData.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign:'center', padding:'20px'}}>No records found</td></tr>
                  ) : (
                    attendanceData.map((item) => {
                      const d = new Date(item.checkIn);
                      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
                      return (
                        <tr key={item._id}>
                          <td>{item.nurse ? item.nurse.username : 'Unknown'}</td>
                          <td>{dayStr}</td>
                          <td>{formatTime(item.checkIn)}</td>
                          <td>{formatTime(item.checkOut)}</td>
                          <td className={!item.checkOut ? "in-progress" : ""}>
                            {calculateHours(item.checkIn, item.checkOut)}
                          </td>
                          <td>
                            <span className={`attendance-status ${item.status === 'Present' ? 'on-time' : 'overtime'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
      <button className="attendance-help-button"><CircleHelp size={23} /></button>
    </div>
  );
}

export default AdminAttendance;