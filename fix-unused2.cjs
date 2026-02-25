const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));

// Collect items that need fixing (no _ prefix yet)
const byFile = {};
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.ruleId !== '@typescript-eslint/no-unused-vars') continue;
    const m = msg.message.match(/'(\w+)' is (defined|assigned a value) but never used/);
    if (!m) continue;
    const varName = m[1];
    if (varName.startsWith('_')) continue; // already handled
    if (!byFile[file.filePath]) byFile[file.filePath] = [];
    byFile[file.filePath].push({ line: msg.line, col: msg.column, varName, message: msg.message });
  }
}

let totalFixed = 0;
for (const [filePath, items] of Object.entries(byFile)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lineArr = content.split('\n');
  let changed = 0;

  for (const { line, varName, message } of items) {
    const idx = line - 1;
    const src = lineArr[idx];
    const isCatch = message.includes('caught error');

    if (isCatch) {
      const newLine = src.replace(new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`), `catch (_${varName})`);
      if (newLine !== src) { lineArr[idx] = newLine; changed++; continue; }
    }

    // Pattern 1: import { varName, ... } or import { varName } - named import
    // Match: varName followed by comma or closing brace (with optional whitespace/type keyword)
    const importPattern = new RegExp(`\\b(type\\s+)?${varName}\\b(?=\\s*[,}])`);
    const newLine1 = src.replace(importPattern, (match, typeKw) => {
      return (typeKw || '') + '_' + varName;
    });
    if (newLine1 !== src) { lineArr[idx] = newLine1; changed++; continue; }

    // Pattern 2: destructuring { varName, ... } or { varName }
    const destructPattern = new RegExp(`\\{([^}]*)\\b${varName}\\b([^}]*)\\}`);
    const newLine2 = src.replace(destructPattern, (match) => {
      return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
    });
    if (newLine2 !== src) { lineArr[idx] = newLine2; changed++; continue; }

    // Pattern 3: const/let/var varName =
    const declPattern = new RegExp(`\\b(const|let|var)\\s+${varName}\\b`);
    const newLine3 = src.replace(declPattern, (match, kw) => `${kw} _${varName}`);
    if (newLine3 !== src) { lineArr[idx] = newLine3; changed++; continue; }

    // Pattern 4: function param (varName, or (varName) or , varName,
    const paramPattern = new RegExp(`([(,]\\s*)${varName}(\\s*[,)])`);
    const newLine4 = src.replace(paramPattern, (match, pre, post) => `${pre}_${varName}${post}`);
    if (newLine4 !== src) { lineArr[idx] = newLine4; changed++; continue; }

    // Pattern 5: standalone identifier on a line (e.g. type alias, function declaration)
    // function varName( or type varName =
    const funcPattern = new RegExp(`\\b(function|type)\\s+${varName}\\b`);
    const newLine5 = src.replace(funcPattern, (match, kw) => `${kw} _${varName}`);
    if (newLine5 !== src) { lineArr[idx] = newLine5; changed++; continue; }

    console.log(`  SKIP: ${filePath.replace(/.*ultrapower./, '')}:${line} '${varName}' - ${src.trim()}`);
  }

  if (changed > 0) {
    fs.writeFileSync(filePath, lineArr.join('\n'), 'utf8');
    console.log(`Fixed ${changed} in ${filePath.replace(/.*ultrapower./, '')}`);
    totalFixed += changed;
  }
}
console.log('Total fixed:', totalFixed);
