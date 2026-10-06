import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const DEPARTMENTS = ["All", "ICU", "Emergency", "General Ward", "Pediatrics", "Cardiology"];
const SHIFT_TYPES = ["Morning", "Evening", "Night"];

function ScheduleManagement() {
  const { token } = useAuth();

  const [shifts, setShifts] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchNurse, setSearchNurse] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Assign Shift Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [activeShiftId, setActiveShiftId] = useState(null);

  const [formData, setFormData] = useState({
    nurseId: "",
    date: new Date().toISOString().split("T")[0],
    shiftType: "Morning",
    startTime: "06:00",
    endTime: "14:00",
    department: "General Ward",
    notes: ""
  });

  const [formError, setFormError] = useState("");
  const [violations, setViolations] = useState([]);
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNurses = useCallback(async () => {
    try {
      const res = await fetch("/api/nurses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setNurses(data);
    } catch (err) {
      console.error("Error fetching nurses:", err);
    }
  }, [token]);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shifts/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setShifts(data);
    } catch (err) {
      console.error("Error fetching shifts:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNurses();
      fetchShifts();
    }
  }, [token, fetchNurses, fetchShifts]);

  // Adjust default times when shift type changes
  const handleShiftTypeChange = (type) => {
    let start = "06:00";
    let end = "14:00";
    if (type === "Evening") {
      start = "14:00";
      end = "22:00";
    } else if (type === "Night") {
      start = "22:00";
      end = "06:00";
    }
    setFormData(prev => ({
      ...prev,
      shiftType: type,
      startTime: start,
      endTime: end
    }));
  };

  const handleNurseSelect = (nurseId) => {
    const selected = nurses.find(n => n.id === nurseId || n._id === nurseId);
    setFormData(prev => ({
      ...prev,
      nurseId,
      department: selected?.department || prev.department
    }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setActiveShiftId(null);
    setFormError("");
    setViolations([]);
    setOverride(false);
    setOverrideReason("");
    setFormData({
      nurseId: nurses.length > 0 ? (nurses[0].id || nurses[0]._id) : "",
      date: new Date().toISOString().split("T")[0],
      shiftType: "Morning",
      startTime: "06:00",
      endTime: "14:00",
      department: nurses.length > 0 ? nurses[0].department || "General Ward" : "General Ward",
      notes: ""
    });
    setShowModal(true);
  };

  const openEditModal = (shift) => {
    setModalMode("edit");
    setActiveShiftId(shift._id);
    setFormError("");
    setViolations([]);
    setOverride(false);
    setOverrideReason("");
    setFormData({
      nurseId: shift.nurse?._id || shift.nurse?.id || "",
      date: new Date(shift.date).toISOString().split("T")[0],
      shiftType: shift.shiftType || "Morning",
      startTime: shift.startTime || "06:00",
      endTime: shift.endTime || "14:00",
      department: shift.department || "General Ward",
      notes: shift.notes || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (modalMode === "create") {
        const payload = {
          ...formData,
          override,
          overrideReason: override ? overrideReason : undefined
        };

        const res = await fetch("/api/shifts/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.violations && data.violations.length > 0) {
            setViolations(data.violations);
            setFormError("Rule violations detected. You may review and override with a valid medical justification.");
          } else {
            setFormError(data.message || "Failed to assign shift");
          }
          setSubmitting(false);
          return;
        }

        setShowModal(false);
        fetchShifts();
      } else {
        // Edit mode
        const res = await fetch(`/api/shifts/${activeShiftId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message || "Failed to update shift");
          setSubmitting(false);
          return;
        }

        setShowModal(false);
        fetchShifts();
      }
    } catch (err) {
      setFormError("Server error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (shiftId) => {
    if (!window.confirm("Are you sure you want to cancel and delete this shift?")) return;
    try {
      const res = await fetch(`/api/shifts/${shiftId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchShifts();
      } else {
        alert("Failed to delete shift");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter shifts
  const filteredShifts = shifts.filter(s => {
    const nurseObj = s.nurse || {};
    const nName = (nurseObj.username || nurseObj.name || "").toLowerCase();
    const empId = (nurseObj.employeeId || "").toLowerCase();
    const q = searchNurse.toLowerCase().trim();

    if (q && !nName.includes(q) && !empId.includes(q)) return false;
    if (deptFilter !== "All" && s.department !== deptFilter && nurseObj.department !== deptFilter) return false;
    if (typeFilter !== "All" && s.shiftType !== typeFilter) return false;
    if (dateFilter) {
      const sDate = new Date(s.date).toISOString().split("T")[0];
      if (sDate !== dateFilter) return false;
    }
    return true;
  });

  return (
    <div className="nurse-layout">
      <AdminSidebar />

      <main className="nurse-main">
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <h1>Schedule Management</h1>
            <p>Hospital-wide nursing shifts, assignments & coverage controls</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <LiveClock />
            <button
              onClick={openCreateModal}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>+</span> Assign Shift
            </button>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>
          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-value">{shifts.length}</div>
              <div className="stat-label">Total Shifts Scheduled</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "#0ea5e9" }}>
                {shifts.filter(s => s.shiftType === "Morning").length}
              </div>
              <div className="stat-label">Morning Shifts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "#f59e0b" }}>
                {shifts.filter(s => s.shiftType === "Evening").length}
              </div>
              <div className="stat-label">Evening Shifts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "#8b5cf6" }}>
                {shifts.filter(s => s.shiftType === "Night").length}
              </div>
              <div className="stat-label">Night Shifts</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr auto", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search nurse by name or ID..."
                className="nurse-input"
                value={searchNurse}
                onChange={e => setSearchNurse(e.target.value)}
              />
              <select
                className="nurse-input"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
                ))}
              </select>
              <select
                className="nurse-input"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="All">All Shift Types</option>
                {SHIFT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="date"
                className="nurse-input"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
              {(searchNurse || deptFilter !== "All" || typeFilter !== "All" || dateFilter) && (
                <button
                  onClick={() => {
                    setSearchNurse("");
                    setDeptFilter("All");
                    setTypeFilter("All");
                    setDateFilter("");
                  }}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Shifts Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                Active Hospital Shifts ({filteredShifts.length})
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Showing scheduled shifts chronologically
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                Loading shift schedule...
              </div>
            ) : filteredShifts.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                No shifts match the selected filters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nurse-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Nurse</th>
                      <th>Shift Type</th>
                      <th>Timing</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShifts.map((shift) => {
                      const n = shift.nurse || {};
                      const sDate = new Date(shift.date);
                      const isToday = sDate.toDateString() === new Date().toDateString();

                      return (
                        <tr key={shift._id} style={isToday ? { background: "#f8fafc" } : {}}>
                          <td>
                            <div style={{ fontWeight: "600", color: "#1e293b" }}>
                              {sDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {sDate.toLocaleDateString("en-US", { weekday: "short" })}
                              {isToday && <span style={{ marginLeft: "6px", color: "#0ea5e9", fontWeight: "700" }}>TODAY</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: "600", color: "#1e293b" }}>
                              {n.username || n.name || "Unassigned"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {n.employeeId || "—"}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                display: "inline-block",
                                background:
                                  shift.shiftType === "Morning" ? "#eff6ff" :
                                  shift.shiftType === "Evening" ? "#fef3c7" : "#f5f3ff",
                                color:
                                  shift.shiftType === "Morning" ? "#1d4ed8" :
                                  shift.shiftType === "Evening" ? "#b45309" : "#6d28d9",
                                border:
                                  shift.shiftType === "Morning" ? "1px solid #bfdbfe" :
                                  shift.shiftType === "Evening" ? "1px solid #fde68a" : "1px solid #ddd6fe"
                              }}
                            >
                              {shift.shiftType}
                            </span>
                          </td>
                          <td style={{ color: "#475569", fontSize: "13px", fontWeight: "500" }}>
                            {shift.startTime} – {shift.endTime}
                          </td>
                          <td style={{ color: "#334155" }}>
                            {shift.department || n.department || "General Ward"}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: shift.status === "Completed" ? "#f0fdf4" : shift.status === "Cancelled" ? "#fee2e2" : "#f8fafc",
                                color: shift.status === "Completed" ? "#16a34a" : shift.status === "Cancelled" ? "#dc2626" : "#475569",
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              {shift.status || "Scheduled"}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "#64748b", maxWidth: "160px" }}>
                            {shift.notes || "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => openEditModal(shift)}
                                style={{
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  color: "#334155"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(shift._id)}
                                style={{
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  color: "#dc2626"
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
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

      {/* Modal: Assign / Edit Shift */}
      {showModal && (
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
            maxWidth: "560px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                {modalMode === "create" ? "Assign New Shift" : "Modify Shift"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              {formError && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#991b1b",
                  fontSize: "13px",
                  marginBottom: "16px"
                }}>
                  <p style={{ margin: 0, fontWeight: "600" }}>{formError}</p>
                  {violations.length > 0 && (
                    <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
                      {violations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    SELECT NURSE *
                  </label>
                  <select
                    className="nurse-input"
                    value={formData.nurseId}
                    onChange={e => handleNurseSelect(e.target.value)}
                    required
                  >
                    <option value="">Select a Nurse...</option>
                    {nurses.map(n => (
                      <option key={n.id || n._id} value={n.id || n._id}>
                        {n.fullName || n.username} ({n.employeeId || n.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    DATE *
                  </label>
                  <input
                    type="date"
                    className="nurse-input"
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    SHIFT TYPE *
                  </label>
                  <select
                    className="nurse-input"
                    value={formData.shiftType}
                    onChange={e => handleShiftTypeChange(e.target.value)}
                    required
                  >
                    {SHIFT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    DEPARTMENT *
                  </label>
                  <select
                    className="nurse-input"
                    value={formData.department}
                    onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                    required
                  >
                    {DEPARTMENTS.filter(d => d !== "All").map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    START TIME
                  </label>
                  <input
                    type="time"
                    className="nurse-input"
                    value={formData.startTime}
                    onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    END TIME
                  </label>
                  <input
                    type="time"
                    className="nurse-input"
                    value={formData.endTime}
                    onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                  NOTES / ASSIGNMENT REASON
                </label>
                <input
                  type="text"
                  className="nurse-input"
                  placeholder="e.g. Regular coverage, Emergency duty"
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Override Rule Engine Checkbox */}
              {violations.length > 0 && (
                <div style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  padding: "14px",
                  marginBottom: "16px"
                }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", color: "#92400e", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={override}
                      onChange={e => setOverride(e.target.checked)}
                    />
                    Override Clinical Fatigue & Workload Rules
                  </label>
                  {override && (
                    <div style={{ marginTop: "10px" }}>
                      <input
                        type="text"
                        className="nurse-input"
                        placeholder="Provide medical emergency justification for override..."
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        required={override}
                      />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : modalMode === "create" ? "Assign Shift" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleManagement;
