const fs = require('fs');

// 1. UPDATE App.css
const appCssPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/App.css';
let appCss = fs.readFileSync(appCssPath, 'utf8');

const targetAppCss = /\.logout-button \{[\s\S]*?\.logout-button:active \{[\s\S]*?box-shadow:[^}]*?\}/m;

const replacementAppCss = `.logout-button {
  width: 100% !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  background: #1e2b42 !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  padding: 12px 18px !important;
  border-radius: 12px !important;
  margin-top: 14px !important;
  letter-spacing: 0.3px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.2s ease !important;
  text-align: center !important;
}

.logout-button:hover {
  background: #253552 !important;
  border-color: rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35) !important;
}

.logout-button:active {
  background: #1e2b42 !important;
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
}`;

if (targetAppCss.test(appCss)) {
  appCss = appCss.replace(targetAppCss, replacementAppCss);
  fs.writeFileSync(appCssPath, appCss, 'utf8');
  console.log('✔ App.css updated with #1e2b42 stable button color');
} else {
  console.log('App.css pattern match failed');
}

// 2. UPDATE NurseDashboard.css
const ndCssPath = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/styles/NurseDashboard.css';
let ndCss = fs.readFileSync(ndCssPath, 'utf8');

const targetNdCss = /\.logout-button \{[\s\S]*?text-align: left;\r?\n\}/m;

const replacementNdCss = `.logout-button {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: #1e2b42;
  color: #ffffff;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;
  text-align: center;
}

.logout-button:hover {
  background: #253552;
  border-color: rgba(255, 255, 255, 0.28);
  color: #ffffff;
}`;

if (targetNdCss.test(ndCss)) {
  ndCss = ndCss.replace(targetNdCss, replacementNdCss);
  fs.writeFileSync(ndCssPath, ndCss, 'utf8');
  console.log('✔ NurseDashboard.css updated with #1e2b42 stable button color');
} else {
  console.log('NurseDashboard.css pattern match failed');
}
