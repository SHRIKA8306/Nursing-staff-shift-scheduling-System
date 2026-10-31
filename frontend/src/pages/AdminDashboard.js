import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Bell,
  Users,
  Stethoscope,
  Clock,
  ClipboardList,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Moon,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import "../App.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, unreadCount } = useAuth();

  const [stats, setStats] = useState({
    totalNurses: 0,
    nursesOnDuty: 0,
    pendingRequests: 0,
    openShifts: 0,
    staffingRisk: "Low"
  });

  const [todayWorkforce, setTodayWorkforce] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [staffingAlerts, setStaffingAlerts] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch nurses
      const nursesRes = await fetch("/api/nurses", { headers });
      const nursesData = await nursesRes.json();
      const totalNurses = Array.isArray(nursesData) ? nursesData.length : 0;

      // 2. Fetch today's workforce
      const todayRes = await fetch("/api/shifts/today", { headers });
      const todayData = await todayRes.json();
      const todayShifts = Array.isArray(todayData) ? todayData : [];
      setTodayWorkforce(todayShifts);

      // 3. Fetch all shifts for upcoming
      const shiftsRes = await fetch("/api/shifts/all", { headers });
      const shiftsData = await shiftsRes.json();
      if (Array.isArray(shiftsData)) {
        const future = shiftsData.filter(s => new Date(s.date) >= new Date()).slice(0, 5);
        setUpcomingShifts(future);
      }

      // 4. Fetch pending leaves
      const leaveRes = await fetch("/api/leaves", { headers });
      const leaveData = await leaveRes.json();
      const pendingLeaves = Array.isArray(leaveData) ? leaveData.filter(l => l.status === "Pending") : [];

      // 5. Fetch pending swaps
      const swapRes = await fetch("/api/swaps", { headers });
      const swapData = await swapRes.json();
      const pendingSwaps = Array.isArray(swapData) ? swapData.filter(s => s.status === "Pending") : [];

      // Combine approvals
      const combinedPending = [
        ...pendingLeaves.map(l => ({ ...l, type: "Leave Request", applicant: l.nurse?.username || "Nurse" })),
        ...pendingSwaps.map(s => ({ ...s, type: "Shift Swap", applicant: s.requester?.username || "Nurse" }))
      ];
      setPendingApprovals(combinedPending.slice(0, 6));

      // 6. Fetch AI insights & alerts
      const aiRes = await fetch("/api/ai/insights", { headers });
      const aiData = await aiRes.json();
      if (aiRes.ok) {
        setAiInsights(aiData);
        setStaffingAlerts(aiData.insights?.filter(i => i.type.includes("alert") || i.type === "open_shift") || []);
      }

      // 7. Fetch recent notifications
      const notifRes = await fetch("/api/notifications", { headers });
      const notifData = await notifRes.json();
      if (Array.isArray(notifData)) {
        setRecentNotifications(notifData.slice(0, 5));
      }

      // Update top statistics
      setStats({
        totalNurses,
        nursesOnDuty: todayShifts.length,
        pendingRequests: pendingLeaves.length + pendingSwaps.length,
        openShifts: aiData?.openShiftsCount || 0,
        staffingRisk: aiData?.staffingRisk || "Low"
      });

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case "Critical": return "#dc2626";
      case "High": return "#ea580c";
      case "Medium": return "#ca8a04";
      default: return "#16a34a";
    }
  };

  const renderInsightIcon = (type, iconStr) => {
    if (type?.includes("shortage") || type?.includes("alert") || iconStr === "🚨") {
      return <AlertTriangle size={16} color="#e11d48" />;
    }
    if (type?.includes("leave") || iconStr === "📅") {
      return <Calendar size={16} color="#f59e0b" />;
    }
    if (type?.includes("night") || type?.includes("workload") || iconStr === "🌙") {
      return <Moon size={16} color="#8b5cf6" />;
    }
    return <TrendingUp size={16} color="#0284c7" />;
  };

  return (
    <div className="nurse-layout">
      <AdminSidebar />

      <main className="nurse-main">
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>Hospital Administrator Dashboard</h1>
              <p>Welcome back, {user?.username || "Administrator"} · NurseSync AI Operational Command</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              className="header-notification"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell size={18} /> <span>{unreadCount || 0}</span>
            </button>
          </div>
        </header>

        <div style={{ padding: "24px 32px 32px" }}>

          {/* TOP STATISTICS (5 Metrics from Spec) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "28px" }}>
            {/* Total Nurses */}
            <div className="stat-card" onClick={() => navigate("/nurse-management")} style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Total Nurses</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} color="#2563eb" />
                </div>
              </div>
              <div className="stat-value">{stats.totalNurses}</div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Registered staff</span>
            </div>

            {/* Nurses On Duty */}
            <div className="stat-card" onClick={() => navigate("/schedule-management")} style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Nurses On Duty</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Stethoscope size={18} color="#0ea5e9" />
                </div>
              </div>
              <div className="stat-value" style={{ color: "#0ea5e9" }}>{stats.nursesOnDuty}</div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Scheduled today</span>
            </div>

            {/* Pending Requests */}
            <div className="stat-card" onClick={() => navigate("/leave-management")} style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Pending Requests</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={18} color={stats.pendingRequests > 0 ? "#f59e0b" : "#10b981"} />
                </div>
              </div>
              <div className="stat-value" style={{ color: stats.pendingRequests > 0 ? "#f59e0b" : "#10b981" }}>
                {stats.pendingRequests}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Leaves & swaps</span>
            </div>

            {/* Open Shifts */}
            <div className="stat-card" onClick={() => navigate("/schedule-management")} style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Open Shifts</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ClipboardList size={18} color={stats.openShifts > 0 ? "#ef4444" : "#10b981"} />
                </div>
              </div>
              <div className="stat-value" style={{ color: stats.openShifts > 0 ? "#ef4444" : "#10b981" }}>
                {stats.openShifts}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Needs assignment</span>
            </div>

            {/* Staffing Risk */}
            <div className="stat-card" onClick={() => navigate("/ai-scheduling")} style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="stat-label">Staffing Risk</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldAlert size={18} color={getRiskColor(stats.staffingRisk)} />
                </div>
              </div>
              <div className="stat-value" style={{ color: getRiskColor(stats.staffingRisk), fontSize: "22px" }}>
                {stats.staffingRisk}
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>AI Risk Assessment</span>
            </div>
          </div>

          {/* MAIN SECTION 1: AI WORKFORCE INSIGHTS (Spec 2 & 13) */}
          <div style={{
            background: "linear-gradient(135deg, #f0fdfa, #eff6ff)",
            border: "1px solid #bfdbfe",
            borderLeft: "4px solid #0ea5e9",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "28px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0369a1" }}>
                  AI Workforce Insights & Recommendations
                </h3>
              </div>
              <button
                onClick={() => navigate("/ai-scheduling")}
                style={{
                  background: "white",
                  border: "1px solid #bae6fd",
                  color: "#0284c7",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>Open AI Optimizer</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {aiInsights?.insights && aiInsights.insights.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                {aiInsights.insights.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ background: "white", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      {renderInsightIcon(item.type, item.icon)}
                      <strong style={{ fontSize: "13px", color: "#1e293b" }}>{item.type?.replace(/_/g, " ").toUpperCase()}</strong>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>
                      {item.message}
                    </p>
                    {item.action && (
                      <span style={{ fontSize: "11px", color: "#0ea5e9", fontWeight: "600" }}>
                        Action: {item.action}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                Workforce is currently balanced. All departments have adequate coverage today.
              </p>
            )}
          </div>

          {/* TWO-COLUMN GRID: Today's Workforce & Pending Approvals */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "28px" }}>

            {/* SECTION 2: Today's Workforce */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                  Today's Workforce On Duty ({todayWorkforce.length})
                </h3>
                <button
                  onClick={() => navigate("/schedule-management")}
                  style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Manage Roster →
                </button>
              </div>

              {todayWorkforce.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  No shifts scheduled for today yet. Use AI Scheduler to assign.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="nurse-table">
                    <thead>
                      <tr>
                        <th>Nurse</th>
                        <th>Shift</th>
                        <th>Department</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayWorkforce.slice(0, 5).map((shift) => (
                        <tr key={shift._id}>
                          <td>
                            <strong style={{ color: "#1e293b" }}>{shift.nurse?.username || "Nurse"}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{shift.nurse?.employeeId}</div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: shift.shiftType === "Morning" ? "#eff6ff" : shift.shiftType === "Evening" ? "#fef3c7" : "#f5f3ff",
                              color: shift.shiftType === "Morning" ? "#1d4ed8" : shift.shiftType === "Evening" ? "#b45309" : "#6d28d9"
                            }}>
                              {shift.shiftType}
                            </span>
                          </td>
                          <td style={{ color: "#475569" }}>{shift.department || shift.nurse?.department}</td>
                          <td style={{ fontSize: "12px", color: "#64748b" }}>{shift.startTime} - {shift.endTime}</td>
                          <td>
                            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>Active Duty</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 3: Pending Approvals */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                  Pending Approvals ({pendingApprovals.length})
                </h3>
                <button
                  onClick={() => navigate("/leave-management")}
                  style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Review All →
                </button>
              </div>

              {pendingApprovals.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  All leave & swap requests are reviewed.
                </div>
              ) : (
                <div style={{ padding: "12px 18px" }}>
                  {pendingApprovals.map((req, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: i < pendingApprovals.length - 1 ? "1px solid #f1f5f9" : "none"
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: req.type === "Leave Request" ? "#fef3c7" : "#f3e8ff",
                            color: req.type === "Leave Request" ? "#b45309" : "#7e22ce"
                          }}>
                            {req.type}
                          </span>
                          <strong style={{ fontSize: "13px", color: "#1e293b" }}>{req.applicant}</strong>
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                          {req.reason || "Personal reason"}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(req.type === "Leave Request" ? "/leave-management" : "/shift-swap")}
                        style={{
                          background: "#0ea5e9",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Action
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* UPCOMING SHIFTS (Spec 2) */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "28px" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                Upcoming Shifts Across Hospital ({upcomingShifts.length})
              </h3>
              <button
                onClick={() => navigate("/schedule-management")}
                style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >
                View Full Roster →
              </button>
            </div>

            {upcomingShifts.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                No upcoming shifts scheduled.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nurse-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Nurse</th>
                      <th>Shift Type</th>
                      <th>Department</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingShifts.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <strong>{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>
                          <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px" }}>
                            ({new Date(s.date).toLocaleDateString("en-US", { weekday: "short" })})
                          </span>
                        </td>
                        <td>
                          <strong>{s.nurse?.username || "Nurse"}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{s.nurse?.employeeId}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: s.shiftType === "Morning" ? "#eff6ff" : s.shiftType === "Evening" ? "#fef3c7" : "#f5f3ff",
                            color: s.shiftType === "Morning" ? "#1d4ed8" : s.shiftType === "Evening" ? "#b45309" : "#6d28d9"
                          }}>
                            {s.shiftType}
                          </span>
                        </td>
                        <td style={{ color: "#475569" }}>{s.department || s.nurse?.department}</td>
                        <td style={{ fontSize: "12px", color: "#64748b" }}>{s.startTime} - {s.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TWO-COLUMN GRID: Staffing Alerts & Recent Notifications */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

            {/* SECTION 4: Staffing Alerts */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                  Staffing & Clinical Risk Alerts
                </h3>
                <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>Live Monitors</span>
              </div>

              {staffingAlerts.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <CheckCircle2 size={18} />
                  <span>No critical staffing alerts reported across departments.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {staffingAlerts.map((alert, idx) => (
                    <div key={idx} style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: alert.severity === "High" ? "#fef2f2" : "#fffbeb",
                      border: `1px solid ${alert.severity === "High" ? "#fecaca" : "#fef3c7"}`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px"
                    }}>
                      <AlertTriangle size={18} color={alert.severity === "High" ? "#dc2626" : "#d97706"} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong style={{ fontSize: "13px", color: alert.severity === "High" ? "#991b1b" : "#92400e" }}>
                          {alert.severity} Alert
                        </strong>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569" }}>
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 5: Recent Notifications */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                  Recent System Notifications
                </h3>
                <button
                  onClick={() => navigate("/notifications")}
                  style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  View All →
                </button>
              </div>

              {recentNotifications.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                  No recent notifications.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recentNotifications.map((notif) => (
                    <div key={notif._id} style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: notif.read ? "#f8fafc" : "#eff6ff",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "13px", color: "#1e293b" }}>{notif.title}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#475569" }}>
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
