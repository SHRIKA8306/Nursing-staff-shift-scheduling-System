const fs = require('fs');
const files = [
  'src/pages/Attendance.js',
  'src/pages/LeaveManagement.js',
  'src/pages/MySchedule.js',
  'src/pages/NurseDashboard.js',
  'src/pages/Profile.js',
  'src/pages/Settings.js',
  'src/pages/ShiftSwap.js',
  'src/pages/Notifications.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // replace const { ... } = useAuth(); with const { ..., unreadCount } = useAuth();
  if (content.match(/const \{[^}]+useAuth/)) {
    if (!content.includes('unreadCount')) {
      content = content.replace(/(const \{[^}]+)( \} = useAuth\(\);)/, '$1, unreadCount$2');
    }
  }

  // replace <span>2</span> or similar with {unreadCount > 0 ? <span>{unreadCount}</span> : null} or just <span>{unreadCount}</span>
  // In Attendance.js we have <span>2</span>
  content = content.replace(/<span>2<\/span>/g, '<span>{unreadCount || 0}</span>');
  content = content.replace(/<span className="header-notification-count">\s*2\s*<\/span>/g, '<span className="header-notification-count">{unreadCount || 0}</span>');
  
  fs.writeFileSync(f, content);
});
console.log('Replaced unreadCount in all files');
