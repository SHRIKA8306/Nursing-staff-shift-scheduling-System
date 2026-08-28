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
        <span className="role-icon">👩🏻‍💼</span>
        <span>Administrator</span>
      </button>

      <button
        type="button"
        className={`role-button ${
          role === "nurse" ? "active" : ""
        }`}
        onClick={() => setRole("nurse")}
      >
        <span className="role-icon">👩🏻‍⚕️</span>
        <span>Nurse</span>
      </button>

    </div>
  );
}

export default RoleSelector;