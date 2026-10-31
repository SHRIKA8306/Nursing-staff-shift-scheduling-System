const fs = require('fs');

// 1. UPDATE AdminSidebar.js
const adminPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/components/AdminSidebar.js';
let adminCode = fs.readFileSync(adminPath, 'utf8');

const oldAdminBtn = /<button[\s\S]*?className="logout-button"[\s\S]*?<\/button>/m;
const newAdminBtn = `<button
          type="button"
          className="logout-button"
          onClick={() => { logout(); navigate("/"); }}
          title="Logout"
        >
          Logout
        </button>`;

adminCode = adminCode.replace(oldAdminBtn, newAdminBtn);
fs.writeFileSync(adminPath, adminCode, 'utf8');
console.log('✔ AdminSidebar.js updated with solid box button (no arrow)');

// 2. UPDATE NurseSidebar.js
const nursePath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/components/NurseSidebar.js';
let nurseCode = fs.readFileSync(nursePath, 'utf8');

const oldNurseBtn = /<button[\s\S]*?className="logout-button"[\s\S]*?<\/button>/m;
const newNurseBtn = `<button
          type="button"
          className="logout-button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          title="Logout"
        >
          Logout
        </button>`;

nurseCode = nurseCode.replace(oldNurseBtn, newNurseBtn);
fs.writeFileSync(nursePath, nurseCode, 'utf8');
console.log('✔ NurseSidebar.js updated with solid box button (no arrow)');

// 3. UPDATE App.css
const cssPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/App.css';
let cssCode = fs.readFileSync(cssPath, 'utf8');

const oldCssLogout = /\.logout-button \{[\s\S]*?\.logout-button:hover \{[\s\S]*?box-shadow:[^}]*?\}/m;
const newCssLogout = `.logout-button {
  width: 100%;
  border: none;
  background: #dc2626;
  color: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  padding: 12px 18px;
  border-radius: 12px;
  margin-top: 14px;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.38);
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: #b91c1c;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.48);
}

.logout-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}`;

cssCode = cssCode.replace(oldCssLogout, newCssLogout);
fs.writeFileSync(cssPath, cssCode, 'utf8');
console.log('✔ App.css updated with red box button style');
