import React, { useState, useEffect, useCallback } from "react";
import { getInitials } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function MySchedule() {
  const navigate = useNavigate();
  const { user, token, role, unreadCount } = useAuth();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("upcoming"); // 'current', 'upcoming', 'previous', 'all'

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = role === "admin" ? "/api/shifts/all" : "/api/shifts/my-schedule";
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

  const nurseName = user?.username || "Nurse";
  const nurseDept = user?.department || "General Ward";
  const nurseEmpId = user?.employeeId || "EMP-001";

  // Date classifications
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const filteredShifts = shifts.filter(s => {
    const sDate = new Date(s.date);
    if (filterTab === "current") {
      return sDate >= todayStart && sDate <= todayEnd;
    } else if (filterTab === "upcoming") {
      return sDate > todayEnd;
    } else if (filterTab === "previous") {
      return sDate < todayStart;
    }
    return true; // 'all'
  }).sort((a, b) => {
    if (filterTab === "previous") return new Date(b.date) - new Date(a.date);
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="nurse-layout">
      {role === "admin" ? <AdminSidebar /> : <NurseSidebar />}

      <main className="nurse-main">
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>{role === "admin" ? "Staff Schedule Viewer" : "My Shift Schedule"}</h1>
              <p>{role === "admin" ? "All active hospital shift allocations" : `Shift roster for ${nurseName} (${nurseDept} · ${nurseEmpId})`}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              className="header-notification"
              onClick={() => navigate("/notifications")}
            >
              🔔 <span>{unreadCount || 0}</span>
            </button>
            <div className="header-avatar" onClick={() => navigate("/profile")}>
              {getInitials(nurseName)}
            </div>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>
          
          {/* Shift Schedule Policy Banner (Spec 5 example shifts) */}
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Standard Shift Timings</span>
              <div style={{ display: "flex", gap: "20px", marginTop: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#1e293b" }}>
                  🌅 <strong>Morning:</strong> 06:00 AM – 02:00 PM
                </span>
                <span style={{ fontSize: "13px", color: "#1e293b" }}>
                  ☀️ <strong>Evening:</strong> 02:00 PM – 10:00 PM
                </span>
                <span style={{ fontSize: "13px", color: "#1e293b" }}>
                  🌙 <strong>Night:</strong> 10:00 PM – 06:00 AM
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {role === "admin" ? (
                <button
                  onClick={() => navigate("/schedule-management")}
                  className="btn-primary"
                  style={{ fontSize: "13px", padding: "8px 16px" }}
                >
                  Manage / Assign Shifts →
                </button>
              ) : (
                <button
                  onClick={() => navigate("/shift-swap")}
                  style={{
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer"
                  }}
                >
                  ⇄ Request Shift Swap
                </button>
              )}
            </div>
          </div>

          {/* Navigation Filter Tabs (Spec 5: Current schedule, Upcoming schedule, Previous shifts) */}
          <div style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "10px",
            width: "fit-content"
          }}>
            {[
              { id: "upcoming", label: "Upcoming Schedule" },
              { id: "current", label: "Today's Schedule" },
              { id: "previous", label: "Previous Shifts" },
              { id: "all", label: "All Shifts" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  background: filterTab === tab.id ? "white" : "transparent",
                  color: filterTab === tab.id ? "#0ea5e9" : "#64748b",
                  boxShadow: filterTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Schedule Table (Spec 5: Date, Day, Shift, Start Time, End Time, Department/Ward, Status) */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                {filterTab === "upcoming" ? "Upcoming Assigned Shifts" :
                 filterTab === "current" ? "Today's Hospital Shift" :
                 filterTab === "previous" ? "Completed / Previous Shifts" : "Complete Shift Roster"} ({filteredShifts.length})
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {role === "nurse" ? "Read-only · Contact administrator or request swap to change" : "Hospital Central Roster"}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                Loading schedule records...
              </div>
            ) : filteredShifts.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                No shifts found for this category.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nurse-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Shift</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Department / Ward</th>
                      <th>Status</th>
                      {role === "nurse" && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShifts.map((shift) => {
                      const d = new Date(shift.date);
                      const isToday = d.toDateString() === new Date().toDateString();

                      return (
                        <tr key={shift._id} style={isToday ? { background: "#f0f9ff" } : {}}>
                          {/* Date */}
                          <td>
                            <strong style={{ color: "#1e293b" }}>
                              {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </strong>
                            {isToday && (
                              <span style={{ marginLeft: "8px", fontSize: "10px", background: "#0ea5e9", color: "white", padding: "2px 6px", borderRadius: "10px", fontWeight: "700" }}>
                                TODAY
                              </span>
                            )}
                          </td>

                          {/* Day */}
                          <td style={{ color: "#64748b", fontWeight: "500" }}>
                            {d.toLocaleDateString("en-US", { weekday: "long" })}
                          </td>

                          {/* Shift */}
                          <td>
                            <span style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "3px 10px",
                              borderRadius: "14px",
                              background:
                                shift.shiftType === "Morning" ? "#eff6ff" :
                                shift.shiftType === "Evening" ? "#fef3c7" : "#f5f3ff",
                              color:
                                shift.shiftType === "Morning" ? "#1d4ed8" :
                                shift.shiftType === "Evening" ? "#b45309" : "#6d28d9",
                              border:
                                shift.shiftType === "Morning" ? "1px solid #bfdbfe" :
                                shift.shiftType === "Evening" ? "1px solid #fde68a" : "1px solid #ddd6fe"
                            }}>
                              {shift.shiftType}
                            </span>
                          </td>

                          {/* Start Time */}
                          <td style={{ color: "#334155", fontWeight: "600" }}>
                            {shift.startTime}
                          </td>

                          {/* End Time */}
                          <td style={{ color: "#334155", fontWeight: "600" }}>
                            {shift.endTime}
                          </td>

                          {/* Department / Ward */}
                          <td style={{ color: "#475569" }}>
                            {shift.department || nurseDept}
                          </td>

                          {/* Status */}
                          <td>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: shift.status === "Completed" ? "#f0fdf4" : shift.status === "Cancelled" ? "#fee2e2" : "#f8fafc",
                              color: shift.status === "Completed" ? "#16a34a" : shift.status === "Cancelled" ? "#dc2626" : "#475569",
                              border: "1px solid #e2e8f0"
                            }}>
                              {shift.status || "Scheduled"}
                            </span>
                          </td>

                          {/* Action (Nurses can only request swap, cannot modify directly) */}
                          {role === "nurse" && (
                            <td>
                              {new Date(shift.date) >= todayStart && shift.status !== "Cancelled" ? (
                                <button
                                  onClick={() => handleSwap(shift)}
                                  style={{
                                    background: "#f1f5f9",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    padding: "5px 12px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#2563eb",
                                    cursor: "pointer"
                                  }}
                                >
                                  Request Swap
                                </button>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default MySchedule;