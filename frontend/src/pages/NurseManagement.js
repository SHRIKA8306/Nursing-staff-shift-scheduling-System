import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../App.css";

const DEPARTMENTS = ["All", "ICU", "Emergency", "General Ward", "Pediatrics", "Cardiology"];
const DESIGNATIONS = ["Staff Nurse", "Senior Nurse", "Head Nurse", "Critical Care Specialist", "Pediatric Nurse", "Cardiac Nurse"];
const AVAILABILITIES = ["Full-Time", "Part-Time", "Per Diem", "Flexible"];

function NurseManagement() {
  const { token } = useAuth();

  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState(null);

  // Profile modal data
  const [nurseShifts, setNurseShifts] = useState([]);
  const [nurseAttendance, setNurseAttendance] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState("info"); // 'info', 'shifts', 'attendance'

  // Form states
  const initialForm = {
    fullName: "",
    email: "",
    employeeId: "",
    department: "ICU",
    designation: "Staff Nurse",
    role: "nurse",
    phone: "",
    password: "nursepassword",
    skills: "BLS, ACLS, Patient Assessment",
    availability: "Full-Time",
    status: "Active"
  };

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNurses = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/nurses?search=${encodeURIComponent(searchTerm)}`;
      if (selectedDept !== "All") url += `&department=${encodeURIComponent(selectedDept)}`;
      if (statusFilter !== "All") url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setNurses(data);
    } catch (err) {
      console.error("Fetch nurses error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm, selectedDept, statusFilter]);

  useEffect(() => {
    fetchNurses();
  }, [fetchNurses]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openAddModal = () => {
    setFormError("");
    setFormSuccess("");
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const openEditModal = (nurse) => {
    setSelectedNurse(nurse);
    setFormError("");
    setFormSuccess("");
    setFormData({
      fullName: nurse.fullName || nurse.username || "",
      email: nurse.email || "",
      employeeId: nurse.employeeId || "",
      department: nurse.department || "General Ward",
      designation: nurse.designation || nurse.role || "Staff Nurse",
      role: nurse.role || "nurse",
      phone: nurse.phone || "",
      password: "",
      skills: Array.isArray(nurse.qualifications) ? nurse.qualifications.join(", ") : (nurse.skills || "RN"),
      availability: nurse.availability || nurse.shiftPreference || "Full-Time",
      status: nurse.status || "Active"
    });
    setShowEditModal(true);
  };

  const openProfileModal = async (nurse) => {
    setSelectedNurse(nurse);
    setProfileTab("info");
    setShowProfileModal(true);
    setProfileLoading(true);

    try {
      const nurseId = nurse.id || nurse._id;
      // Fetch nurse shifts
      const sRes = await fetch(`/api/shifts/nurse/${nurseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sData = await sRes.json();
      if (Array.isArray(sData)) setNurseShifts(sData);

      // Fetch nurse attendance
      const aRes = await fetch(`/api/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const aData = await aRes.json();
      if (Array.isArray(aData)) {
        setNurseAttendance(aData.filter(a => a.nurse?._id === nurseId || a.nurse?.id === nurseId));
      }
    } catch (err) {
      console.error("Error loading nurse profile details:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddNurse = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/nurses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add nurse");

      setFormSuccess(`Nurse ${formData.fullName} registered successfully!`);
      setShowAddModal(false);
      fetchNurses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNurse = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const nurseId = selectedNurse.id || selectedNurse._id;
      const res = await fetch(`/api/nurses/${nurseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update nurse");

      setFormSuccess(`Nurse details updated successfully!`);
      setShowEditModal(false);
      fetchNurses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (nurse) => {
    const newStatus = nurse.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/nurses/${nurse.id || nurse._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchNurses();
      }
    } catch (err) {
      console.error("Status toggle error:", err);
    }
  };

  return (
    <div className="nurse-layout">
      <AdminSidebar />

      <main className="nurse-main">
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1>Nurse Workforce Management</h1>
              <p>Register, edit, view profiles, assign departments, and track availability</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <LiveClock showDate={true} showTime={true} />
            <button
              onClick={openAddModal}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>+</span> Add Nurse
            </button>
          </div>
        </header>

        <div style={{ padding: "0 32px 32px" }}>
          {formSuccess && (
            <div style={{ padding: "12px 18px", background: "#dcfce7", color: "#15803d", borderRadius: "10px", marginBottom: "20px", border: "1px solid #bbf7d0" }}>
              ✅ {formSuccess}
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-value">{nurses.length}</div>
              <div className="stat-label">Total Registered Nurses</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "#10b981" }}>
                {nurses.filter(n => n.status === "Active").length}
              </div>
              <div className="stat-label">Active & Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "#ea580c" }}>
                {nurses.filter(n => n.status === "On Leave").length}
              </div>
              <div className="stat-label">On Approved Leave</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "#dc2626" }}>
                {nurses.filter(n => n.status === "Inactive").length}
              </div>
              <div className="stat-label">Inactive / Deactivated</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1.5fr auto", gap: "14px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search nurse by name, email, or employee ID..."
                className="nurse-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select
                className="nurse-input"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
                ))}
              </select>
              <select
                className="nurse-input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
              {(searchTerm || selectedDept !== "All" || statusFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDept("All");
                    setStatusFilter("All");
                  }}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                    cursor: "pointer"
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Nurses Directory Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                Nursing Staff Roster ({nurses.length})
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Click 'Profile' to view shifts & attendance
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                Loading nurse records...
              </div>
            ) : nurses.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                No nurses found matching the current filters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nurse-table">
                  <thead>
                    <tr>
                      <th>Nurse Info</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Contact</th>
                      <th>Availability</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nurses.map((nurse) => (
                      <tr key={nurse.id || nurse._id}>
                        {/* Nurse Info */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="header-avatar" style={{ width: "36px", height: "36px", fontSize: "13px" }}>
                              {getInitials(nurse.fullName || nurse.username)}
                            </div>
                            <div>
                              <strong style={{ color: "#1e293b", fontSize: "14px" }}>
                                {nurse.fullName || nurse.username}
                              </strong>
                              <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600" }}>
                                {nurse.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            background: "#f1f5f9",
                            color: "#334155",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}>
                            {nurse.department || "General Ward"}
                          </span>
                        </td>

                        {/* Designation */}
                        <td style={{ color: "#475569", fontSize: "13px", fontWeight: "500" }}>
                          {nurse.designation || nurse.role || "Staff Nurse"}
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ fontSize: "13px", color: "#1e293b" }}>{nurse.email}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{nurse.phone || "No phone"}</div>
                        </td>

                        {/* Availability */}
                        <td style={{ color: "#475569", fontSize: "13px" }}>
                          {nurse.availability || nurse.shiftPreference || "Full-Time"}
                        </td>

                        {/* Status */}
                        <td>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            background:
                              nurse.status === "Active" ? "#dcfce7" :
                              nurse.status === "On Leave" ? "#fef3c7" : "#fee2e2",
                            color:
                              nurse.status === "Active" ? "#15803d" :
                              nurse.status === "On Leave" ? "#b45309" : "#dc2626",
                            border:
                              nurse.status === "Active" ? "1px solid #bbf7d0" :
                              nurse.status === "On Leave" ? "1px solid #fde68a" : "1px solid #fecaca"
                          }}>
                            {nurse.status || "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => openProfileModal(nurse)}
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#1d4ed8",
                                cursor: "pointer"
                              }}
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => openEditModal(nurse)}
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#334155",
                                cursor: "pointer"
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(nurse)}
                              style={{
                                background: nurse.status === "Active" ? "#fef2f2" : "#f0fdf4",
                                border: `1px solid ${nurse.status === "Active" ? "#fecaca" : "#bbf7d0"}`,
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: nurse.status === "Active" ? "#dc2626" : "#16a34a",
                                cursor: "pointer"
                              }}
                            >
                              {nurse.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL: ADD NURSE */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "620px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Register New Nurse</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleAddNurse} style={{ padding: "24px" }}>
              {formError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>FULL NAME *</label>
                  <input type="text" name="fullName" className="nurse-input" placeholder="e.g. Sarah Johnson" value={formData.fullName} onChange={handleInputChange} required />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>EMAIL / GOOGLE ACCOUNT *</label>
                  <input type="email" name="email" className="nurse-input" placeholder="e.g. sarah@hospital.com" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>EMPLOYEE ID *</label>
                  <input type="text" name="employeeId" className="nurse-input" placeholder="e.g. EMP-009" value={formData.employeeId} onChange={handleInputChange} required />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>PHONE NUMBER</label>
                  <input type="text" name="phone" className="nurse-input" placeholder="+91-9876543210" value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>ASSIGN DEPARTMENT *</label>
                  <select name="department" className="nurse-input" value={formData.department} onChange={handleInputChange}>
                    {DEPARTMENTS.filter(d => d !== "All").map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>DESIGNATION / ROLE</label>
                  <select name="designation" className="nurse-input" value={formData.designation} onChange={handleInputChange}>
                    {DESIGNATIONS.map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>AVAILABILITY</label>
                  <select name="availability" className="nurse-input" value={formData.availability} onChange={handleInputChange}>
                    {AVAILABILITIES.map(av => (
                      <option key={av} value={av}>{av}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>INITIAL PASSWORD</label>
                  <input type="text" name="password" className="nurse-input" value={formData.password} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>CLINICAL SKILLS & CERTIFICATIONS</label>
                <input type="text" name="skills" className="nurse-input" placeholder="e.g. ACLS, BLS, Critical Care, Ventilator Management" value={formData.skills} onChange={handleInputChange} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Registering..." : "Save & Register Nurse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT NURSE */}
      {showEditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "620px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                Edit Nurse: {selectedNurse?.fullName || selectedNurse?.username}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleUpdateNurse} style={{ padding: "24px" }}>
              {formError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>FULL NAME *</label>
                  <input type="text" name="fullName" className="nurse-input" value={formData.fullName} onChange={handleInputChange} required />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>PHONE NUMBER</label>
                  <input type="text" name="phone" className="nurse-input" value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>ASSIGN DEPARTMENT</label>
                  <select name="department" className="nurse-input" value={formData.department} onChange={handleInputChange}>
                    {DEPARTMENTS.filter(d => d !== "All").map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>DESIGNATION</label>
                  <select name="designation" className="nurse-input" value={formData.designation} onChange={handleInputChange}>
                    {DESIGNATIONS.map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>AVAILABILITY</label>
                  <select name="availability" className="nurse-input" value={formData.availability} onChange={handleInputChange}>
                    {AVAILABILITIES.map(av => (
                      <option key={av} value={av}>{av}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>STATUS</label>
                  <select name="status" className="nurse-input" value={formData.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>CLINICAL SKILLS</label>
                <input type="text" name="skills" className="nurse-input" value={formData.skills} onChange={handleInputChange} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW NURSE PROFILE, SHIFTS & ATTENDANCE */}
      {showProfileModal && selectedNurse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="header-avatar" style={{ width: "42px", height: "42px", fontSize: "16px" }}>
                  {getInitials(selectedNurse.fullName || selectedNurse.username)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                    {selectedNurse.fullName || selectedNurse.username}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {selectedNurse.employeeId} · {selectedNurse.department} · {selectedNurse.role}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: "flex", gap: "4px", padding: "10px 24px 0", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {[
                { id: "info", label: "Profile Details" },
                { id: "shifts", label: `Assigned Shifts (${nurseShifts.length})` },
                { id: "attendance", label: `Attendance Log (${nurseAttendance.length})` }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setProfileTab(t.id)}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    background: profileTab === t.id ? "white" : "transparent",
                    color: profileTab === t.id ? "#0ea5e9" : "#64748b",
                    fontWeight: "600",
                    fontSize: "13px",
                    borderRadius: "8px 8px 0 0",
                    borderBottom: profileTab === t.id ? "2px solid #0ea5e9" : "none",
                    cursor: "pointer"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {profileLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading records...</div>
              ) : profileTab === "info" ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>EMAIL</span>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginTop: "2px" }}>{selectedNurse.email}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>PHONE NUMBER</span>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginTop: "2px" }}>{selectedNurse.phone || "Not configured"}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>AVAILABILITY</span>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginTop: "2px" }}>{selectedNurse.shiftPreference || "Full-Time"}</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>JOINING DATE</span>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginTop: "2px" }}>
                        {selectedNurse.createdAt ? new Date(selectedNurse.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active Member"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>SKILLS & QUALIFICATIONS</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      {Array.isArray(selectedNurse.qualifications) && selectedNurse.qualifications.length > 0 ? (
                        selectedNurse.qualifications.map((q, idx) => (
                          <span key={idx} style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                            {q}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Standard Registered Nurse (RN) qualifications</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : profileTab === "shifts" ? (
                <div>
                  {nurseShifts.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No assigned shifts found for this nurse.</p>
                  ) : (
                    <table className="nurse-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Shift</th>
                          <th>Hours</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nurseShifts.map(s => (
                          <tr key={s._id}>
                            <td style={{ fontWeight: "600" }}>{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                            <td>{s.shiftType}</td>
                            <td>{s.startTime} - {s.endTime}</td>
                            <td>{s.department}</td>
                            <td>{s.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div>
                  {nurseAttendance.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No attendance records recorded for this nurse.</p>
                  ) : (
                    <table className="nurse-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Clock In</th>
                          <th>Clock Out</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nurseAttendance.map(a => (
                          <tr key={a._id}>
                            <td>{new Date(a.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                            <td>{new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                            <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active Shift"}</td>
                            <td>
                              <span style={{ color: a.status === "Present" ? "#16a34a" : "#ca8a04", fontWeight: "600" }}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowProfileModal(false)} className="btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default NurseManagement;
