import React, { useEffect, useState, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../App.css";

function AdminReports() {
  const { user, token } = useAuth();

  const [period, setPeriod] = useState("monthly"); // 'weekly', 'monthly', 'custom'
  const [customStart, setCustomStart] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
  );
  const [customEnd, setCustomEnd] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/reports/summary?period=${period}`;
      if (period === "custom") {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, [token, period, customStart, customEnd]);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token, fetchReports]);

  const adminName = user?.username || "Administrator";

  return (
    <div className="nurse-layout">
      <AdminSidebar />

      <main className="nurse-main">
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>Workforce Reports & Analytics</h1>
              <p>Hospital nursing operational metrics, staffing utilization & equity reports</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <div className="header-avatar">{getInitials(adminName)}</div>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>

          {/* Period Filter Bar (Spec 15: Weekly, Monthly, Custom) */}
          <div className="card" style={{ padding: "16px 20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Time Period:</span>
                <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                  {["weekly", "monthly", "custom"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        cursor: "pointer",
                        background: period === p ? "white" : "transparent",
                        color: period === p ? "#0ea5e9" : "#64748b",
                        boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {period === "custom" && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="date"
                    className="nurse-input"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{ height: "36px", padding: "0 8px", fontSize: "12px" }}
                  />
                  <span style={{ color: "#94a3b8" }}>to</span>
                  <input
                    type="date"
                    className="nurse-input"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{ height: "36px", padding: "0 8px", fontSize: "12px" }}
                  />
                  <button
                    onClick={fetchReports}
                    className="btn-primary"
                    style={{ height: "36px", padding: "0 14px", fontSize: "12px" }}
                  >
                    Apply Filter
                  </button>
                </div>
              )}

              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Data updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "80px", textAlign: "center", color: "#94a3b8" }}>
              Generating operational analytics...
            </div>
          ) : !report ? (
            <div style={{ padding: "80px", textAlign: "center", color: "#94a3b8" }}>
              Unable to load report data.
            </div>
          ) : (
            <>
              {/* TOP SUMMARY CARDS (Workforce Utilization, Attendance Rate, Leave Approval Rate, Shift Swaps) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {/* Workforce Utilization */}
                <div className="stat-card">
                  <span className="stat-label">Shift Completion Rate</span>
                  <div className="stat-value" style={{ color: "#0ea5e9" }}>
                    {report.shifts.utilizationRate}%
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {report.shifts.completed} completed of {report.shifts.total} shifts
                  </span>
                </div>

                {/* Attendance Rate */}
                <div className="stat-card">
                  <span className="stat-label">Staff Attendance Rate</span>
                  <div className="stat-value" style={{ color: "#10b981" }}>
                    {report.attendance.attendanceRate}%
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {report.attendance.present} present · {report.attendance.late} late check-ins
                  </span>
                </div>

                {/* Leave Approval Rate */}
                <div className="stat-card">
                  <span className="stat-label">Leave Approval Rate</span>
                  <div className="stat-value" style={{ color: "#f59e0b" }}>
                    {report.leaves.approvalRate}%
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {report.leaves.approved} approved · {report.leaves.pending} pending
                  </span>
                </div>

                {/* Shift Swap Rate */}
                <div className="stat-card">
                  <span className="stat-label">Shift Swap Success</span>
                  <div className="stat-value" style={{ color: "#8b5cf6" }}>
                    {report.swaps.approvalRate}%
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {report.swaps.approved} approved of {report.swaps.total} requests
                  </span>
                </div>
              </div>

              {/* TWO COLUMN GRID: Shift Distribution & Department Coverage */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                {/* Shift Type Distribution */}
                <div className="card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                    Shift Type Distribution
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                      { type: "Morning (06:00 - 14:00)", count: report.shifts.byType.morning, color: "#0ea5e9" },
                      { type: "Evening (14:00 - 22:00)", count: report.shifts.byType.evening, color: "#f59e0b" },
                      { type: "Night (22:00 - 06:00)", count: report.shifts.byType.night, color: "#8b5cf6" },
                    ].map((item) => {
                      const total = report.shifts.total || 1;
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.type}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <strong style={{ color: "#334155" }}>{item.type}</strong>
                            <span style={{ color: "#64748b" }}>{item.count} shifts ({pct}%)</span>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "4px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Department Staffing Allocation */}
                <div className="card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                    Department Shift Allocation
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {report.shifts.byDepartment.map((dept) => {
                      const total = report.shifts.total || 1;
                      const pct = Math.round((dept.shifts / total) * 100);
                      return (
                        <div key={dept.department}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                            <strong style={{ color: "#334155" }}>{dept.department}</strong>
                            <span style={{ color: "#64748b" }}>{dept.shifts} shifts ({pct}%)</span>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", borderRadius: "4px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* NURSE WORKLOAD FAIRNESS TABLE (Spec 11 & 15) */}
              <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "24px" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                      Workload Distribution & Staffing Equity
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Comparison of assigned working hours per registered nurse
                    </p>
                  </div>
                  <span style={{ fontSize: "12px", background: "#eff6ff", color: "#0284c7", padding: "4px 10px", borderRadius: "10px", fontWeight: "600" }}>
                    Target: ≤ 48 hrs / week
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="nurse-table">
                    <thead>
                      <tr>
                        <th>Nurse Name</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Total Shifts</th>
                        <th>Working Hours</th>
                        <th>Workload Progress</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.nurseWorkload.map((n) => {
                        const pct = Math.min(100, Math.round((n.hours / 48) * 100));
                        const isHigh = n.hours > 40;
                        const isUnder = n.hours < 16;

                        return (
                          <tr key={n.nurseId}>
                            <td>
                              <strong style={{ color: "#1e293b" }}>{n.nurseName}</strong>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "12px" }}>{n.employeeId}</td>
                            <td style={{ color: "#475569" }}>{n.department}</td>
                            <td style={{ fontWeight: "600" }}>{n.shifts}</td>
                            <td style={{ fontWeight: "700", color: isHigh ? "#dc2626" : "#1e293b" }}>
                              {n.hours} hrs
                            </td>
                            <td style={{ minWidth: "160px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: isHigh ? "#ef4444" : isUnder ? "#f59e0b" : "#10b981", borderRadius: "4px" }} />
                                </div>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: isHigh ? "#fee2e2" : isUnder ? "#fef3c7" : "#dcfce7",
                                color: isHigh ? "#b91c1c" : isUnder ? "#b45309" : "#15803d"
                              }}>
                                {isHigh ? "High Load" : isUnder ? "Low Load" : "Balanced"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LEAVE & ABSENTEEISM BREAKDOWN */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Leave Types Breakdown */}
                <div className="card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                    Leave Application Trends by Type
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {report.leaves.byType.map((lt) => (
                      <div key={lt.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                        <span style={{ fontWeight: "600", color: "#334155" }}>{lt.type} Leave</span>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#0ea5e9" }}>{lt.count} requests</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                    Attendance & Clock-in Summary
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px" }}>
                      <span style={{ fontWeight: "600", color: "#166534" }}>Present On Shift</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>{report.attendance.present} records</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fffbeb", borderRadius: "8px" }}>
                      <span style={{ fontWeight: "600", color: "#92400e" }}>Late Arrivals (&gt;15m)</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#d97706" }}>{report.attendance.late} records</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px" }}>
                      <span style={{ fontWeight: "600", color: "#991b1b" }}>Unexcused Absences</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#dc2626" }}>{report.attendance.absent} records</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default AdminReports;
