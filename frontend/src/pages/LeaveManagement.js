import { useState, useEffect, useCallback } from "react";
import { Bell, Menu, CalendarDays } from "lucide-react";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../styles/LeaveManagement.css";

function LeaveManagement() {
  const { user, token, role } = useAuth();

  const [activeTab, setActiveTab] = useState(role === 'admin' ? "history" : "apply");
  const [leaveType, setLeaveType] = useState("Casual");
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: ""
  });

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (err) {
      console.error("Fetch leaves error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchLeaves();
    }
  }, [token, fetchLeaves]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          leaveType,
          reason: formData.reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit leave");

      setMessage("Leave application submitted successfully!");
      setFormData({ startDate: "", endDate: "", reason: "" });
      fetchLeaves();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (leaveId, status) => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const nurseName = user ? user.username : "Nurse";
  const nurseEmpId = user ? user.employeeId || "EMP-001" : "EMP-001";

  return (
    <div className="leave-page">
      {/* SIDEBAR */}
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

      {/* MAIN AREA */}
      <main className="leave-main">
        {/* TOP HEADER */}
        <header className="nurse-header">
          <div className="header-left">
            <button className="menu-toggle" type="button"><Menu size={25} /></button>
            <div className="header-welcome">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="header-right">
            <button className="header-notification" type="button"><Bell size={21} /><span>2</span></button>
            <div className="header-avatar">{nurseName.substring(0, 2).toUpperCase()}</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="leave-content">
          <div className="leave-heading">
            <h1>Leave Management</h1>
            <p>{role === 'admin' ? "Review and manage nurse leave requests" : "Apply for leave and track your application status"}</p>
          </div>

          {/* LEAVE BALANCE CARDS */}
          <div className="leave-balance-grid">
            <div className="leave-balance-card">
              <p className="leave-card-title">Annual Leave</p>
              <h2 className="annual-number">12</h2>
              <p className="leave-used">8 used of 20</p>
              <div className="progress-background"><div className="progress-bar annual-progress" style={{ width: "65%" }} /></div>
            </div>

            <div className="leave-balance-card">
              <p className="leave-card-title">Sick Leave</p>
              <h2 className="sick-number">10</h2>
              <p className="leave-used">2 used of 12</p>
              <div className="progress-background"><div className="progress-bar sick-progress" style={{ width: "83%" }} /></div>
            </div>

            <div className="leave-balance-card">
              <p className="leave-card-title">Casual Leave</p>
              <h2 className="casual-number">5</h2>
              <p className="leave-used">3 used of 8</p>
              <div className="progress-background"><div className="progress-bar casual-progress" style={{ width: "63%" }} /></div>
            </div>

            <div className="leave-balance-card">
              <p className="leave-card-title">Emergency Leave</p>
              <h2 className="emergency-number">5</h2>
              <p className="leave-used">0 used of 5</p>
              <div className="progress-background"><div className="progress-bar emergency-progress" style={{ width: "100%" }} /></div>
            </div>
          </div>

          {/* TABS */}
          <div className="leave-tabs">
            {role !== 'admin' && (
              <button
                type="button"
                className={activeTab === "apply" ? "leave-tab active" : "leave-tab"}
                onClick={() => setActiveTab("apply")}
              >
                Apply for Leave
              </button>
            )}

            <button
              type="button"
              className={activeTab === "history" ? "leave-tab active" : "leave-tab"}
              onClick={() => setActiveTab("history")}
            >
              {role === 'admin' ? "All Leave Requests" : "Leave History"}
            </button>
          </div>

          {/* APPLY FOR LEAVE */}
          {activeTab === "apply" && role !== 'admin' && (
            <section className="leave-form-card">
              <h2>Leave Application Form</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-two-column">
                  <div className="leave-form-group">
                    <label>Employee ID</label>
                    <input type="text" value={nurseEmpId} readOnly />
                  </div>

                  <div className="leave-form-group">
                    <label>Full Name</label>
                    <input type="text" value={nurseName} readOnly />
                  </div>
                </div>

                <div className="leave-form-group leave-type-group">
                  <label>Leave Type</label>
                  <div className="leave-type-buttons">
                    {["Annual", "Sick", "Casual", "Emergency"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={leaveType === type ? "leave-type-button selected" : "leave-type-button"}
                        onClick={() => setLeaveType(type)}
                      >
                        {type} Leave
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-two-column">
                  <div className="leave-form-group">
                    <label>Leave Start Date</label>
                    <div className="date-input-wrapper">
                      <CalendarDays size={19} />
                      <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="leave-form-group">
                    <label>Leave End Date</label>
                    <div className="date-input-wrapper">
                      <CalendarDays size={19} />
                      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                <div className="leave-form-group">
                  <label>Reason</label>
                  <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Enter reason for leave..." rows="4" required />
                </div>

                {message && <div className="leave-success-message">✅ {message}</div>}
                {errorMessage && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: '12px', marginBottom: '16px' }}>⚠️ {errorMessage}</div>}

                <div className="leave-submit-container">
                  <button type="submit" className="submit-leave-button" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Leave Application"}
                  </button>
                  <button type="button" className="cancel-leave-button" onClick={() => { setFormData({ startDate: "", endDate: "", reason: "" }); setMessage(""); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* LEAVE HISTORY / ADMIN REVIEW */}
          {activeTab === "history" && (
            <section className="leave-history-card">
              <h2>{role === 'admin' ? "Nurse Leave Applications" : "Leave History"}</h2>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading records...</p>
              ) : leaves.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No leave applications found.</p>
              ) : (
                <div className="history-table">
                  <div className="history-header">
                    <span>Nurse Name</span>
                    <span>Leave Type</span>
                    <span>Start Date</span>
                    <span>End Date</span>
                    <span>Status</span>
                    {role === 'admin' && <span>Actions</span>}
                  </div>

                  {leaves.map((item) => (
                    <div className="history-row" key={item._id}>
                      <span style={{ fontWeight: '600' }}>{item.nurse ? item.nurse.username : "Nurse"}</span>
                      <span>{item.leaveType}</span>
                      <span>{new Date(item.startDate).toLocaleDateString()}</span>
                      <span>{new Date(item.endDate).toLocaleDateString()}</span>
                      <span>
                        <span className={item.status === 'Approved' ? 'status-approved' : 'status-pending'}>
                          {item.status}
                        </span>
                      </span>
                      {role === 'admin' && (
                        <span>
                          {item.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button type="button" onClick={() => handleStatusChange(item._id, 'Approved')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Approve</button>
                              <button type="button" onClick={() => handleStatusChange(item._id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Processed</span>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* FOOTER */}
        <footer className="nurse-footer">
          <span>© 2026 NurseSync AI · Nurse Portal</span>
          <span className="system-status">
            <span className="status-dot"></span>
            System Online
          </span>
        </footer>
      </main>

      <button className="help-button" type="button">?</button>
    </div>
  );
}

export default LeaveManagement;