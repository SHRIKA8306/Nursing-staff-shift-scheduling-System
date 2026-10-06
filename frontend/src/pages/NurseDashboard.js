import React, { useState, useEffect, useCallback } from "react";
import { getInitials } from "../utils/helpers";
import {
  Bell,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../styles/NurseDashboard.css";
import "../App.css";

function NurseDashboard() {
  const navigate = useNavigate();
  const { user, token, unreadCount } = useAuth();

  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const fetchNurseData = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. My shifts
      const shiftsRes = await fetch("/api/shifts/my-schedule", { headers });
      const shiftsData = await shiftsRes.json();
      if (Array.isArray(shiftsData)) {
        setShifts(shiftsData);
      }

      // 2. Attendance
      const attRes = await fetch("/api/attendance", { headers });
      const attData = await attRes.json();
      if (Array.isArray(attData)) {
        setAttendance(attData);
      }

      // 3. Pending leave requests & swaps
      const leavesRes = await fetch("/api/leaves", { headers });
      const leavesData = await leavesRes.json();
      const myPendingLeaves = Array.isArray(leavesData) ? leavesData.filter(l => l.status === "Pending") : [];

      const swapsRes = await fetch("/api/swaps", { headers });
      const swapsData = await swapsRes.json();
      const myPendingSwaps = Array.isArray(swapsData) ? swapsData.filter(s => s.status === "Pending") : [];

      setPendingRequests([
        ...myPendingLeaves.map(l => ({ ...l, reqType: "Leave" })),
        ...myPendingSwaps.map(s => ({ ...s, reqType: "Shift Swap" }))
      ]);

      // 4. Notifications
      const notifRes = await fetch("/api/notifications", { headers });
      const notifData = await notifRes.json();
      if (Array.isArray(notifData)) {
        setRecentNotifications(notifData.slice(0, 4));
      }
    } catch (err) {
      console.error("Nurse dashboard data error:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNurseData();
    }
  }, [token, fetchNurseData]);

  const nurseName = user?.username || "Nurse";
  const nurseDept = user?.department || "General Ward";
  const nurseEmpId = user?.employeeId || "EMP-001";

  // Calculate Today's Shift & Next Shift
  const todayStr = new Date().toDateString();
  const todayShift = shifts.find(s => new Date(s.date).toDateString() === todayStr);
  const futureShifts = shifts
    .filter(s => new Date(s.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextShift = todayShift ? todayShift : (futureShifts.length > 0 ? futureShifts[0] : null);

  // Total weekly working hours calculation
  const totalWeeklyHours = shifts.filter(s => {
    const sDate = new Date(s.date);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return sDate >= startOfWeek;
  }).length * 8;

  // Latest attendance
  const lastAttendance = attendance.length > 0 ? attendance[0] : null;

  return (
    <div className="nurse-layout">
      {/* SIDEBAR */}
      <NurseSidebar />

      {/* MAIN CONTENT */}
      <main className="nurse-main">
        {/* HEADER */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>Welcome back, {nurseName} 👋</h1>
              <p>Department: {nurseDept} · Employee ID: {nurseEmpId}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              type="button"
              className="header-notification"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={20} />
              <span>{unreadCount || 0}</span>
            </button>
            <div className="header-avatar" onClick={() => navigate("/profile")}>
              {getInitials(nurseName)}
            </div>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>

          {/* TOP METRICS (Spec 4: Today's Shift, Next Shift, Working Hours, Attendance, Leave Balance, Pending Requests, Notifications) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            
            {/* Today's Shift */}
            <div className="stat-card" onClick={() => navigate("/my-schedule")} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Today's Shift</span>
                <Clock size={18} color="#0ea5e9" />
              </div>
              <div className="stat-value" style={{ fontSize: "20px", color: todayShift ? "#0284c7" : "#64748b" }}>
                {todayShift ? `${todayShift.shiftType} (${todayShift.startTime})` : "Off Duty Today"}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {todayShift ? todayShift.department : "Rest & Recovery"}
              </span>
            </div>

            {/* Next Shift */}
            <div className="stat-card" onClick={() => navigate("/my-schedule")} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Next Shift</span>
                <Calendar size={18} color="#8b5cf6" />
              </div>
              <div className="stat-value" style={{ fontSize: "18px", color: "#6d28d9" }}>
                {nextShift ? `${nextShift.shiftType} Shift` : "None Scheduled"}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {nextShift ? `${new Date(nextShift.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${nextShift.startTime}` : "Check back later"}
              </span>
            </div>

            {/* Working Hours */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Working Hours</span>
                <span style={{ fontSize: "18px" }}>⏱️</span>
              </div>
              <div className="stat-value" style={{ color: "#10b981" }}>
                {totalWeeklyHours}h
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>This week (Max 48h)</span>
            </div>

            {/* Attendance Status */}
            <div className="stat-card" onClick={() => navigate("/attendance")} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Attendance</span>
                <CheckCircle2 size={18} color="#16a34a" />
              </div>
              <div className="stat-value" style={{ fontSize: "18px", color: "#16a34a" }}>
                {lastAttendance ? lastAttendance.status : "Present"}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {lastAttendance ? `Last: ${new Date(lastAttendance.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Recorded in system"}
              </span>
            </div>

            {/* Leave Balance */}
            <div className="stat-card" onClick={() => navigate("/leave-management")} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Leave Balance</span>
                <FileText size={18} color="#f59e0b" />
              </div>
              <div className="stat-value" style={{ color: "#b45309" }}>
                14 Days
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Annual & casual leave</span>
            </div>

            {/* Pending Requests */}
            <div className="stat-card" onClick={() => navigate("/leave-management")} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Pending Requests</span>
                <AlertCircle size={18} color={pendingRequests.length > 0 ? "#ea580c" : "#10b981"} />
              </div>
              <div className="stat-value" style={{ color: pendingRequests.length > 0 ? "#ea580c" : "#10b981" }}>
                {pendingRequests.length}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Awaiting Admin review</span>
            </div>

          </div>

          {/* TWO COLUMN GRID: Upcoming Schedule & Notifications / Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
            
            {/* UPCOMING SCHEDULE TABLE / CARD LAYOUT (Spec 4 & 5) */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                    My Assigned Schedule
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Your upcoming official hospital duties
                  </p>
                </div>
                <button
                  onClick={() => navigate("/my-schedule")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0ea5e9",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  Full Schedule <ChevronRight size={16} />
                </button>
              </div>

              {shifts.length === 0 ? (
                <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                  No shifts currently assigned. The administrator will publish your upcoming roster soon.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="nurse-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Shift</th>
                        <th>Timing</th>
                        <th>Ward/Dept</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.slice(0, 5).map((shift) => {
                        const sDate = new Date(shift.date);
                        const isToday = sDate.toDateString() === todayStr;

                        return (
                          <tr key={shift._id} style={isToday ? { background: "#f0f9ff" } : {}}>
                            <td>
                              <div style={{ fontWeight: "700", color: "#1e293b" }}>
                                {sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                {sDate.toLocaleDateString("en-US", { weekday: "short" })}
                                {isToday && <span style={{ marginLeft: "6px", color: "#0ea5e9", fontWeight: "700" }}>TODAY</span>}
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  background:
                                    shift.shiftType === "Morning" ? "#eff6ff" :
                                    shift.shiftType === "Evening" ? "#fef3c7" : "#f5f3ff",
                                  color:
                                    shift.shiftType === "Morning" ? "#1d4ed8" :
                                    shift.shiftType === "Evening" ? "#b45309" : "#6d28d9"
                                }}
                              >
                                {shift.shiftType}
                              </span>
                            </td>
                            <td style={{ color: "#475569", fontSize: "13px" }}>
                              {shift.startTime} – {shift.endTime}
                            </td>
                            <td style={{ color: "#334155" }}>
                              {shift.department || nurseDept}
                            </td>
                            <td>
                              <button
                                onClick={() => navigate("/shift-swap", { state: { shift } })}
                                style={{
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer"
                                }}
                              >
                                Swap
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* NOTIFICATIONS & PENDING REQUESTS WIDGET */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Quick Actions */}
              <div className="card" style={{ padding: "20px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "#1e293b", fontWeight: "700" }}>
                  Quick Staff Actions
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    onClick={() => navigate("/leave-management")}
                    className="btn-primary"
                    style={{ fontSize: "12px", padding: "10px 12px" }}
                  >
                    + Request Leave
                  </button>
                  <button
                    onClick={() => navigate("/shift-swap")}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      color: "#334155",
                      fontWeight: "600",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    ⇄ Request Swap
                  </button>
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", color: "#1e293b", fontWeight: "700" }}>
                    Recent Notifications
                  </h4>
                  <button
                    onClick={() => navigate("/notifications")}
                    style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    View All →
                  </button>
                </div>

                {recentNotifications.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>No new notifications.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recentNotifications.map(n => (
                      <div key={n._id} style={{
                        padding: "10px 12px",
                        background: n.read ? "#f8fafc" : "#eff6ff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "12px", color: "#1e293b" }}>{n.title}</strong>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#475569" }}>
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default NurseDashboard;