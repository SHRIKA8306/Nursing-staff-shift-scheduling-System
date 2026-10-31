import React from "react";
import { Shield, Stethoscope } from "lucide-react";

function RoleSelector({ role, setRole }) {
  return (
    <div className="role-selector">

      <button
        type="button"
        className={`role-button ${
          role === "admin" ? "active" : ""
        }`}
        onClick={() => setRole("admin")}
      >
        <span className="role-icon" style={{ display: "inline-flex", alignItems: "center" }}>
          <Shield size={18} />
        </span>
        <span>Administrator</span>
      </button>

      <button
        type="button"
        className={`role-button ${
          role === "nurse" ? "active" : ""
        }`}
        onClick={() => setRole("nurse")}
      >
        <span className="role-icon" style={{ display: "inline-flex", alignItems: "center" }}>
          <Stethoscope size={18} />
        </span>
        <span>Nurse</span>
      </button>

    </div>
  );
}

export default RoleSelector;