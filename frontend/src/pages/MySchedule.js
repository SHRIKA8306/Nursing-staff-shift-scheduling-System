import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";

function MySchedule() {
  const navigate = useNavigate();
  const { user, token, role } = useAuth();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = role === 'admin' ? '/api/shifts/all' : '/api/shifts/my-schedule';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setShifts(data);
      }
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, role]);

  useEffect(() => {
    if (token) {
      fetchSchedule();
    }
  }, [token, fetchSchedule]);

  const handleSwap = (shift) => {
    navigate("/shift-swap", {
      state: { shift: shift }
    });
  };

  const getInitials = (name) => {
    if (!name) return "NS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const nurseName = user ? user.username : "Nurse";
  const nurseDept = user ? user.department || "General Ward" : "ICU";

  // Safe Date Formatting
  const parseShiftDate = (dStr) => {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return { day: 'Day', date: dStr };
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const displaySchedule = shifts.length > 0 ? shifts.map(s => {
    const formatted = parseShiftDate(s.date);
    const shiftNurseName = s.nurse ? (s.nurse.username || s.nurse.name) : nurseName;
    return {
      id: s._id,
      day: formatted.day,
      date: formatted.date,
      nurseName: shiftNurseName,
      shift: s.shiftType,
      time: `${s.startTime} – ${s.endTime}`,
      department: s.department || nurseDept,
      today: new Date(s.date).toDateString() === new Date().toDateString(),
      rest: s.status === 'Cancelled'
    };
  }) : [
    { day: "Mon", date: "Today", shift: "Morning", time: "07:00 AM – 03:00 PM", department: nurseDept, today: true },
    { day: "Tue", date: "Tomorrow", shift: "Morning", time: "07:00 AM – 03:00 PM", department: nurseDept },
    { day: "Wed", date: "Day 3", shift: "Evening", time: "03:00 PM – 11:00 PM", department: nurseDept },
    { day: "Thu", date: "Day 4", rest: true },
    { day: "Fri", date: "Day 5", shift: "Night", time: "11:00 PM – 07:00 AM", department: nurseDept }
  ];

  return (
    <div className="nurse-layout">
      {/* Sidebar */}
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

      {/* Main Area */}
      <div className="nurse-main">
        {/* Top Header */}
        <header className="nurse-header">
          <div className="header-left">
            <button className="hamburger-button">☰</button>
            <div className="welcome-text">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="header-right">
            <button className="header-notification">
              ♧
              <span>2</span>
            </button>
            <div className="header-avatar">
              {getInitials(nurseName)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="schedule-content">
          <div className="schedule-heading">
            <h1>My Schedule</h1>
            <p>Your shift schedule — {nurseName} ({user ? user.employeeId : 'EMP-001'})</p>
          </div>

          <section className="schedule-card">
            <div className="schedule-card-header">
              <h2>Assigned Shift Roster</h2>
              <LiveClock showDate={true} showTime={false} />
            </div>

            <div className="schedule-list">
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading your shift schedule...</p>
              ) : (
                displaySchedule.map((item, index) => (
                  <div className="schedule-row" key={item.id || index}>
                    <div className="day-column">
                      <strong>{item.day}</strong>
                      <span>{item.date}</span>
                    </div>

                    <div className="shift-column">
                      {item.rest ? (
                        <span className="rest-day">Rest Day</span>
                      ) : (
                        <>
                          <div className="shift-labels">
                            <span className="morning-label">{item.shift} Shift</span>
                            {item.today && <span className="today-label">Today</span>}
                          </div>
                          <p className="shift-time">{item.time} · {item.department}</p>
                        </>
                      )}
                    </div>

                    <div className="swap-column">
                      {!item.rest && (
                        <button className="swap-button" onClick={() => handleSwap(item)}>
                          Request Swap
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="nurse-footer">
          <span>© 2026 NurseSync AI · Nurse Portal</span>
          <span className="system-status">
            <span className="status-dot"></span>
            System Online
          </span>
        </footer>

        <button className="help-button">?</button>
      </div>
    </div>
  );
}

export default MySchedule;