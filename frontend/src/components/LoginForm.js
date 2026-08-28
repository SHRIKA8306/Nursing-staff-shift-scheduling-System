import { useState, useEffect } from "react";
import RoleSelector from "./RoleSelector";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, loginNurse, setAuthSession } = useAuth();

  const [role, setRole] = useState("nurse");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Check URL query parameters for Google OAuth callback error or token
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    const tokenParam = params.get("token");
    const roleParam = params.get("role");
    const idParam = params.get("id");

    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    } else if (tokenParam && roleParam) {
      // Authenticated via Google callback
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${tokenParam}` }
      })
        .then(res => res.json())
        .then(user => {
          setAuthSession(user, tokenParam, roleParam);
          navigate("/nurse-dashboard");
        })
        .catch(() => {
          setAuthSession({ _id: idParam, role: roleParam }, tokenParam, roleParam);
          navigate("/nurse-dashboard");
        });
    }
  }, [location, navigate, setAuthSession]);

  const handleChange = (e) => {
    setErrorMessage("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLoginClick = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      if (role === "admin") {
        await loginAdmin(formData.username, formData.password);
        navigate("/admin-dashboard");
      } else {
        await loginNurse(formData.username, formData.password);
        navigate("/nurse-dashboard");
      }
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">

      {/* Heading - "Welcome back" color set to WHITE */}
      <div className="login-header">
        <h2 style={{ color: "white" }}>Welcome back</h2>
        <p style={{ color: "#a5bddb" }}>
          Sign in to your account to continue
        </p>
      </div>

      {/* Role Selector */}
      <RoleSelector
        role={role}
        setRole={(newRole) => {
          setRole(newRole);
          setErrorMessage("");
          if (newRole === "admin") {
            setFormData({ username: "admin@gmail.com", password: "admin" });
          } else {
            setFormData({ username: "", password: "" });
          }
        }}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="login-error-banner">
          <span className="error-icon">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}


      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: role === "nurse" ? "12px" : "35px" }}>

        {/* Username / Email */}
        <div className="form-group">
          <label htmlFor="username">
            {role === "admin" ? "Administrator Email" : "Nurse Email / Username"}
          </label>

          <div className="input-wrapper">
            <svg
              className="input-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password</label>

          <div className="input-wrapper">
            <svg
              className="input-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>

          <button type="button" className="forgot-password">
            Forgot password?
          </button>
        </div>

        {/* Sign In Button */}
        <button type="submit" className="sign-in-button" disabled={loading}>
          {loading ? "Authenticating..." : `Sign In as ${role === "admin" ? "Administrator" : "Nurse"}`}
        </button>

      </form>

      {/* NURSE GOOGLE AUTHENTICATION BUTTON */}
      {role === "nurse" && (
        <div className="google-auth-container" style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              textAlign: "center",
              margin: "0 0 20px",
              color: "#94a3b8",
              fontSize: "14px"
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(15, 23, 42, 0.15)" }}></div>
            <span style={{ padding: "0 14px", color: "#64748b" }}>Or continue with</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(15, 23, 42, 0.15)" }}></div>
          </div>

          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleLoginClick}
            style={{
              width: "100%",
              height: "54px",
              borderRadius: "13px",
              border: "1px solid #dadce0",
              background: "white",
              color: "#3c4043",
              fontWeight: "600",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              transition: "all 0.2s"
            }}
          >
            <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>
      )}





    </div>
  );
}

export default LoginForm;