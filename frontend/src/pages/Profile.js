import { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  UserRound,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Timer,
  Pill,
  Pencil,
  Lock
} from "lucide-react";
import NurseSidebar from "../components/NurseSidebar";
import AdminSidebar from "../components/AdminSidebar";
import LiveClock from "../components/LiveClock";
import { useAuth } from "../context/AuthContext";
import "../styles/Profile.css";

function Profile() {
  const { user, token, role, unreadCount } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "142 Hospital Road, Medical City",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "+1 (555) 000-9999",
    qualifications: "BSN, RN, ACLS",
    experienceYears: 5,
    shiftPreference: "Morning",
    skills: "ICU, Emergency Care, Cardiology"
  });

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) {
        setFormData({
          fullName: data.fullName || (user ? user.username : ""),
          phone: data.phone || "",
          address: data.address || "142 Hospital Road, Medical City",
          emergencyContactName: data.emergencyContact ? data.emergencyContact.name || "" : "",
          emergencyContactPhone: data.emergencyContact ? data.emergencyContact.phone || "" : "",
          qualifications: Array.isArray(data.qualifications) ? data.qualifications.join(", ") : "BSN, RN",
          experienceYears: data.experienceYears !== undefined ? data.experienceYears : 5,
          shiftPreference: data.shiftPreference || "Morning",
          skills: "ICU, Emergency Care, Cardiology"
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccess("");
    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone
        },
        qualifications: formData.qualifications.split(",").map(s => s.trim()),
        experienceYears: Number(formData.experienceYears),
        shiftPreference: formData.shiftPreference
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess("Profile updated successfully!");
        setIsEditing(false);
        fetchProfile();
      }
    } catch (err) {
      console.error("Profile save error:", err);
    }
  };

  const nurseName = formData.fullName || (user ? user.username : "Nurse");
  const nurseEmpId = user ? user.employeeId || "EMP-001" : "EMP-001";
  const nurseDept = user ? user.department || "General Ward" : "ICU";

  return (
    <div className="profile-page">
      {/* SIDEBAR */}
      {role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

      {/* MAIN AREA */}
      <div className="profile-main">
        {/* HEADER */}
        <header className="profile-header">
          <div className="profile-header-left">
            <button className="profile-menu-button">
              <Menu size={25} />
            </button>
            <div className="profile-welcome">
              <h3>Welcome back, {nurseName}! 👋</h3>
              <LiveClock showDate={true} showTime={true} className="dark" />
            </div>
          </div>

          <div className="profile-header-right">
            <button className="profile-notification">
              <Bell size={21} />
              <span>{unreadCount || 0}</span>
            </button>
            <div className="profile-header-avatar">
              {nurseName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="profile-content">
          {/* PAGE TITLE & EDIT BUTTON */}
          <div className="profile-title-row">
            <div>
              <h1>My Profile</h1>
              <p>Manage your personal and professional details</p>
            </div>

            <button 
              className="edit-profile-button"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil size={18} />
              <span>{isEditing ? "Cancel Editing" : "Edit Profile"}</span>
            </button>
          </div>

          {saveSuccess && (
            <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', marginBottom: '20px' }}>
              ✅ {saveSuccess}
            </div>
          )}

          {/* PROFILE SUMMARY CARD */}
          <section className="profile-summary-card">
            <div className="profile-summary-left">
              <div className="large-profile-avatar">
                {nurseName.substring(0, 2).toUpperCase()}
              </div>

              <div className="profile-basic-info">
                <h2>{nurseName}</h2>
                <p className="profile-designation">
                  Nursing Staff — {nurseDept}
                </p>

                <div className="profile-tags">
                  <span>{nurseDept}</span>
                  <span>{nurseEmpId}</span>
                  <span>Active Duty</span>
                </div>
              </div>
            </div>

            <div className="profile-statistics">
              <div className="profile-stat">
                <strong>{formData.experienceYears} Years</strong>
                <span>Experience</span>
              </div>

              <div className="profile-stat">
                <strong>4.9 ★</strong>
                <span>Rating</span>
              </div>

              <div className="profile-stat">
                <strong>{formData.shiftPreference}</strong>
                <span>Preferred Shift</span>
              </div>
            </div>
          </section>

          {/* EDITABLE FORM VS LOCKED FIELDS */}
          {isEditing ? (
            <form onSubmit={handleSave} style={{ background: 'white', padding: '28px', borderRadius: '24px', marginBottom: '30px', border: '1px solid #cbd5e1' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#0f172a' }}>
                ✏️ Edit Allowed Profile Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Contact Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Home Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Qualifications (Comma Separated)</label>
                  <input type="text" name="qualifications" value={formData.qualifications} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Preferred Shift</label>
                  <select name="shiftPreference" value={formData.shiftPreference} onChange={handleChange} style={{ width: '100%', height: '56px', borderRadius: '14px', border: '1px solid #dbe3ed', padding: '0 16px' }}>
                    <option value="Morning">Morning Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

              </div>

              {/* RESTRICTED FIELDS NOTIFICATION */}
              <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} color="#64748b" />
                <span>Note: Administrator-controlled fields (Employee ID, Role, Department, Employment Status) cannot be edited by nurses.</span>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#f1f5f9', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="sign-in-button" style={{ width: 'auto', padding: '0 28px', height: '46px', marginTop: 0 }}>Save Profile Changes</button>
              </div>
            </form>
          ) : (
            <div className="profile-details-grid">
              
              {/* PERSONAL DETAILS */}
              <section className="details-card">
                <h2>Personal Details</h2>

                <div className="detail-list">
                  <div className="detail-item">
                    <div className="detail-icon"><UserRound size={19} /></div>
                    <div className="detail-text">
                      <span>Full Name</span>
                      <strong>{nurseName}</strong>
                    </div>
                  </div>

                  {/* RESTRICTED FIELD: EMPLOYEE ID */}
                  <div className="detail-item">
                    <div className="detail-icon" style={{ background: '#fef3c7', color: '#b45309' }}><CreditCard size={19} /></div>
                    <div className="detail-text">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Employee ID <Lock size={12} color="#b45309" />
                      </span>
                      <strong>{nurseEmpId}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon"><Mail size={19} /></div>
                    <div className="detail-text">
                      <span>Registered Email</span>
                      <strong>{user ? user.email : "sarah@gmail.com"}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon"><Phone size={19} /></div>
                    <div className="detail-text">
                      <span>Contact Number</span>
                      <strong>{formData.phone || "+1 (555) 234-5678"}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon"><MapPin size={19} /></div>
                    <div className="detail-text">
                      <span>Address</span>
                      <strong>{formData.address}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* PROFESSIONAL INFORMATION */}
              <section className="details-card">
                <h2>Professional Information</h2>

                <div className="detail-list">
                  {/* RESTRICTED FIELD: DEPARTMENT */}
                  <div className="detail-item">
                    <div className="detail-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><Building2 size={19} /></div>
                    <div className="detail-text">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Assigned Department <Lock size={12} color="#0369a1" />
                      </span>
                      <strong>{nurseDept}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon"><GraduationCap size={20} /></div>
                    <div className="detail-text">
                      <span>Qualification</span>
                      <strong>{formData.qualifications}</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon"><Timer size={19} /></div>
                    <div className="detail-text">
                      <span>Experience</span>
                      <strong>{formData.experienceYears} Years</strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon"><Pill size={19} /></div>
                    <div className="detail-text">
                      <span>Shift Preference</span>
                      <strong>{formData.shiftPreference}</strong>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* CLINICAL SKILLS */}
          <section className="skills-card">
            <h2>Clinical Skills & Specializations</h2>
            <div className="skills-list">
              <span className="skill active">✓ ICU</span>
              <span className="skill active">✓ Emergency Care</span>
              <span className="skill active">✓ Cardiology</span>
              <span className="skill">Pediatrics</span>
              <span className="skill">Surgery</span>
              <span className="skill">Neurology</span>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="profile-footer">
          <span>© 2026 NurseSync AI · Nurse Portal</span>
          <span className="profile-system-status">
            <span className="profile-status-dot"></span>
            System Online
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Profile;