import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [nurses, setNurses] = useState([]);
  const [stats, setStats] = useState({
    totalNurses: 0,
    activeNurses: 0,
    pendingLeaves: 0,
    pendingSwaps: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch nurses list
      const res = await fetch("/api/nurses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNurses(data);
        const active = data.filter(n => n.status.toLowerCase() === 'active').length;
        setStats(prev => ({
          ...prev,
          totalNurses: data.length,
          activeNurses: active
        }));
      }

      // Fetch pending leaves count
      const leaveRes = await fetch("/api/leaves", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const leaveData = await leaveRes.json();
      if (Array.isArray(leaveData)) {
        const pending = leaveData.filter(l => l.status === 'Pending').length;
        setStats(prev => ({ ...prev, pendingLeaves: pending }));
      }

      // Fetch pending swaps count
      const swapRes = await fetch("/api/swaps", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const swapData = await swapRes.json();
      if (Array.isArray(swapData)) {
        const pendingSwaps = swapData.filter(s => s.status === 'Pending').length;
        setStats(prev => ({ ...prev, pendingSwaps }));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nurse-layout">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="nurse-main">
        
        {/* Header */}
        <header className="nurse-header">
          <div className="header-left">
            <div className="welcome-text">
              <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Administrator Overview
              </h1>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>
                Healthcare Workforce Platform & Nurse Roster Management
              </p>
            </div>
          </div>

          <div className="header-right">
            {/* Real-time Live Clock with high-contrast font color */}
            <LiveClock showDate={true} showTime={true} className="admin-header-clock" />
          </div>
        </header>

        {/* Dashboard Content Container matching Nurse Dashboard */}
        <div className="dashboard-content">

          {/* Hero Welcome Card matching Nurse Portal sizing */}
          <section 
            className="dashboard-hero"
            style={{
              minHeight: '276px',
              padding: '30px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ 
                background: 'rgba(20, 184, 166, 0.2)', 
                color: '#2dd4bf', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontSize: '13px', 
                fontWeight: '600' 
              }}>
                System Admin Active
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '14px 0 8px', color: 'white' }}>
                Welcome back, {user ? user.username : 'Administrator'} 👋
              </h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px', maxWidth: '600px' }}>
              Manage nursing staff, assign shift schedules, review leave applications, and balance department workforce allocation across the hospital.
            </p>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '22px' }}>
              <button
                type="button"
                className="sign-in-button"
                style={{ 
                  width: 'auto', 
                  padding: '0 24px', 
                  height: '44px', 
                  marginTop: 0,
                  background: 'linear-gradient(90deg, #0d9488, #0f766e)',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
                onClick={() => navigate('/nurse-management')}
              >
                ➕ Add New Nurse
              </button>
              <button
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '0 20px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={() => navigate('/leave-management')}
              >
                📋 Review Leave Requests ({stats.pendingLeaves})
              </button>
            </div>
          </div>
        </section>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div className="stats-card-widget" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Total Nurses</span>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px', borderRadius: '14px', fontSize: '20px' }}>👩🏻‍⚕️</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>{stats.totalNurses}</div>
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>Registered in Hospital</span>
          </div>

          <div className="stats-card-widget" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Active Duty Nurses</span>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '14px', fontSize: '20px' }}>✅</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>{stats.activeNurses}</div>
            <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: '500' }}>Currently Active</span>
          </div>

          <div className="stats-card-widget" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Pending Leaves</span>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '10px', borderRadius: '14px', fontSize: '20px' }}>⏳</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>{stats.pendingLeaves}</div>
            <span style={{ color: '#d97706', fontSize: '13px', fontWeight: '500' }}>Awaiting Approval</span>
          </div>

          <div className="stats-card-widget" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Shift Swaps</span>
              <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '10px', borderRadius: '14px', fontSize: '20px' }}>⇄</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>{stats.pendingSwaps}</div>
            <span style={{ color: '#9333ea', fontSize: '13px', fontWeight: '500' }}>Swap Requests</span>
          </div>

        </div>

        {/* Nurses Roster Section */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                Active Nursing Staff Roster
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                List of registered nurses available for shift scheduling
              </p>
            </div>
            <button
              type="button"
              style={{
                background: '#f1f5f9',
                color: '#2563eb',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              onClick={() => navigate('/nurse-management')}
            >
              View All Nurses ({nurses.length}) →
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Loading staff records...</p>
          ) : nurses.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No nurses registered yet. Click "Add New Nurse" above.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Employee ID</th>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Department</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nurses.slice(0, 5).map((nurse) => (
                    <tr key={nurse.id || nurse._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: '#2563eb' }}>{nurse.employeeId}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>{nurse.fullName || nurse.username}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{nurse.email}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                          {nurse.department}
                        </span>
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
                          style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', color: '#0f172a', fontWeight: '500' }}
                          onClick={() => navigate('/nurse-management')}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
