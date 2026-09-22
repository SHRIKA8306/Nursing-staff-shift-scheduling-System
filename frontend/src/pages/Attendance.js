import { useState, useEffect, useCallback } from "react";
import { Bell, Menu, CircleHelp, LogIn, LogOut, CheckCircle, Timer } from "lucide-react";
import NurseSidebar from "../components/NurseSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../styles/Attendance.css";

function Attendance() {
  const { user, token, unreadCount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);
  const [loading, setLoading] = useState(true);

  const nurseName = user ? user.username : "Nurse";

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAttendanceData(data);
        const active = data.find(r => !r.checkOut);
        setCheckedIn(!!active);
        setActiveAttendanceId(active ? active._id : null);
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

  const handleCheckIn = async () => {
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: "Checked in via dashboard" })
      });
      if (res.ok) fetchAttendance();
    } catch (err) {
      console.error("Check in error:", err);
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAttendance();
    } catch (err) {
      console.error("Check out error:", err);
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const currentMonthYear = new Date().toLocaleDateString('en-US', {
    month: 'long', year: 'numeric'
  });

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
      <NurseSidebar />
      {sidebarOpen && <div className="attendance-overlay" onClick={() => setSidebarOpen(false)} />}
      
      <main className="attendance-main">
        <header className="attendance-header">
          <div className="attendance-header-left">
            <button className="attendance-menu-button" onClick={() => setSidebarOpen(true)}>
              <Menu size={25} />
            </button>
            <div className="attendance-welcome">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>
          <div className="attendance-header-right">
            <button className="attendance-notification">
              <Bell size={21} /><span>{unreadCount || 0}</span>
            </button>
            <div className="attendance-avatar">{getInitials(nurseName)}</div>
          </div>
        </header>

        <div className="attendance-content">
          <div className="attendance-page-heading">
            <h1>My Attendance</h1>
            <p>View your check-in history and attendance reports — {nurseName}</p>
          </div>

          <section className="today-attendance-card">
            <h2>Today — {todayDateString}</h2>
            <div className="attendance-stat-grid">
              <div className="attendance-stat-card">
                <div className="attendance-stat-icon green"><span>●</span></div>
                <span className="attendance-stat-title">Check In</span>
                <strong>{checkedIn ? formatTime(attendanceData.find(r => r._id === activeAttendanceId)?.checkIn) : "—"}</strong>
                <small>{checkedIn ? "On time" : "Not checked in"}</small>
              </div>
              <div className="attendance-stat-card">
                <div className="attendance-stat-icon orange"><span>⌛</span></div>
                <span className="attendance-stat-title">Check Out</span>
                <strong>—</strong>
                <small>Shift in progress</small>
              </div>
              <div className="attendance-stat-card">
                <div className="attendance-stat-icon purple"><Timer size={23} /></div>
                <span className="attendance-stat-title">Hours Worked</span>
                <strong>—</strong>
                <small>So far today</small>
              </div>
              <div className="attendance-stat-card">
                <div className="attendance-stat-icon status"><CheckCircle size={23} /></div>
                <span className="attendance-stat-title">Status</span>
                <strong>{checkedIn ? "Active" : "Inactive"}</strong>
                <small>Current shift</small>
              </div>
            </div>
            <div className="attendance-actions">
              <button className="check-in-button" onClick={handleCheckIn} disabled={checkedIn}>
                <LogIn size={19} /> Check In
              </button>
              <button className="check-out-button" onClick={handleCheckOut} disabled={!checkedIn}>
                <LogOut size={19} /> Check Out
              </button>
            </div>
          </section>

          <section className="weekly-attendance-card">
            <div className="weekly-attendance-header">
              <h2>Recent Attendance Report</h2>
              <p>Current Week</p>
            </div>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>DAY & DATE</th>
                    <th>CHECK IN</th>
                    <th>CHECK OUT</th>
                    <th>HOURS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
                  ) : attendanceData.length === 0 ? (
                    <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>No records found</td></tr>
                  ) : (
                    attendanceData.map((item) => {
                      const d = new Date(item.checkIn);
                      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
                      return (
                        <tr key={item._id}>
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

          <section className="monthly-attendance-card">
            <div className="monthly-header">
              <h2>Monthly Attendance — {currentMonthYear}</h2>
              <p>Days present, absent, and late per week</p>
            </div>
            <div style={{padding:'20px', textAlign:'center', color:'#64748b'}}>
              Chart placeholder - dynamic chart to be implemented.
            </div>
          </section>
        </div>

        <footer className="attendance-footer">
          <span>© 2026 NurseSync AI · Nurse Portal</span>
          <span className="attendance-system-status"><span></span>System Online</span>
        </footer>
      </main>
      <button className="attendance-help-button"><CircleHelp size={23} /></button>
    </div>
  );
}

export default Attendance;