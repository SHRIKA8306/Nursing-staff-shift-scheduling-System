import React, { useEffect, useState } from "react";
import { Bell, Menu, CircleHelp } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import "../styles/AdminReports.css";

function AdminReports() {
  const { user, token, unreadCount } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [fairness, setFairness] = useState([]);

  const adminName = user ? user.username : "Administrator";

  // Fetch all shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await fetch("/api/shifts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setShifts(data);
        }
      } catch (err) {
        console.error("Failed to fetch shifts", err);
      }
    };
    if (token) fetchShifts();
  }, [token]);

  // Compute heatmap for next 14 days
  useEffect(() => {
    if (!shifts.length) return;
    const today = new Date();
    const map = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const iso = date.toISOString().split("T")[0];
      const count = shifts.filter((s) => s.date === iso).length;
      map.push({ date: iso, count });
    }
    setHeatmap(map);
  }, [shifts]);

  // Compute fairness metrics per nurse for current month
  useEffect(() => {
    if (!shifts.length) return;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const nurseMap = {};
    shifts.forEach((s) => {
      const shiftDate = new Date(s.date);
      if (shiftDate.getMonth() !== month || shiftDate.getFullYear() !== year) return;
      const nurseId = s.nurse?.toString() || s.nurseId || "unknown";
      if (!nurseMap[nurseId]) {
        nurseMap[nurseId] = { totalHours: 0, nightShifts: 0, weekendShifts: 0 };
      }
      let hours = 8;
      if (s.shiftType === "Night") hours = 8;
      else if (s.shiftType === "Morning" || s.shiftType === "Evening") hours = 8;
      nurseMap[nurseId].totalHours += hours;
      if (s.shiftType === "Night") nurseMap[nurseId].nightShifts += 1;
      const day = shiftDate.getDay();
      if (day === 0 || day === 6) nurseMap[nurseId].weekendShifts += 1;
    });
    const list = Object.entries(nurseMap).map(([id, metrics]) => ({ id, ...metrics }));
    setFairness(list);
  }, [shifts]);

  const getHeatColor = (count) => {
    if (count === 0) return "#fee2e2";
    if (count < 2) return "#fef3c7";
    return "#dcfce7";
  };

  return (
    <div className="attendance-layout">
      <AdminSidebar />

      <main className="attendance-main">
        <header className="attendance-header">
          <div className="attendance-header-left">
            <button className="attendance-menu-button" type="button">
              <Menu size={25} />
            </button>
            <div className="attendance-welcome">
              <h3>Welcome back, {adminName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>
          <div className="attendance-header-right">
            <button className="attendance-notification" type="button">
              <Bell size={21} /><span>{unreadCount || 0}</span>
            </button>
            <div className="attendance-avatar">{getInitials(adminName)}</div>
          </div>
        </header>

        <div className="attendance-content">
          <div className="attendance-page-heading">
            <h1>Reports & Fairness</h1>
            <p>Coverage heatmap and fairness dashboard</p>
          </div>

          <div className="admin-reports">
            <h2>Coverage Heatmap (Next 14 Days)</h2>
            <div className="heatmap-grid">
              {heatmap.map((item) => (
                <div
                  key={item.date}
                  className="heatmap-cell"
                  style={{ backgroundColor: getHeatColor(item.count) }}
                >
                  <span>{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  <span>{item.count} shifts</span>
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: "32px" }}>Fairness Dashboard (Current Month)</h2>
            <table className="fairness-table">
              <thead>
                <tr>
                  <th>Nurse ID</th>
                  <th>Total Hours</th>
                  <th>Night Shifts</th>
                  <th>Weekend Shifts</th>
                </tr>
              </thead>
              <tbody>
                {fairness.map((n) => (
                  <tr key={n.id}>
                    <td>{n.id}</td>
                    <td>{n.totalHours}</td>
                    <td>{n.nightShifts}</td>
                    <td>{n.weekendShifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="attendance-footer">
          <span>© 2026 NurseSync AI · Admin Portal</span>
          <span className="attendance-system-status"><span></span>System Online</span>
        </footer>
      </main>
      <button className="attendance-help-button" type="button"><CircleHelp size={23} /></button>
    </div>
  );
}

export default AdminReports;
