const fs = require('fs');
const files = [
  'src/components/NurseSidebar.js',
  'src/pages/MySchedule.js',
  'src/pages/Notifications.js',
  'src/pages/NurseDashboard.js',
  'src/pages/Settings.js',
  'src/pages/ShiftSwap.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/  const getInitials = \(name\) => \{\n(?:[ \t]+.*\n)*[ \t]+\};\n/g, '');
  if (!content.includes('import { getInitials }')) {
    content = content.replace(/(import [^\n]+;\n)/, '$1import { getInitials } from "../utils/helpers";\n');
  }
  fs.writeFileSync(f, content);
});
console.log('Replaced getInitials in all files');
