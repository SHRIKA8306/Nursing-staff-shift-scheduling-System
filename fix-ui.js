/**
 * fix-ui.js  –  Three targeted UI fixes:
 *
 *  1. Remove <footer>…</footer> blocks (incl. comment lines) from every page file
 *  2. Update .sidebar-brand spacing in App.css (gap 12px → 16px, padding 0 18px → 0 22px)
 *  3. Adjust header container padding in App.css (padding: 0 28px → 0 36px)
 *
 * Run with:  node fix-ui.js
 */

const fs   = require('fs');
const path = require('path');

// ─── helpers ─────────────────────────────────────────────────────────────────

function readFile(p)   { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(p, c, 'utf8'); console.log('✔ Updated:', p); }

// ─── 1. REMOVE FOOTERS FROM ALL PAGE FILES ────────────────────────────────────

const pagesDir = path.join(
  'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/pages'
);

const pageFiles = fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.js'))
  .map(f => path.join(pagesDir, f));

pageFiles.forEach(file => {
  let src = readFile(file);
  let modified = src;

  // Pattern 1 – with JSX comment above (e.g. {/* FOOTER */} or {/* === FOOTER === */})
  modified = modified.replace(
    /[ \t]*\{\/\*[^*]*FOOTER[^*]*\*\/\}\r?\n[ \t]*<footer[\s\S]*?<\/footer>/g,
    ''
  );

  // Pattern 2 – standalone <footer> with no preceding comment
  modified = modified.replace(
    /[ \t]*<footer[\s\S]*?<\/footer>\r?\n?/g,
    ''
  );

  // Clean up any leftover blank lines caused by the removal (max 2 consecutive)
  modified = modified.replace(/(\r?\n){3,}/g, '\n\n');

  if (modified !== src) writeFile(file, modified);
});

// ─── 2 & 3. PATCH APP.CSS ─────────────────────────────────────────────────────

const cssPath = path.join(
  'C:/Users/Shrika/OneDrive/Desktop/Nurse_Shift_Scheduling/frontend/src/App.css'
);

let css = readFile(cssPath);

// ── 2a. Primary .sidebar-brand rule (line ~1990): gap 12px→16px, padding 0 18px→0 22px
css = css.replace(
  /\.sidebar-brand \{\s*height: 84px;\s*padding: 0 18px;\s*display: flex;\s*align-items: center;\s*gap: 12px;/,
  '.sidebar-brand {\n  height: 84px;\n  padding: 0 22px;\n  display: flex;\n  align-items: center;\n  gap: 16px;'
);

// ── 2b. Responsive / dark-mode overrides that also set sidebar-brand
css = css.replace(/\.sidebar-brand \{([^}]*?)gap: 12px/g, (m, p1) => m.replace('gap: 12px', 'gap: 16px'));
css = css.replace(/\.sidebar-brand \{([^}]*?)padding: 0 18px/g, (m, p1) => m.replace('padding: 0 18px', 'padding: 0 22px'));

// ── 3a. Primary .nurse-header rule (line ~2168): padding: 0 28px → 0 36px
css = css.replace(
  /\.nurse-header \{\s*height: 74px;\s*background: white;\s*border-bottom: 1px solid #e0e6ef;\s*display: flex;\s*align-items: center;\s*justify-content: space-between;\s*padding: 0 28px;/,
  '.nurse-header {\n  height: 74px;\n  background: white;\n  border-bottom: 1px solid #e0e6ef;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 36px;'
);

// ── 3b. The design-system .nurse-header rule (line ~2667): padding: 16px 36px → 16px 44px
css = css.replace(
  /\.nurse-header, \.admin-header \{\s*background: #ffffff;\s*border-bottom: 1px solid #e2e8f0;\s*padding: 16px 36px;/,
  '.nurse-header, .admin-header {\n  background: #ffffff;\n  border-bottom: 1px solid #e2e8f0;\n  padding: 16px 44px;'
);

writeFile(cssPath, css);

console.log('\n✅ All 3 UI fixes applied successfully.');
console.log('   1. Footers removed from all page files');
console.log('   2. Sidebar brand spacing adjusted (gap 12→16px, padding 0 18→22px)');
console.log('   3. Header container edge padding adjusted (28→36px / 36→44px)');
