// Bundles styles.css and app.js inline into index.html so the page is fully
// self-contained (works in inline preview panels, by double-click, and on any host).
//
// Edit styles.css / app.js as the source of truth, then run:
//   node .claude/bundle.js
//
// It replaces the content between the INLINE-CSS / INLINE-JS markers in index.html.
// Idempotent: safe to run repeatedly.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// Guard: inlined content must not contain the closing tag that would end the block early.
if (/<\/style\s*>/i.test(css)) throw new Error('styles.css contains a </style> sequence — cannot inline safely.');
if (/<\/script\s*>/i.test(js)) throw new Error('app.js contains a </script> sequence — cannot inline safely.');

let html = fs.readFileSync(indexPath, 'utf8');

function inject(html, name, tagName, content) {
  const re = new RegExp(`<!-- INLINE-${name}:START -->[\\s\\S]*?<!-- INLINE-${name}:END -->`);
  if (!re.test(html)) throw new Error(`Markers for INLINE-${name} not found in index.html`);
  // Function replacer avoids $-substitution issues with the injected content.
  return html.replace(re, () =>
    `<!-- INLINE-${name}:START -->\n<${tagName}>\n${content}\n</${tagName}>\n<!-- INLINE-${name}:END -->`
  );
}

html = inject(html, 'CSS', 'style', css);
html = inject(html, 'JS', 'script', js);

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`Bundled styles.css (${css.length} bytes) and app.js (${js.length} bytes) into index.html`);
