const fs = require('fs');

// 1. UPDATE AdminSidebar.js
const adminSidebarPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/components/AdminSidebar.js';
let adminCode = fs.readFileSync(adminSidebarPath, 'utf8');

// Replace imports and state
adminCode = adminCode.replace(
  /import \{ useState, useEffect \} from "react";\r?\nimport \{ useNavigate, useLocation \} from "react-router-dom";\r?\nimport \{ useAuth \} from "\.\.\/context\/AuthContext";\r?\nimport \{ getSavedTheme, applyTheme \} from "\.\.\/utils\/theme";/,
  'import { useNavigate, useLocation } from "react-router-dom";\nimport { useAuth } from "../context/AuthContext";'
);

// Remove theme toggle logic
adminCode = adminCode.replace(
  /  const \[currentTheme, setCurrentTheme\] = useState\(getSavedTheme\);[\s\S]*?  const toggleTheme = \(\) => \{[\s\S]*?  \};\r?\n/m,
  ''
);

// Replace bottom section: user info first, logout button at bottom, no theme toggle
const adminBottomNew = `      {/* Bottom User Info & Logout */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)', color: 'white' }}>
            {initials}
          </div>
          <div className="user-info">
            <strong>{user ? user.username : 'Administrator'}</strong>
            <span>Admin · System Controller</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={() => { logout(); navigate("/"); }}
          title="Logout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>`;

adminCode = adminCode.replace(
  /      \{\/\* Bottom User Info & Logout \*\/\}[\s\S]*?      <\/div>\r?\n    <\/aside>/m,
  adminBottomNew + '\n    </aside>'
);

fs.writeFileSync(adminSidebarPath, adminCode, 'utf8');
console.log('✔ AdminSidebar.js updated successfully');

// 2. UPDATE NurseSidebar.js
const nurseSidebarPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/components/NurseSidebar.js';
let nurseCode = fs.readFileSync(nurseSidebarPath, 'utf8');

// Replace imports and state
nurseCode = nurseCode.replace(
  /import \{ useState, useEffect \} from "react";\r?\nimport \{ useNavigate, useLocation \} from "react-router-dom";\r?\nimport \{ getInitials \} from "\.\.\/utils\/helpers";\r?\nimport \{ useAuth \} from "\.\.\/context\/AuthContext";\r?\nimport \{ getSavedTheme, applyTheme \} from "\.\.\/utils\/theme";/,
  'import { useNavigate, useLocation } from "react-router-dom";\nimport { getInitials } from "../utils/helpers";\nimport { useAuth } from "../context/AuthContext";'
);

// Remove theme toggle logic
nurseCode = nurseCode.replace(
  /  const \[currentTheme, setCurrentTheme\] = useState\(getSavedTheme\);[\s\S]*?  const toggleTheme = \(\) => \{[\s\S]*?  \};\r?\n/m,
  ''
);

// Replace bottom section: user info first, logout button at bottom, no theme toggle
const nurseBottomNew = `      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {getInitials(user ? user.username : "Nurse")}
          </div>

          <div className="user-info">
            <strong>{user ? user.username : "Nurse User"}</strong>
            <span>
              {user ? user.department || "General" : "ICU"} · {user ? user.employeeId || "EMP-001" : "EMP-001"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className="logout-button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          title="Logout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>`;

nurseCode = nurseCode.replace(
  /      \{\/\* Bottom section \*\/\}[\s\S]*?      <\/div>\r?\n\r?\n    <\/aside>/m,
  nurseBottomNew + '\n\n    </aside>'
);

fs.writeFileSync(nurseSidebarPath, nurseCode, 'utf8');
console.log('✔ NurseSidebar.js updated successfully');

// 3. UPDATE App.css for .logout-button and .sidebar-user
const cssPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/App.css';
let cssCode = fs.readFileSync(cssPath, 'utf8');

const oldLogoutBlock = /\.logout-button \{[\s\S]*?\.sidebar-user \{[\s\S]*?display: flex;[\s\S]*?gap: 12px;\r?\n\}/m;

const newLogoutBlock = `.sidebar-user {
  margin-top: 0;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout-button {
  width: 100%;
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 11px 16px;
  border-radius: 12px;
  margin-top: 14px;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.55);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}`;

if (oldLogoutBlock.test(cssCode)) {
  cssCode = cssCode.replace(oldLogoutBlock, newLogoutBlock);
  fs.writeFileSync(cssPath, cssCode, 'utf8');
  console.log('✔ App.css updated successfully');
} else {
  console.log('Notice: regex pattern did not match exactly, inspecting App.css');
}
