import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CircleHelp } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../styles/Attendance.css";

function AdminAttendance() {
  const navigate = useNavigate();
  const { token, unreadCount } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="nurse-layout">
      <AdminSidebar />
      
      <main className="nurse-main">
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>Staff Attendance Report</h1>
              <p>View all staff check-in history and timesheets · NurseSync AI</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              className="header-notification"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell size={18} /><span>{unreadCount || 0}</span>
            </button>
          </div>
        </header>

        <div style={{ padding: "24px 32px 32px" }}>
          <div className="attendance-content" style={{ padding: 0 }}>

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
        </div>

      </main>
      <button className="attendance-help-button"><CircleHelp size={23} /></button>
    </div>
  );
}

export default AdminAttendance;