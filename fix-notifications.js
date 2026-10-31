const fs = require('fs');
const path = 'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/pages/Notifications.js';

let lines = fs.readFileSync(path, 'utf8').split('\n');

// Line 291 (index 290) has an extra </div> — remove it
// Line 290 (index 289) is the correct closing </div> for the padding div at line 117
// We need to remove the duplicate on line 291

// Print lines 285-300 for verification before fix
console.log('=== BEFORE FIX (lines 285-300) ===');
for (let i = 284; i < 300 && i < lines.length; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}

// Remove line 291 (index 290) which is the extra </div>
lines.splice(290, 1);

console.log('\n=== AFTER FIX (lines 285-300) ===');
for (let i = 284; i < 300 && i < lines.length; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('\n✅ Fixed! Extra </div> removed from line 291.');
