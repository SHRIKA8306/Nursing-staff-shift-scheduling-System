// fix-html-common-issues.js
// Walk the project and apply safe, format‑only fixes to every HTML file.
//   • Ensure the file ends with a newline.
//   • Prepend a proper <!DOCTYPE html> if missing.
//   • Normalise <meta charset="utf-8"> to a self‑closing form.
// This script uses only Node's built‑in modules – no external packages required.

const fs = require('fs');
const path = require('path');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue; // skip huge deps folder
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

let changed = 0;
for (const file of walk(process.cwd())) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Ensure trailing newline
  if (!content.endsWith('\n')) content += '\n';

  // Ensure proper doctype (case‑insensitive)
  if (!/^<!DOCTYPE\s+html>/i.test(content.trimStart())) {
    content = '<!DOCTYPE html>\n' + content;
  }

  // Normalise meta charset self‑closing
  content = content.replace(/<meta\s+charset=["']utf-8["']\s*(?!\/)>/gi, '<meta charset="utf-8" />');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✔ Fixed ${file}`);
    changed++;
  }
}

console.log(`\n✅ Completed – ${changed} file(s) updated.`);
