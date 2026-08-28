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

          <div className="brand-icon">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61C19.32 3.09 16.85 3.09 15.33 4.61L12 7.94L8.67 4.61C7.15 3.09 4.68 3.09 3.16 4.61C1.61 6.16 1.61 8.68 3.16 10.23L12 19.07L20.84 10.23C22.39 8.68 22.39 6.16 20.84 4.61Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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