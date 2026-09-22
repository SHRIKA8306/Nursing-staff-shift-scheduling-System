import { useState, useEffect, useCallback } from "react";
import { getInitials } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";

function MySchedule() {
  const navigate = useNavigate();
  const { user, token, role, unreadCount } = useAuth();

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
    { day: "Mon", date: "Today", shift: "Morning", time: "06:00 AM – 02:00 PM", department: nurseDept, today: true },
    { day: "Tue", date: "Tomorrow", shift: "Morning", time: "06:00 AM – 02:00 PM", department: nurseDept },
    { day: "Wed", date: "Day 3", shift: "Evening", time: "02:00 PM – 10:00 PM", department: nurseDept },
    { day: "Thu", date: "Day 4", rest: true },
    { day: "Fri", date: "Day 5", shift: "Night", time: "10:00 PM – 06:00 AM", department: nurseDept }
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
              <span>{unreadCount || 0}</span>
            </button>
            <div className="header-avatar">
              {getInitials(nurseName)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="schedule-content">
          <div className="schedule-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{role === 'admin' ? "Hospital Schedule" : "My Schedule"}</h1>
              <p>{role === 'admin' ? "Manage and view all staff shifts" : `Your shift schedule — ${nurseName} (${user ? user.employeeId : 'EMP-001'})`}</p>
            </div>
            {role === 'admin' && (
              <button 
                className="sign-in-button" 
                style={{ width: 'auto', padding: '0 20px', height: '42px', marginTop: 0 }}
                onClick={() => document.getElementById('assignShiftModal').style.display = 'flex'}
              >
                ➕ Assign Shift
              </button>
            )}
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

        <footer className="nurse-footer">
          <span>© 2026 NurseSync AI · Nurse Portal</span>
          <span className="system-status">
            <span className="status-dot"></span>
            System Online
          </span>
        </footer>

        <button className="help-button">?</button>
      </div>

      {/* ASSIGN SHIFT MODAL */}
      <div id="assignShiftModal" style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 100, alignItems: 'center', justifyContent: 'center' }}>
        <AssignShiftModal onClose={() => document.getElementById('assignShiftModal').style.display = 'none'} fetchSchedule={fetchSchedule} token={token} />
      </div>
    </div>
  );
}

function AssignShiftModal({ onClose, fetchSchedule, token }) {
  const [nurses, setNurses] = useState([]);
  const [formData, setFormData] = useState({
    nurseId: "", date: "", shiftType: "Morning", department: "General"
  });
  const [violations, setViolations] = useState([]);
  const [overrideReason, setOverrideReason] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/users/all", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const ns = data.filter(u => u.role === 'nurse');
          setNurses(ns);
          if (ns.length > 0) setFormData(prev => ({ ...prev, nurseId: ns[0]._id }));
        }
      });
  }, [token]);

  const handleSubmit = async (e, override = false) => {
    e.preventDefault();
    setMsg("");
    setViolations([]);

    try {
      const res = await fetch("/api/shifts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, override, overrideReason })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.violations) {
          setViolations(data.violations);
        } else {
          setMsg(`Error: ${data.message}`);
        }
        return;
      }

      setMsg("Shift assigned successfully!");
      fetchSchedule();
      setTimeout(() => {
        onClose();
        setMsg("");
        setOverrideReason("");
        setViolations([]);
      }, 1500);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
      <h2>Assign Shift</h2>
      {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}
      
      {violations.length > 0 ? (
        <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <h4 style={{ color: '#b91c1c', margin: '0 0 10px' }}>⚠️ Rule Engine Violations</h4>
          <ul style={{ color: '#991b1b', fontSize: '13px', paddingLeft: '20px', margin: '0 0 15px' }}>
            {violations.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Override Reason (Required):</label>
            <input type="text" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setViolations([])} style={{ flex: 1, padding: '8px' }}>Cancel</button>
              <button onClick={(e) => handleSubmit(e, true)} disabled={!overrideReason} style={{ flex: 1, padding: '8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px' }}>Override & Assign</button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={e => handleSubmit(e, false)}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Nurse</label>
            <select value={formData.nurseId} onChange={e => setFormData({...formData, nurseId: e.target.value})} style={{ width: '100%', padding: '8px' }}>
              {nurses.map(n => <option key={n._id} value={n._id}>{n.username}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Shift Type</label>
            <select value={formData.shiftType} onChange={e => setFormData({...formData, shiftType: e.target.value})} style={{ width: '100%', padding: '8px' }}>
              <option value="Morning">Morning (06:00 - 14:00)</option>
              <option value="Evening">Evening (14:00 - 22:00)</option>
              <option value="Night">Night (22:00 - 06:00)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px' }}>Cancel</button>
            <button type="submit" className="sign-in-button" style={{ flex: 1, margin: 0, padding: '10px' }}>Assign</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default MySchedule;