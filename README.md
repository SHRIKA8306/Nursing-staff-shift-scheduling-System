## 🌐 Live Deployments

- 🚀 **Frontend Web Application**: [https://nursesyncai.netlify.app](https://nursesyncai.netlify.app)
- ⚡ **Backend API Server**: [https://nursesyncai.onrender.com](https://nursesyncai.onrender.com)

---

## 📖 Overview

**NurseSync AI** is a full-stack, enterprise-grade healthcare workforce management platform built to solve the complex operational challenges of hospital staffing and nurse shift scheduling.

Hospitals operate 24/7/365 across mission-critical departments (ICU, Emergency, Pediatrics, Oncology, Surgery, General Ward). Scheduling nursing staff manually leads to nurse burnout, unfair shift distribution, accidental compliance violations, and understaffed shifts.

NurseSync AI provides an **automated, role-based, intelligent scheduling ecosystem** featuring dedicated portals for **Hospital Administrators/Head Nurses** and **Nursing Staff**, real-time live attendance logging, certified skill-based shift allocation, transparent leave/swap approval workflows, and audit-proof logging.

---

## ✨ Key Features

### 👨‍⚕️ Nurse Portal
- **Dashboard**: Next shift countdown, weekly schedule snapshot, and quick clock-in widget.
- **My Schedule**: Visual calendar and agenda view showing assigned wards, shift timings, and duty partners.
- **Attendance & Timesheets**: Personal history of logged hours and verification of worked shifts.
- **Shift Swap Marketplace**: Propose mutual exchanges with eligible colleagues without administrative friction.
- **Leave Requests**: View remaining leave balances and submit time-off requests with date pickers.
- **Profile & Certifications**: View employee credentials, emergency contacts, specialized skills, and license expiry dates.
- **Notifications Hub**: In-app notifications with badge counters and single-click read markers.

### 🛡️ Admin Control Portal
- **Executive Dashboard**: Real-time department headcount, pending leaves, open swap requests, and staff distribution.
- **Nurse Directory**: Searchable directory filtered by department (ICU, ER, General Ward, etc.).
- **Schedule Management**: Master visual rota view for assigning, editing, or deleting shifts across rotations.
- **Attendance Reports**: Hospital-wide timesheet log with exact check-in/out timestamps and automatic hour calculation.
- **Leave & Swap Approvals**: Structured review queues for time-off and peer shift-swap approvals.
- **AI Scheduling Assistant**: Automated allocation engine balancing shift loads, leaves, and night duties.
- **Audit Logs**: Immutable security journal tracking all sensitive administrative actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, React Router DOM v7, Lucide Icons, Pure Modular CSS |
| **Backend** | Node.js, Express.js, Mongoose ODM, Passport.js, JWT, Bcrypt |
| **Database** | MongoDB Atlas (Cloud Database) |
| **Authentication**| JWT Stateless Auth & Google OAuth 2.0 |
| **Hosting** | Netlify (Frontend SPA), Render (Backend Web Service) |

---

## 🚀 Local Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)
- **MongoDB** running locally or a MongoDB Atlas Cloud URI

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/SHRIKA8306/Nurse_Shift_Scheduling.git
cd Nurse_Shift_Scheduling

# Install backend and frontend dependencies:
npm install --prefix Backend && npm install --prefix frontend
```

### 3. Environment Variables
Create a `.env` file inside the `Backend/` directory:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB=mongodb://127.0.0.1:27017/nurse_shift_db
MONGO_URI=mongodb://127.0.0.1:27017/nurse_shift_db
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
```

### 4. Seed Default Database (Admin & Nurses)
```bash
cd Backend
node seeder.js
```

### 5. Run the Application
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd Backend
npm run dev
# Server running at http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
# Client running at http://localhost:3000
```

---

## 🔒 Default Demo Credentials

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` / `admin@hospital.com` | `admin123` |
| **Nurse** | `nurse_sarah` | `nurse123` |
| **Nurse** | `nurse_john` | `nurse123` |

---

## 📄 License
This project is licensed under the MIT License.
