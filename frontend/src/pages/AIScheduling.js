import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const DEPARTMENTS = ["All", "ICU", "Emergency", "General Ward", "Pediatrics", "Cardiology"];

// ── Severity badge colours ────────────────────────────────────────────────────
const severityStyle = {
  Critical: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
  High:     { background: "#fff7ed", color: "#ea580c", border: "1px solid #fdba74" },
  Medium:   { background: "#fefce8", color: "#ca8a04", border: "1px solid #fde047" },
  Low:      { background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" },
  OK:       { background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" },
  Warning:  { background: "#fff7ed", color: "#ea580c", border: "1px solid #fdba74" },
  Conflict: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
};

const Badge = ({ label, type }) => {
  const style = severityStyle[type] || severityStyle.Low;
  return (
    <span style={{
      ...style,
      fontSize: "11px",
      fontWeight: "600",
      padding: "2px 8px",
      borderRadius: "20px",
      display: "inline-block"
    }}>
      {label}
    </span>
  );
};

// ── Simple bar chart using CSS ────────────────────────────────────────────────
const WorkloadBar = ({ value, max, color }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColor = pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color || barColor, borderRadius: "4px", transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: "12px", color: "#64748b", minWidth: "35px" }}>{value}h</span>
    </div>
  );
};

function AIScheduling() {
  const { token } = useAuth();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("schedule");

  // ── Schedule Generator State ──────────────────────────────────────────────
  const [schedForm, setSchedForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
    department: "All",
    requiredPerShift: 1,
  });
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedResult, setSchedResult] = useState(null);
  const [schedError, setSchedError] = useState("");
  const [acceptedRecs, setAcceptedRecs] = useState(new Set());
  const [rejectedRecs, setRejectedRecs] = useState(new Set());

  // ── Conflict Checker State ────────────────────────────────────────────────
  const [conflictForm, setConflictForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
    department: "All",
  });
  const [conflictLoading, setConflictLoading] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);
  const [conflictError, setConflictError] = useState("");

  // ── Workload State ────────────────────────────────────────────────────────
  const [workloadDept, setWorkloadDept] = useState("All");
  const [workloadPeriod, setWorkloadPeriod] = useState("7");
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [workloadData, setWorkloadData] = useState(null);
  const [workloadError, setWorkloadError] = useState("");

  // ── Insights State ────────────────────────────────────────────────────────
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Auto-load insights on mount
  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/ai/insights", { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setInsights(data);
    } catch (e) {
      console.error("Insights error:", e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const generateSchedule = async (e) => {
    e.preventDefault();
    setSchedLoading(true);
    setSchedError("");
    setSchedResult(null);
    setAcceptedRecs(new Set());
    setRejectedRecs(new Set());

    try {
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(schedForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Scheduling failed");
      setSchedResult(data);
    } catch (err) {
      setSchedError(err.message);
    } finally {
      setSchedLoading(false);
    }
  };

  const publishAccepted = async () => {
    if (!schedResult || acceptedRecs.size === 0) return;
    const toPublish = schedResult.recommendations.filter((_, i) => acceptedRecs.has(i));

    let published = 0;
    for (const rec of toPublish) {
      try {
        const res = await fetch("/api/shifts/assign", {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            nurseId: rec.nurseId,
            date: rec.date,
            shiftType: rec.shiftType,
            department: rec.department,
            notes: `AI Recommended — ${rec.reason}`,
          }),
        });
        if (res.ok) published++;
      } catch (e) {
        console.error("Publish error:", e);
      }
    }

    alert(`✅ ${published} shift(s) published to the schedule successfully!`);
    setAcceptedRecs(new Set());
    setSchedResult(null);
  };

  const checkConflicts = async (e) => {
    e.preventDefault();
    setConflictLoading(true);
    setConflictError("");
    setConflictResult(null);

    try {
      const res = await fetch("/api/ai/conflict-check", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(conflictForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Conflict check failed");
      setConflictResult(data);
    } catch (err) {
      setConflictError(err.message);
    } finally {
      setConflictLoading(false);
    }
  };

  const loadWorkload = async () => {
    setWorkloadLoading(true);
    setWorkloadError("");
    setWorkloadData(null);

    try {
      const params = new URLSearchParams({ department: workloadDept, period: workloadPeriod });
      const res = await fetch(`/api/ai/workload?${params}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Workload analysis failed");
      setWorkloadData(data);
    } catch (err) {
      setWorkloadError(err.message);
    } finally {
      setWorkloadLoading(false);
    }
  };

  const toggleAccept = (idx) => {
    setAcceptedRecs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setRejectedRecs(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const toggleReject = (idx) => {
    setRejectedRecs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setAcceptedRecs(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const acceptAll = () => {
    if (!schedResult) return;
    setAcceptedRecs(new Set(schedResult.recommendations.map((_, i) => i)));
    setRejectedRecs(new Set());
  };

  // ── Tab nav ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: "schedule",  label: "Generate Schedule" },
    { id: "conflicts", label: "Conflict Detection" },
    { id: "workload",  label: "Workload Analysis" },
    { id: "insights",  label: "AI Insights" },
  ];

  return (
    <div className="nurse-layout">
      <AdminSidebar />

      <main className="nurse-main">
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <h1>AI Scheduling</h1>
            <p>Intelligent workforce planning powered by Gemini AI</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              ✦ AI Powered
            </span>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>

          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            gap: "4px",
            background: "#f1f5f9",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "28px",
            width: "fit-content"
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  transition: "all 0.2s",
                  background: activeTab === tab.id ? "white" : "transparent",
                  color: activeTab === tab.id ? "#0ea5e9" : "#64748b",
                  boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Generate Schedule ───────────────────────────────────── */}
          {activeTab === "schedule" && (
            <div>
              {/* Config Form */}
              <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}>
                  ✦ Schedule Configuration
                </h3>
                <form onSubmit={generateSchedule}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>
                        START DATE
                      </label>
                      <input
                        type="date"
                        className="nurse-input"
                        value={schedForm.startDate}
                        onChange={e => setSchedForm(p => ({ ...p, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>
                        END DATE
                      </label>
                      <input
                        type="date"
                        className="nurse-input"
                        value={schedForm.endDate}
                        onChange={e => setSchedForm(p => ({ ...p, endDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>
                        DEPARTMENT
                      </label>
                      <select
                        className="nurse-input"
                        value={schedForm.department}
                        onChange={e => setSchedForm(p => ({ ...p, department: e.target.value }))}
                      >
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>
                        NURSES PER SHIFT
                      </label>
                      <select
                        className="nurse-input"
                        value={schedForm.requiredPerShift}
                        onChange={e => setSchedForm(p => ({ ...p, requiredPerShift: Number(e.target.value) }))}
                      >
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={schedLoading}
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      {schedLoading ? (
                        <>
                          <span className="spinner-sm" />
                          Generating with AI...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          Generate AI Schedule
                        </>
                      )}
                    </button>
                    {schedError && (
                      <p style={{ color: "#ef4444", fontSize: "13px" }}>⚠️ {schedError}</p>
                    )}
                  </div>
                </form>
              </div>

              {/* Results */}
              {schedResult && (
                <div>
                  {/* Summary row */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div className="stat-card" style={{ flex: "1", minWidth: "140px" }}>
                      <div className="stat-value">{schedResult.totalRecommendations}</div>
                      <div className="stat-label">Recommendations</div>
                    </div>
                    <div className="stat-card" style={{ flex: "1", minWidth: "140px" }}>
                      <div className="stat-value" style={{ color: "#10b981" }}>{schedResult.onLeave?.length || 0}</div>
                      <div className="stat-label">Nurses on Leave</div>
                    </div>
                    <div className="stat-card" style={{ flex: "1", minWidth: "140px" }}>
                      <div className="stat-value" style={{ color: "#0ea5e9" }}>{acceptedRecs.size}</div>
                      <div className="stat-label">Accepted</div>
                    </div>
                    <div className="stat-card" style={{ flex: "1", minWidth: "140px" }}>
                      <div className="stat-value" style={{ color: "#ef4444" }}>{rejectedRecs.size}</div>
                      <div className="stat-label">Rejected</div>
                    </div>
                    <div className="stat-card" style={{ flex: "1", minWidth: "140px" }}>
                      <div className="stat-value" style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "700" }}>
                        {schedResult.mode === "gemini" ? "Gemini AI" : "Rule Engine"}
                      </div>
                      <div className="stat-label">AI Mode</div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
                    <button onClick={acceptAll} style={{
                      padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
                      background: "#d1fae5", color: "#065f46", fontWeight: "600", fontSize: "13px"
                    }}>
                      ✓ Accept All
                    </button>
                    <button onClick={() => { setRejectedRecs(new Set(schedResult.recommendations.map((_, i) => i))); setAcceptedRecs(new Set()); }}
                      style={{
                        padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
                        background: "#fee2e2", color: "#991b1b", fontWeight: "600", fontSize: "13px"
                      }}>
                      ✗ Reject All
                    </button>
                    {acceptedRecs.size > 0 && (
                      <button onClick={publishAccepted} className="btn-primary" style={{ marginLeft: "auto" }}>
                        ↗ Publish {acceptedRecs.size} Accepted Shift(s)
                      </button>
                    )}
                  </div>

                  {/* Recommendations Table */}
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table className="nurse-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Nurse</th>
                            <th>Department</th>
                            <th>Reason</th>
                            <th>Workload</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedResult.recommendations.map((rec, i) => {
                            const isAccepted = acceptedRecs.has(i);
                            const isRejected = rejectedRecs.has(i);
                            const rowStyle = isAccepted
                              ? { background: "#f0fdf4" }
                              : isRejected
                              ? { background: "#fef2f2", opacity: 0.6 }
                              : {};
                            return (
                              <tr key={i} style={rowStyle}>
                                <td>
                                  <span style={{ fontWeight: "600", color: "#1e293b" }}>
                                    {new Date(rec.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                  </span>
                                  <br />
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                    {new Date(rec.date).toLocaleDateString("en-IN", { weekday: "short" })}
                                  </span>
                                </td>
                                <td>
                                  <Badge
                                    label={rec.shiftType}
                                    type={rec.shiftType === "Night" ? "Medium" : rec.shiftType === "Evening" ? "Low" : "OK"}
                                  />
                                </td>
                                <td style={{ fontWeight: "600", color: "#1e293b" }}>{rec.nurseName}</td>
                                <td style={{ color: "#64748b" }}>{rec.department}</td>
                                <td style={{ fontSize: "12px", color: "#64748b", maxWidth: "200px" }}>{rec.reason}</td>
                                <td style={{ minWidth: "120px" }}>
                                  <WorkloadBar value={Math.round((rec.workloadScore / 100) * 48)} max={48} />
                                </td>
                                <td>
                                  <Badge label={rec.conflictStatus} type={rec.conflictStatus} />
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                      onClick={() => toggleAccept(i)}
                                      style={{
                                        padding: "4px 12px", borderRadius: "6px", border: "none", cursor: "pointer",
                                        fontSize: "12px", fontWeight: "600",
                                        background: isAccepted ? "#10b981" : "#d1fae5",
                                        color: isAccepted ? "white" : "#065f46"
                                      }}
                                    >✓</button>
                                    <button
                                      onClick={() => toggleReject(i)}
                                      style={{
                                        padding: "4px 12px", borderRadius: "6px", border: "none", cursor: "pointer",
                                        fontSize: "12px", fontWeight: "600",
                                        background: isRejected ? "#ef4444" : "#fee2e2",
                                        color: isRejected ? "white" : "#991b1b"
                                      }}
                                    >✗</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Conflict Detection ──────────────────────────────────── */}
          {activeTab === "conflicts" && (
            <div>
              <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}>
                  🔍 Conflict Detection Configuration
                </h3>
                <form onSubmit={checkConflicts}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>START DATE</label>
                      <input type="date" className="nurse-input" value={conflictForm.startDate}
                        onChange={e => setConflictForm(p => ({ ...p, startDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>END DATE</label>
                      <input type="date" className="nurse-input" value={conflictForm.endDate}
                        onChange={e => setConflictForm(p => ({ ...p, endDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>DEPARTMENT</label>
                      <select className="nurse-input" value={conflictForm.department}
                        onChange={e => setConflictForm(p => ({ ...p, department: e.target.value }))}>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={conflictLoading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {conflictLoading ? <><span className="spinner-sm" /> Scanning...</> : <>🔍 Run Conflict Check</>}
                  </button>
                  {conflictError && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>⚠️ {conflictError}</p>}
                </form>
              </div>

              {conflictResult && (
                <div>
                  {/* Summary badges */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    {[
                      { label: "Total Conflicts", value: conflictResult.totalConflicts, color: "#1e293b" },
                      { label: "Critical", value: conflictResult.critical, color: "#dc2626" },
                      { label: "High", value: conflictResult.high, color: "#ea580c" },
                      { label: "Medium", value: conflictResult.medium, color: "#ca8a04" },
                    ].map(s => (
                      <div key={s.label} className="stat-card" style={{ flex: "1", minWidth: "120px" }}>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {conflictResult.conflicts.length === 0 ? (
                    <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                      <h3 style={{ color: "#10b981" }}>No Conflicts Detected</h3>
                      <p style={{ color: "#64748b" }}>The schedule for the selected period is clean with no violations.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {conflictResult.conflicts.map((c, i) => (
                        <div key={i} style={{
                          background: "white",
                          border: `1px solid ${c.severity === "Critical" ? "#fca5a5" : c.severity === "High" ? "#fdba74" : "#fde047"}`,
                          borderLeft: `4px solid ${c.severity === "Critical" ? "#dc2626" : c.severity === "High" ? "#ea580c" : "#ca8a04"}`,
                          borderRadius: "10px",
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px"
                        }}>
                          <span style={{ fontSize: "22px", lineHeight: 1 }}>
                            {c.severity === "Critical" ? "🚨" : c.severity === "High" ? "⚠️" : "💛"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <Badge label={c.severity} type={c.severity} />
                              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>
                                {c.type?.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p style={{ margin: 0, color: "#334155", fontSize: "14px" }}>{c.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Workload Analysis ───────────────────────────────────── */}
          {activeTab === "workload" && (
            <div>
              <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>DEPARTMENT</label>
                    <select className="nurse-input" value={workloadDept} onChange={e => setWorkloadDept(e.target.value)}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "6px" }}>PERIOD</label>
                    <select className="nurse-input" value={workloadPeriod} onChange={e => setWorkloadPeriod(e.target.value)}>
                      <option value="7">Last 7 Days</option>
                      <option value="14">Last 14 Days</option>
                      <option value="30">Last 30 Days</option>
                    </select>
                  </div>
                  <button onClick={loadWorkload} className="btn-primary" disabled={workloadLoading}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {workloadLoading ? <><span className="spinner-sm" /> Analyzing...</> : "📊 Analyze Workload"}
                  </button>
                  {workloadError && <p style={{ color: "#ef4444", fontSize: "13px" }}>⚠️ {workloadError}</p>}
                </div>
              </div>

              {workloadData && (
                <div>
                  {/* AI Recommendation Banner */}
                  <div style={{
                    background: "linear-gradient(135deg, #eff6ff, #ecfdf5)",
                    border: "1px solid #bfdbfe",
                    borderLeft: "4px solid #0ea5e9",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}>
                    <span style={{ fontSize: "20px" }}>🤖</span>
                    <div>
                      <div style={{ fontWeight: "700", color: "#0369a1", marginBottom: "4px", fontSize: "14px" }}>AI Recommendation</div>
                      <p style={{ margin: 0, color: "#334155", fontSize: "14px" }}>{workloadData.aiRecommendation}</p>
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                    <div className="stat-card" style={{ flex: 1 }}>
                      <div className="stat-value">{workloadData.averageHours}h</div>
                      <div className="stat-label">Average Hours</div>
                    </div>
                    <div className="stat-card" style={{ flex: 1 }}>
                      <div className="stat-value" style={{ color: "#ef4444" }}>{workloadData.alerts.overloaded.length}</div>
                      <div className="stat-label">Overloaded Nurses</div>
                    </div>
                    <div className="stat-card" style={{ flex: 1 }}>
                      <div className="stat-value" style={{ color: "#10b981" }}>{workloadData.alerts.underloaded.length}</div>
                      <div className="stat-label">Underloaded Nurses</div>
                    </div>
                    <div className="stat-card" style={{ flex: 1 }}>
                      <div className="stat-value">{workloadData.nurses.length}</div>
                      <div className="stat-label">Total Nurses</div>
                    </div>
                  </div>

                  {/* Workload Table */}
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>
                        Nurse Workload Breakdown
                      </h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="nurse-table">
                        <thead>
                          <tr>
                            <th>Nurse</th>
                            <th>Department</th>
                            <th>Shifts</th>
                            <th>Working Hours</th>
                            <th>Night Shifts</th>
                            <th>Weekend</th>
                            <th>Max Consecutive</th>
                            <th>Load Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workloadData.nurses.map((nurse, i) => (
                            <tr key={i}>
                              <td>
                                <div style={{ fontWeight: "600", color: "#1e293b" }}>{nurse.nurseName}</div>
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{nurse.employeeId}</div>
                              </td>
                              <td style={{ color: "#64748b" }}>{nurse.department}</td>
                              <td style={{ fontWeight: "600" }}>{nurse.totalShifts}</td>
                              <td style={{ minWidth: "160px" }}>
                                <WorkloadBar value={nurse.totalHours} max={workloadData.averageHours * 1.5 || 48} />
                              </td>
                              <td style={{ color: nurse.nightShifts >= 3 ? "#dc2626" : "#1e293b" }}>
                                {nurse.nightShifts}
                                {nurse.nightShifts >= 3 && " ⚠️"}
                              </td>
                              <td>{nurse.weekendShifts}</td>
                              <td style={{ color: nurse.maxConsecutiveShifts >= 5 ? "#dc2626" : "#1e293b" }}>
                                {nurse.maxConsecutiveShifts}
                              </td>
                              <td>
                                <Badge
                                  label={nurse.status}
                                  type={nurse.status === "Overloaded" ? "Critical" : nurse.status === "High" ? "High" : nurse.status === "Moderate" ? "Medium" : "Low"}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: AI Insights ─────────────────────────────────────────── */}
          {activeTab === "insights" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                    AI Workforce Insights
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                    Real-time analysis and recommendations for your nursing workforce
                  </p>
                </div>
                <button onClick={loadInsights} style={{
                  padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0",
                  background: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#0ea5e9"
                }}>
                  ↺ Refresh
                </button>
              </div>

              {insightsLoading ? (
                <div style={{ textAlign: "center", padding: "80px" }}>
                  <div className="spinner-lg" style={{ margin: "0 auto 16px" }} />
                  <p style={{ color: "#94a3b8" }}>Analyzing workforce data…</p>
                </div>
              ) : insights ? (
                <div>
                  {/* Key metrics */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
                    {[
                      { label: "Nurses On Duty Today", value: insights.todayNursesOnDuty, icon: "👩‍⚕️", color: "#0ea5e9" },
                      { label: "Upcoming Leaves", value: insights.upcomingLeavesCount, icon: "📅", color: "#f59e0b" },
                      { label: "Open Shifts", value: insights.openShiftsCount, icon: "📋", color: "#ef4444" },
                      { label: "Staffing Risk", value: insights.staffingRisk, icon: "🎯", color: insights.staffingRisk === "Critical" ? "#dc2626" : insights.staffingRisk === "High" ? "#ea580c" : "#10b981", isText: true },
                    ].map(stat => (
                      <div key={stat.label} className="stat-card" style={{ flex: "1", minWidth: "140px" }}>
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>{stat.icon}</div>
                        <div className="stat-value" style={{ color: stat.color, fontSize: stat.isText ? "16px" : undefined }}>
                          {stat.value}
                        </div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Insights list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {insights.insights.map((insight, i) => (
                      <div key={i} style={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${insight.severity === "High" ? "#ef4444" : insight.severity === "Medium" ? "#f59e0b" : "#10b981"}`,
                        borderRadius: "12px",
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}>
                        <span style={{ fontSize: "28px", lineHeight: 1 }}>{insight.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                            <Badge label={insight.severity} type={insight.severity} />
                            <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>
                              {insight.type?.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 8px", color: "#1e293b", fontSize: "14px", fontWeight: "500" }}>
                            {insight.message}
                          </p>
                          {insight.action && (
                            <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                              💡 <strong>Action:</strong> {insight.action}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upcoming leaves table */}
                  {insights.upcomingLeaves && insights.upcomingLeaves.length > 0 && (
                    <div className="card" style={{ marginTop: "24px", padding: "0", overflow: "hidden" }}>
                      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                          📅 Upcoming Approved Leaves (Next 7 Days)
                        </h4>
                      </div>
                      <table className="nurse-table">
                        <thead>
                          <tr>
                            <th>Nurse</th>
                            <th>Department</th>
                            <th>Leave From</th>
                            <th>Leave To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insights.upcomingLeaves.map((l, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: "600" }}>{l.nurseName}</td>
                              <td>{l.department}</td>
                              <td>{new Date(l.from).toLocaleDateString("en-IN")}</td>
                              <td>{new Date(l.to).toLocaleDateString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "80px" }}>
                  <p style={{ color: "#94a3b8" }}>Click Refresh to load AI insights</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AIScheduling;
