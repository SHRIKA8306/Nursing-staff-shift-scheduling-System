import LoginForm from "../components/LoginForm";
import "../App.css";

function Login() {
  return (
    <div className="login-page">

      {/* Decorative background shapes */}
      <div className="background-circle circle-one"></div>
      <div className="background-circle circle-two"></div>
      <div className="background-shape shape-one"></div>

      {/* LEFT SIDE */}
      <section className="hero-section">

        {/* Logo */}
        <div className="brand">

          <div className="brand-icon" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <img src="/logo.png" alt="NurseSync AI" style={{ width: '72px', height: '72px', objectFit: 'contain', display: 'block' }} />
          </div>

          <div className="brand-text">
            <h2>NurseSync AI</h2>
            <p>Healthcare Workforce Platform</p>
          </div>

        </div>

        {/* Hero text */}
        <div className="hero-content">

          <h1>
            Smart Shift
            <span>Scheduling</span>
            Powered by AI
          </h1>

          <p className="hero-description">
            Optimize nursing staff allocation, reduce burnout,
            <br />
            and ensure 24/7 patient care coverage with
            <br />
            intelligent workforce management.
          </p>

        </div>

      </section>

      {/* RIGHT SIDE */}
      <section className="login-section">

        <LoginForm />

      </section>

    </div>
  );
}

export default Login;