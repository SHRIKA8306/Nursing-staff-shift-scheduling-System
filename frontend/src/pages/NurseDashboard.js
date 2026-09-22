import { useState, useEffect, useCallback } from "react";
import { getInitials } from "../utils/helpers";
import {
  Bell,
  Menu,
  ChevronRight,
  Building2,
  CircleHelp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../styles/NurseDashboard.css";

function NurseDashboard() {
  const navigate = useNavigate();
  const { user, token, unreadCount } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shifts, setShifts] = useState([]);

  const fetchMyShifts = useCallback(async () => {
    try {
      const res = await fetch("/api/shifts/my-schedule", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setShifts(data);
      }
    } catch (err) {
      console.error("Error fetching shifts:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchMyShifts();
    }
  }, [token, fetchMyShifts]);


  const nurseName = user ? user.username : "Nurse";
  const nurseDept = user ? user.department || "General Ward" : "ICU Ward A";
  const nurseEmpId = user ? user.employeeId || "EMP-001" : "EMP-001";

  // Determine next shift
  const nextShift = shifts.length > 0 ? shifts[0] : null;

  return (
    <div className="nurse-layout">

      {/* SIDEBAR */}
      <NurseSidebar />

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN AREA */}
      <main className="nurse-main">

        {/* TOP HEADER */}
        <header className="nurse-header">

          <div className="header-left">
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={25} />
            </button>

            <div className="header-welcome">
              <h1>Welcome back, {nurseName}! 👋</h1>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="header-notification"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={22} />
              <span>{unreadCount || 0}</span>
            </button>

            <button
              type="button"
              className="header-avatar"
              onClick={() => navigate("/profile")}
            >
              {getInitials(nurseName)}
            </button>
          </div>

        </header>

        {/* DASHBOARD CONTENT */}
        <div className="dashboard-content">

          {/* WELCOME HERO */}
          <section className="dashboard-hero">

            <div className="hero-main-content">
              <h2>Good day, {nurseName}! 👋</h2>
              <p>
                Your next assigned shift:{" "}
                <strong>
                  {nextShift ? `${nextShift.startTime} - ${nextShift.endTime}` : "07:00 AM"}
                </strong>
                {" "}— {nurseDept}
              </p>
            </div>

            {/* NEXT SHIFT */}
            <div className="next-shift-card">
              <div className="next-shift-time">
                {nextShift ? nextShift.startTime : "07:00 AM"}
              </div>
              <div className="next-shift-label">
                Next shift start
              </div>
            </div>

            {/* QUICK STATISTICS */}
            <div className="quick-stats">

              {/* Department */}
              <div className="quick-stat">
                <div className="quick-stat-icon">
                  <Building2 size={20} />
                </div>
                <div>
                  <strong>{nurseDept}</strong>
                  <span>{nurseEmpId}</span>
                </div>
              </div>

              {/* Leave Balance */}
              <div className="quick-stat">
                <div className="quick-stat-emoji">🏖️</div>
                <div>
                  <strong>12 days</strong>
                  <span>Leave Balance</span>
                </div>
              </div>

              {/* Working Hours */}
              <div className="quick-stat">
                <div className="quick-stat-emoji">⏱️</div>
                <div>
                  <strong>33.7h</strong>
                  <span>Hours This Week</span>
                </div>
              </div>

              {/* Overtime */}
              <div className="quick-stat">
                <div className="quick-stat-emoji">⚡</div>
                <div>
                  <strong>1.7h</strong>
                  <span>Overtime</span>
                </div>
              </div>

            </div>

          </section>

          {/* LOWER CONTENT */}
          <div className="dashboard-grid">

            {/* WEEKLY WORKING HOURS CHART */}
            <section className="working-hours-card">
              <div className="card-header">
                <div>
                  <h3>Weekly Working Hours</h3>
                  <p>Your working hours and shift distribution</p>
                </div>
              </div>

              <div className="chart-container">
                <div className="y-axis">
                  <span>12</span>
                  <span>9</span>
                  <span>6</span>
                  <span>3</span>
                  <span>0</span>
                </div>

                <div className="chart-area">
                  <div className="chart-grid">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <svg
                    className="working-chart"
                    viewBox="0 0 700 230"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#20bfae" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#20bfae" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path
                      d="
                        M 0 72
                        C 50 78, 80 80, 115 82
                        C 160 85, 185 85, 220 67
                        C 260 50, 285 50, 320 65
                        C 355 80, 380 82, 415 72
                        C 450 63, 475 63, 510 70
                        C 545 78, 560 115, 580 170
                        C 600 205, 640 205, 700 205
                        L 700 230
                        L 0 230
                        Z
                      "
                      fill="url(#areaGradient)"
                    />

                    <path
                      d="
                        M 0 72
                        C 50 78, 80 80, 115 82
                        C 160 85, 185 85, 220 67
                        C 260 50, 285 50, 320 65
                        C 355 80, 380 82, 415 72
                        C 450 63, 475 63, 510 70
                        C 545 78, 560 115, 580 170
                        C 600 205, 640 205, 700 205
                      "
                      fill="none"
                      stroke="#20bfae"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    <circle cx="0" cy="72" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                    <circle cx="115" cy="82" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                    <circle cx="220" cy="67" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                    <circle cx="320" cy="65" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                    <circle cx="415" cy="72" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                    <circle cx="580" cy="205" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                    <circle cx="700" cy="205" r="6" fill="white" stroke="#20bfae" strokeWidth="4" />
                  </svg>

                  <div className="x-axis">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </section>

            {/* UPCOMING SHIFTS */}
            <section className="upcoming-shifts-card">
              <div className="upcoming-header">
                <h3>Upcoming Shifts</h3>
                <button
                  type="button"
                  onClick={() => navigate("/my-schedule")}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {shifts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  <p>No upcoming shifts assigned yet.</p>
                </div>
              ) : (
                shifts.slice(0, 3).map((shift, idx) => (
                  <div key={shift._id || idx} className={`shift-item ${idx === 0 ? 'active-shift' : ''}`}>
                    <div className="shift-top">
                      <span>{new Date(shift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {idx === 0 && <span className="active-label">Active</span>}
                    </div>
                    <h4>{shift.shiftType} Shift</h4>
                    <p>{shift.startTime} – {shift.endTime} · {shift.department || nurseDept}</p>
                  </div>
                ))
              )}

              <button
                type="button"
                className="view-schedule"
                onClick={() => navigate("/my-schedule")}
              >
                View Full Schedule
                <ChevronRight size={17} />
              </button>
            </section>

          </div>

          {/* FOOTER */}
          <footer className="dashboard-footer">
            <span>© 2026 NurseSync AI · Nurse Portal</span>
            <span className="system-status">
              <span></span>
              System Online
            </span>
          </footer>

        </div>
      </main>

      {/* HELP BUTTON */}
      <button type="button" className="dashboard-help">
        <CircleHelp size={24} />
      </button>

    </div>
  );
}

export default NurseDashboard;