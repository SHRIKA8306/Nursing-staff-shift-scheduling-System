import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";

function ShiftSwap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, role } = useAuth();

  const selectedShift = location.state?.shift;

  const [nurses, setNurses] = useState([]);
  const [targetNurseId, setTargetNurseId] = useState("");
  const [reason, setReason] = useState("");
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (token) {
      fetchColleagues();
      fetchSwapRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchColleagues = async () => {
    try {
      const res = await fetch("/api/users/nurses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNurses(data);
        if (data.length > 0) setTargetNurseId(data[0]._id);
      }
    } catch (err) {
      console.error("Fetch colleagues error:", err);
    }
  };

  const fetchSwapRequests = async () => {
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
  };

  const handleSubmitSwap = async (e) => {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");

    if (!selectedShift || !selectedShift.id) {
      setErrorMsg("Please select a shift from 'My Schedule' first before submitting a swap request.");
      return;
    }

    if (!reason) {
      setErrorMsg("Please enter a reason for your shift swap request.");
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
          originalShiftId: selectedShift.id,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Swap request failed");

      setMsg("Shift swap request submitted successfully!");
      setReason("");
      fetchSwapRequests();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (swapId, newStatus) => {
    try {
      const res = await fetch(`/api/swaps/${swapId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSwapRequests();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const getInitials = (name) => {
    if (!name) return "NS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const nurseName = user ? user.username : "Nurse";

  return (
    <div className="nurse-layout">
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

      <div className="nurse-main">
        <header className="nurse-header">
          <div className="header-left">
            <button className="hamburger-button" onClick={() => navigate("/nurse-dashboard")}>☰</button>
            <div className="welcome-text">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="header-right">
            <button className="header-notification">♧ <span>2</span></button>
            <div className="header-avatar">{getInitials(nurseName)}</div>
          </div>
        </header>

        <main className="schedule-content">
          <div className="schedule-heading">
            <h1>Shift Swap Requests</h1>
            <p>Request shift trade with eligible nursing colleagues</p>
          </div>

          {msg && (
            <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', marginBottom: '20px' }}>
              ✅ {msg}
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: '12px', marginBottom: '20px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* SWAP FORM CARD */}
          <section className="schedule-card" style={{ marginBottom: '30px' }}>
            <div className="schedule-card-header">
              <h2>Submit New Shift Swap Request</h2>
            </div>

            <div style={{ padding: "28px" }}>
              {selectedShift ? (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '14px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>Selected Shift to Trade</span>
                  <h3 style={{ margin: '6px 0 2px', fontSize: '18px', color: '#0f172a' }}>{selectedShift.shift} Shift — {selectedShift.date} ({selectedShift.day})</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{selectedShift.time} · {selectedShift.department}</p>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '14px', marginBottom: '20px', border: '1px solid #fef3c7', color: '#b45309' }}>
                  💡 <strong>No shift selected yet.</strong> Go to <button type="button" onClick={() => navigate('/my-schedule')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>My Schedule</button> and click <strong>"Request Swap"</strong> next to your shift.
                </div>
              )}

              <form onSubmit={handleSubmitSwap}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Select Colleague Nurse</label>
                    <select
                      value={targetNurseId}
                      onChange={(e) => setTargetNurseId(e.target.value)}
                      style={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 14px', background: 'white' }}
                      required
                    >
                      {nurses.length === 0 ? (
                        <option value="">No other nurses registered</option>
                      ) : (
                        nurses.map((n) => (
                          <option key={n._id} value={n._id}>
                            {n.username} ({n.department} · {n.employeeId})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Reason for Swap</label>
                    <input
                      type="text"
                      placeholder="e.g. Family emergency, personal conflict..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 14px' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px' }}>
                  <button type="submit" className="sign-in-button" disabled={submitting} style={{ width: 'auto', padding: '0 28px', height: '46px', marginTop: 0 }}>
                    {submitting ? "Submitting..." : "Submit Swap Request"}
                  </button>
                  <button type="button" onClick={() => navigate("/my-schedule")} style={{ padding: '0 20px', height: '46px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Back to Schedule
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* RECENT SWAP REQUESTS TABLE */}
          <section className="schedule-card">
            <div className="schedule-card-header">
              <h2>My Swap Request History</h2>
            </div>

            <div style={{ padding: "20px" }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Loading swap requests...</p>
              ) : swaps.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No shift swap requests found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569' }}>
                      <th style={{ padding: '12px 14px' }}>Requester</th>
                      <th style={{ padding: '12px 14px' }}>Target Nurse</th>
                      <th style={{ padding: '12px 14px' }}>Reason</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swaps.map((s) => {
                      const isMeTarget = s.targetNurse && (s.targetNurse._id === user?.id || s.targetNurse._id === user?._id);
                      return (
                        <tr key={s._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '14px', fontWeight: '600' }}>{s.requester ? s.requester.username : "Nurse"}</td>
                          <td style={{ padding: '14px', color: '#64748b' }}>{s.targetNurse ? s.targetNurse.username : "Colleague"}</td>
                          <td style={{ padding: '14px', color: '#334155' }}>{s.reason}</td>
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              background: s.status === 'Approved' ? '#dcfce7' : s.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                              color: s.status === 'Approved' ? '#15803d' : s.status === 'Rejected' ? '#b91c1c' : '#b45309'
                            }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            {isMeTarget && s.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => handleStatusUpdate(s._id, 'Approved')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Approve</button>
                                <button type="button" onClick={() => handleStatusUpdate(s._id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ShiftSwap;