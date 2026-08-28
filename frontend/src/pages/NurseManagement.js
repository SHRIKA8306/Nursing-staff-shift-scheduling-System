import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function NurseManagement() {
  const { token } = useAuth();

  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    department: "ICU",
    role: "nurse",
    phone: "",
    password: "nursepassword",
    skills: "RN, ACLS, BSN",
    availability: "Full-Time",
    status: "Active"
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const departments = ["All", "ICU", "Emergency", "General Ward", "Pediatrics", "Surgical"];

  const fetchNurses = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/nurses?search=${encodeURIComponent(searchTerm)}`;
      if (selectedDept !== "All") {
        url += `&department=${encodeURIComponent(selectedDept)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNurses(data);
      }
    } catch (err) {
      console.error("Fetch nurses error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm, selectedDept]);

  useEffect(() => {
    fetchNurses();
  }, [fetchNurses]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddNurse = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

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

      setFormSuccess("Nurse registered successfully!");
      setShowAddModal(false);
      setFormData({
        fullName: "",
        email: "",
        employeeId: "",
        department: "ICU",
        role: "nurse",
        phone: "",
        password: "nursepassword",
        skills: "RN, ACLS, BSN",
        availability: "Full-Time",
        status: "Active"
      });
      fetchNurses();
    } catch (err) {
      setFormError(err.message);
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
    <div className="nurse-dashboard-layout">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="nurse-main-content">
        {/* Header */}
        <header className="nurse-header" style={{ justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Nurse Management
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              Register, manage, and assign nursing staff members
            </p>
          </div>

          <LiveClock showDate={true} showTime={true} />
        </header>

        {/* Action Controls & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0' }}>
          
          <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search nurse by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                height: '46px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '14px'
              }}
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                height: '46px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                background: 'white',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155'
              }}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>Dept: {dept}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="sign-in-button"
            style={{ width: 'auto', padding: '0 24px', height: '46px', marginTop: 0 }}
            onClick={() => {
              setShowAddModal(true);
              setFormError("");
              setFormSuccess("");
            }}
          >
            ➕ Add Nurse
          </button>

        </div>

        {formSuccess && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            ✅ {formSuccess}
          </div>
        )}

        {/* Nurses Table */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Loading nurse directory...</p>
          ) : nurses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '40px' }}>👩🏻‍⚕️</span>
              <h4 style={{ margin: '12px 0 4px', color: '#0f172a' }}>No Nurses Found</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>No nurse records matched your search criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Employee ID</th>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th style={{ padding: '12px 16px' }}>Email / Google Account</th>
                    <th style={{ padding: '12px 16px' }}>Department</th>
                    <th style={{ padding: '12px 16px' }}>Phone</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nurses.map((nurse) => (
                    <tr key={nurse.id || nurse._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: '#2563eb' }}>
                        {nurse.employeeId}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {nurse.fullName || nurse.username}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {nurse.email}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                          {nurse.department}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {nurse.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          background: nurse.status === 'Active' ? '#dcfce7' : '#fee2e2', 
                          color: nurse.status === 'Active' ? '#15803d' : '#b91c1c', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: '700' 
                        }}>
                          {nurse.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          style={{
                            background: nurse.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                            color: nurse.status === 'Active' ? '#dc2626' : '#16a34a',
                            border: `1px solid ${nurse.status === 'Active' ? '#fecaca' : '#bbf7d0'}`,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => handleToggleStatus(nurse)}
                        >
                          {nurse.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADD NURSE MODAL */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '580px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Register New Nurse</h3>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>

              {formError && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleAddNurse}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px' }}>Full Name *</label>
                    <input type="text" name="fullName" placeholder="e.g. Sarah Johnson" value={formData.fullName} onChange={handleInputChange} required style={{ height: '44px', padding: '0 12px' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px' }}>Google Account / Email *</label>
                    <input type="email" name="email" placeholder="e.g. sarah@gmail.com" value={formData.email} onChange={handleInputChange} required style={{ height: '44px', padding: '0 12px' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px' }}>Employee ID *</label>
                    <input type="text" name="employeeId" placeholder="e.g. EMP-004" value={formData.employeeId} onChange={handleInputChange} required style={{ height: '44px', padding: '0 12px' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px' }}>Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} style={{ height: '44px', width: '100%', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 12px' }}>
                      <option value="ICU">ICU</option>
                      <option value="Emergency">Emergency</option>
                      <option value="General Ward">General Ward</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Surgical">Surgical</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px' }}>Phone Number</label>
                    <input type="text" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} style={{ height: '44px', padding: '0 12px' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px' }}>Initial Password</label>
                    <input type="text" name="password" value={formData.password} onChange={handleInputChange} style={{ height: '44px', padding: '0 12px' }} />
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, height: '46px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="sign-in-button" style={{ flex: 1, height: '46px', marginTop: 0 }}>Save & Register Nurse</button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default NurseManagement;
