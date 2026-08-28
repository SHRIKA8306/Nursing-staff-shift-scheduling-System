import { useState } from "react";
import {
  Bell,
  Menu,
  CircleHelp,
  LogIn,
  LogOut,
  CheckCircle,
  Timer
} from "lucide-react";

import NurseSidebar from "../components/NurseSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";

import "../styles/Attendance.css";

function Attendance() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(true);

  const nurseName = user ? user.username : "Nurse";
  const getInitials = (name) => {
    if (!name) return "NS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleCheckIn = () => {
    setCheckedIn(true);
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const attendanceData = [
    {
      day: "Mon Aug 1",
      checkIn: "6:01 AM",
      checkOut: "2:04 PM",
      hours: "8h 03m",
      status: "On Time",
      statusType: "on-time"
    },
    {
      day: "Tue Aug 2",
      checkIn: "6:05 AM",
      checkOut: "2:10 PM",
      hours: "8h 05m",
      status: "On Time",
      statusType: "on-time"
    },
    {
      day: "Wed Aug 3",
      checkIn: "5:58 AM",
      checkOut: "3:12 PM",
      hours: "9h 14m",
      status: "Overtime",
      statusType: "overtime"
    },
    {
      day: "Thu Aug 4",
      checkIn: "6:03 AM",
      checkOut: "2:02 PM",
      hours: "7h 59m",
      status: "On Time",
      statusType: "on-time"
    },
    {
      day: "Fri Aug 5",
      checkIn: "6:02 AM",
      checkOut: "—",
      hours: "In Progress",
      status: "On Time",
      statusType: "on-time"
    }
  ];

  return (
    <div className="attendance-layout">

      {/* SIDEBAR */}
      <NurseSidebar />

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="attendance-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN AREA */}
      <main className="attendance-main">

        {/* HEADER */}
        <header className="attendance-header">
          <div className="attendance-header-left">
            <button
              type="button"
              className="attendance-menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={25} />
            </button>

            <div className="attendance-welcome">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="attendance-header-right">
            <button
              type="button"
              className="attendance-notification"
            >
              <Bell size={21} />
              <span>2</span>
            </button>

            <div className="attendance-avatar">
              {getInitials(nurseName)}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="attendance-content">
          <div className="attendance-page-heading">
            <h1>My Attendance</h1>
            <p>View your check-in history and attendance reports — {nurseName} ({user ? user.employeeId : 'EMP-001'})</p>
          </div>

          {/* TODAY ATTENDANCE CARD */}
          <section className="today-attendance-card">
            <h2>Today — {todayDateString}</h2>


            {/* Attendance Statistics */}

            <div className="attendance-stat-grid">


              {/* Check In */}

              <div className="attendance-stat-card">

                <div className="attendance-stat-icon green">
                  <span>●</span>
                </div>

                <span className="attendance-stat-title">
                  Check In
                </span>

                <strong>
                  {checkedIn ? "6:02 AM" : "—"}
                </strong>

                <small>
                  {checkedIn ? "On time" : "Not checked in"}
                </small>

              </div>


              {/* Check Out */}

              <div className="attendance-stat-card">

                <div className="attendance-stat-icon orange">
                  <span>⌛</span>
                </div>

                <span className="attendance-stat-title">
                  Check Out
                </span>

                <strong>
                  —
                </strong>

                <small>
                  Shift in progress
                </small>

              </div>


              {/* Hours Worked */}

              <div className="attendance-stat-card">

                <div className="attendance-stat-icon purple">
                  <Timer size={23} />
                </div>

                <span className="attendance-stat-title">
                  Hours Worked
                </span>

                <strong>
                  4h 23m
                </strong>

                <small>
                  So far today
                </small>

              </div>


              {/* Status */}

              <div className="attendance-stat-card">

                <div className="attendance-stat-icon status">
                  <CheckCircle size={23} />
                </div>

                <span className="attendance-stat-title">
                  Status
                </span>

                <strong>
                  Active
                </strong>

                <small>
                  Morning shift
                </small>

              </div>

            </div>


            {/* ======================================
                CHECK IN / CHECK OUT BUTTONS
            ====================================== */}

            <div className="attendance-actions">


              <button
                type="button"
                className="check-in-button"
                onClick={handleCheckIn}
              >

                <LogIn size={19} />

                Check In

              </button>


              <button
                type="button"
                className="check-out-button"
                onClick={handleCheckOut}
              >

                <LogOut size={19} />

                Check Out

              </button>

            </div>

          </section>


          {/* ========================================
              WEEKLY ATTENDANCE
          ======================================== */}

          <section className="weekly-attendance-card">


            <div className="weekly-attendance-header">

              <h2>
                Weekly Attendance Report
              </h2>

              <p>
                Aug 1–5, 2026
              </p>

            </div>


            {/* ======================================
                TABLE
            ====================================== */}

            <div className="attendance-table-wrapper">

              <table className="attendance-table">

                <thead>

                  <tr>

                    <th>
                      DAY
                    </th>

                    <th>
                      CHECK IN
                    </th>

                    <th>
                      CHECK OUT
                    </th>

                    <th>
                      HOURS
                    </th>

                    <th>
                      STATUS
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {attendanceData.map(
                    (item, index) => (

                      <tr key={index}>

                        <td>
                          {item.day}
                        </td>

                        <td>
                          {item.checkIn}
                        </td>

                        <td>
                          {item.checkOut}
                        </td>

                        <td
                          className={
                            item.hours ===
                            "In Progress"
                              ? "in-progress"
                              : ""
                          }
                        >
                          {item.hours}
                        </td>

                        <td>

                          <span
                            className={`attendance-status ${item.statusType}`}
                          >
                            {item.status}
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>


          {/* ========================================
              MONTHLY ATTENDANCE
          ======================================== */}

          <section className="monthly-attendance-card">


            <div className="monthly-header">

              <h2>
                Monthly Attendance — August 2026
              </h2>

              <p>
                Days present, absent, and late per week
              </p>

            </div>


            {/* ======================================
                BAR CHART
            ====================================== */}

            <div className="attendance-chart">


              {/* Y Axis */}

              <div className="chart-y-axis">

                <span>8</span>
                <span>6</span>
                <span>4</span>
                <span>2</span>
                <span>0</span>

              </div>


              {/* Chart */}

              <div className="bar-chart-area">


                {/* Horizontal grid */}

                <div className="chart-horizontal-lines">

                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>

                </div>


                {/* W1 */}

                <div className="week-column">

                  <div className="bars">

                    <div
                      className="bar present"
                      style={{
                        height: "125px"
                      }}
                    ></div>

                  </div>

                  <span>
                    W1
                  </span>

                </div>


                {/* W2 */}

                <div className="week-column">

                  <div className="bars">

                    <div
                      className="bar present"
                      style={{
                        height: "100px"
                      }}
                    ></div>

                    <div
                      className="bar absent"
                      style={{
                        height: "25px"
                      }}
                    ></div>

                  </div>

                  <span>
                    W2
                  </span>

                </div>


                {/* W3 */}

                <div className="week-column">

                  <div className="bars">

                    <div
                      className="bar present"
                      style={{
                        height: "125px"
                      }}
                    ></div>

                    <div
                      className="bar late"
                      style={{
                        height: "25px"
                      }}
                    ></div>

                  </div>

                  <span>
                    W3
                  </span>

                </div>


                {/* W4 */}

                <div className="week-column">

                  <div className="bars">

                    <div
                      className="bar present"
                      style={{
                        height: "125px"
                      }}
                    ></div>

                  </div>

                  <span>
                    W4
                  </span>

                </div>

              </div>

            </div>


            {/* Chart Legend */}

            <div className="attendance-legend">

              <div>
                <span className="legend-dot present-dot"></span>
                Present
              </div>

              <div>
                <span className="legend-dot absent-dot"></span>
                Absent
              </div>

              <div>
                <span className="legend-dot late-dot"></span>
                Late
              </div>

            </div>

          </section>


        </div>


        {/* ==========================================
            FOOTER
        ========================================== */}

        <footer className="attendance-footer">

          <span>
            © 2026 NurseSync AI · Nurse Portal
          </span>

          <span className="attendance-system-status">

            <span></span>

            System Online

          </span>

        </footer>


      </main>


      {/* ==========================================
          HELP BUTTON
      ========================================== */}

      <button
        type="button"
        className="attendance-help-button"
      >

        <CircleHelp size={23} />

      </button>


    </div>

  );
}


export default Attendance;