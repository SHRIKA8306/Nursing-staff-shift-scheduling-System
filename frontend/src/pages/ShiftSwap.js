import React, { useState, useEffect, useCallback } from "react";
import { getInitials } from "../utils/helpers";
import { useLocation, useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function ShiftSwap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, role, unreadCount } = useAuth();

  const selectedShiftState = location.state?.shift;

  const [nurses, setNurses] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [targetNurseId, setTargetNurseId] = useState("");
  const [reason, setReason] = useState("");
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // AI Swap Recommendations state
  const [aiRecs, setAiRecs] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Override modal
  const [overrideModal, setOverrideModal] = useState({
    show: false,
    swapId: null,
    violations: [],
    reason: ""
  });

  const fetchColleagues = useCallback(async () => {
    try {
      const res = await fetch("/api/users/nurses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNurses(data);
        if (data.length > 0 && !targetNurseId) setTargetNurseId(data[0]._id);
      }
    } catch (err) {
      console.error("Fetch colleagues error:", err);
    }
  }, [token, targetNurseId]);

  const fetchMyShifts = useCallback(async () => {
    if (role === "admin") return;
    try {
      const res = await fetch("/api/shifts/my-schedule", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const upcoming = data.filter(s => new Date(s.date) >= new Date(new Date().setHours(0,0,0,0)));
        setMyShifts(upcoming);
        if (selectedShiftState) {
          const matched = upcoming.find(s => s._id === selectedShiftState.id || s._id === selectedShiftState._id);
          setActiveShift(matched || selectedShiftState);
        } else if (upcoming.length > 0) {
          setActiveShift(upcoming[0]);
        }
      }
    } catch (err) {
      console.error("Fetch my shifts error:", err);
    }
  }, [token, role, selectedShiftState]);

  const fetchSwapRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/swaps", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSwaps(data);
      }
    } catch (err) {
      console.error("Fetch swaps error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchColleagues();
      fetchMyShifts();
      fetchSwapRequests();
    }
  }, [token, fetchColleagues, fetchMyShifts, fetchSwapRequests]);

  // Fetch AI Recommendations when activeShift changes
  const getAiRecommendations = async (shiftObj) => {
    const sId = shiftObj?._id || shiftObj?.id;
    if (!sId) return;

    setLoadingAi(true);
    setAiRecs([]);
    try {
      const res = await fetch("/api/ai/swap-recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shiftId: sId })
      });
      const data = await res.json();
      if (res.ok && data.recommendations) {
        setAiRecs(data.recommendations);
      }
    } catch (err) {
      console.error("AI recommendation error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSelectAiNurse = (rec) => {
    setTargetNurseId(rec.nurseId);
  };

  const handleSubmitSwap = async (e) => {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");

    const shiftId = activeShift?._id || activeShift?.id;
    if (!shiftId) {
      setErrorMsg("Please select a valid scheduled shift to trade.");
      return;
    }

    if (!targetNurseId) {
      setErrorMsg("Please select a colleague nurse for the swap.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Please enter a valid reason for the shift swap.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/swaps/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetNurseId,
          originalShiftId: shiftId,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Swap request submission failed");

      setMsg("Shift swap request submitted successfully! Administrator and colleague have been notified.");
      setReason("");
      fetchSwapRequests();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (swapId, newStatus, override = false, overrideReason = "") => {
    try {
      const res = await fetch(`/api/swaps/${swapId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, override, overrideReason })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.violations) {
          setOverrideModal({ show: true, swapId, violations: data.violations, reason: "" });
        } else {
          setErrorMsg(data.message);
        }
        return;
      }

      if (override) setOverrideModal({ show: false, swapId: null, violations: [], reason: "" });
      fetchSwapRequests();
    } catch (err) {
      console.error("Status update error:", err);
      setErrorMsg(err.message);
    }
  };

  const nurseName = user ? user.username : "Nurse";

  return (
    <div className="nurse-layout">
      {role === "admin" ? <AdminSidebar /> : <NurseSidebar />}

      <main className="nurse-main">
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h3>{role === "admin" ? "Hospital Shift Swap Requests" : `Welcome back, ${nurseName}!`}</h3>
              <p>{role === "admin" ? "Review, approve or reject nurse shift trade requests" : "Request shift trades with AI recommendations"}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              className="header-notification"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              🔔 <span>{unreadCount || 0}</span>
            </button>
            <div className="header-avatar">{getInitials(nurseName)}</div>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>
          {msg && (
            <div style={{ padding: "14px 18px", background: "#dcfce7", color: "#15803d", borderRadius: "10px", marginBottom: "20px", border: "1px solid #bbf7d0" }}>
              ✅ {msg}
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: "14px 18px", background: "#fef2f2", color: "#991b1b", borderRadius: "10px", marginBottom: "20px", border: "1px solid #fecaca" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* NURSE SWAP REQUEST FORM */}
          {role !== "admin" && (
            <div className="card" style={{ padding: "28px", marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                    Submit New Shift Swap Request
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Choose your shift, get AI recommendations for available colleagues, and submit for admin approval.
                  </p>
                </div>
              </div>

              {/* Active Shift Selector */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px" }}>
                  SELECT YOUR SHIFT TO TRADE *
                </label>
                {myShifts.length === 0 ? (
                  <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "14px" }}>
                    No upcoming shifts available to trade. Visit <button type="button" onClick={() => navigate("/my-schedule")} style={{ color: "#0ea5e9", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>My Schedule</button>.
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {myShifts.map((s) => {
                      const isSel = activeShift && (activeShift._id === s._id || activeShift.id === s._id);
                      const d = new Date(s.date);
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setActiveShift(s);
                            getAiRecommendations(s);
                          }}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "10px",
                            border: isSel ? "2px solid #0ea5e9" : "1px solid #cbd5e1",
                            background: isSel ? "#eff6ff" : "white",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          <div style={{ fontWeight: "700", fontSize: "13px", color: isSel ? "#0284c7" : "#1e293b" }}>
                            {s.shiftType} Shift · {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            {s.startTime} - {s.endTime} ({s.department})
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Recommendation Trigger & Card */}
              {activeShift && (
                <div style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f0fdf4, #eff6ff)", borderRadius: "12px", border: "1px solid #bfdbfe", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>✦</span>
                      <strong style={{ fontSize: "14px", color: "#0369a1" }}>AI Smart Swap Recommendations</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => getAiRecommendations(activeShift)}
                      disabled={loadingAi}
                      style={{
                        background: "#0ea5e9",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      {loadingAi ? "Finding Matches..." : "Get AI Recommendations"}
                    </button>
                  </div>

                  {loadingAi && <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Scanning available nurses, workload distribution and department coverage...</p>}

                  {aiRecs.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginTop: "10px" }}>
                      {aiRecs.map((rec) => {
                        const isChosen = targetNurseId === rec.nurseId;
                        return (
                          <div
                            key={rec.nurseId}
                            onClick={() => handleSelectAiNurse(rec)}
                            style={{
                              background: isChosen ? "#dbeafe" : "white",
                              border: isChosen ? "2px solid #2563eb" : "1px solid #cbd5e1",
                              borderRadius: "10px",
                              padding: "12px",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "14px", color: "#1e293b" }}>{rec.nurseName}</strong>
                              {rec.recommended && (
                                <span style={{ fontSize: "10px", background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "10px", fontWeight: "700" }}>
                                  TOP MATCH
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#475569", marginBottom: "6px" }}>
                              {rec.department} · {rec.weeklyHours}h scheduled this week
                            </div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                              💡 {rec.reason}
                            </p>
                            <button
                              type="button"
                              style={{
                                marginTop: "8px",
                                width: "100%",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: "600",
                                background: isChosen ? "#2563eb" : "#f1f5f9",
                                color: isChosen ? "white" : "#334155",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                              }}
                            >
                              {isChosen ? "✓ Selected as Replacement" : "Select this Nurse"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Form inputs */}
              <form onSubmit={handleSubmitSwap}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                      TARGET NURSE COLLEAGUE *
                    </label>
                    <select
                      className="nurse-input"
                      value={targetNurseId}
                      onChange={e => setTargetNurseId(e.target.value)}
                      required
                    >
                      <option value="">Select a nurse colleague...</option>
                      {nurses.map(n => (
                        <option key={n._id} value={n._id}>
                          {n.username} ({n.department} · {n.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                      REASON FOR SWAP *
                    </label>
                    <input
                      type="text"
                      className="nurse-input"
                      placeholder="e.g. Urgent family commitment, health appointment..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Shift Swap Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/my-schedule")}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "10px 18px",
                      fontWeight: "600",
                      color: "#475569",
                      cursor: "pointer"
                    }}
                  >
                    View My Schedule
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SWAP REQUESTS LIST */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                {role === "admin" ? "All Hospital Shift Swap Requests" : "My Shift Swap History"} ({swaps.length})
              </h3>
            </div>

            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                Loading shift swaps...
              </div>
            ) : swaps.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                No shift swap requests found.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nurse-table">
                  <thead>
                    <tr>
                      <th>Date Requested</th>
                      <th>Requester Nurse</th>
                      <th>Target Nurse</th>
                      <th>Original Shift Details</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {role === "admin" && <th style={{ textAlign: "right" }}>Review & Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {swaps.map((s) => {
                      const orig = s.originalShift || {};
                      const origDate = orig.date ? new Date(orig.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                      const isPending = s.status === "Pending";

                      return (
                        <tr key={s._id}>
                          <td style={{ color: "#64748b", fontSize: "13px" }}>
                            {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td>
                            <strong style={{ color: "#1e293b" }}>{s.requester?.username || "Nurse"}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{s.requester?.department}</div>
                          </td>
                          <td>
                            <strong style={{ color: "#1e293b" }}>{s.targetNurse?.username || "Colleague"}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{s.targetNurse?.department}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: "600", color: "#0ea5e9" }}>{orig.shiftType || "Shift"}</span>
                            <div style={{ fontSize: "12px", color: "#475569" }}>
                              {origDate} ({orig.startTime} - {orig.endTime})
                            </div>
                          </td>
                          <td style={{ fontSize: "13px", color: "#475569", maxWidth: "200px" }}>
                            {s.reason}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                display: "inline-block",
                                background:
                                  s.status === "Approved" ? "#dcfce7" :
                                  s.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                                color:
                                  s.status === "Approved" ? "#15803d" :
                                  s.status === "Rejected" ? "#991b1b" : "#b45309",
                                border:
                                  s.status === "Approved" ? "1px solid #bbf7d0" :
                                  s.status === "Rejected" ? "1px solid #fecaca" : "1px solid #fde68a"
                              }}
                            >
                              {s.status}
                            </span>
                          </td>
                          {role === "admin" && (
                            <td style={{ textAlign: "right" }}>
                              {isPending ? (
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => handleStatusUpdate(s._id, "Approved")}
                                    style={{
                                      background: "#10b981",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "pointer"
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(s._id, "Rejected")}
                                    style={{
                                      background: "#ef4444",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      cursor: "pointer"
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Processed</span>
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

      {/* Override Rule Engine Modal */}
      {overrideModal.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", color: "#b45309" }}>
              ⚠️ Shift Swap Rule Violations Detected
            </h3>
            <p style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
              The scheduler detected the following clinical constraints or fatigue violations:
            </p>
            <ul style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px 28px", borderRadius: "8px", color: "#92400e", fontSize: "13px", marginBottom: "16px" }}>
              {overrideModal.violations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                OVERRIDE JUSTIFICATION REASON *
              </label>
              <input
                type="text"
                className="nurse-input"
                placeholder="e.g. Critical ICU short-staffing override"
                value={overrideModal.reason}
                onChange={e => setOverrideModal(p => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setOverrideModal({ show: false, swapId: null, violations: [], reason: "" })}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (!overrideModal.reason.trim()) {
                    alert("Please provide an override reason.");
                    return;
                  }
                  handleStatusUpdate(overrideModal.swapId, "Approved", true, overrideModal.reason);
                }}
              >
                Confirm Override & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShiftSwap;