const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));

// Collect all unused vars warnings (excluding 'error' which we already fixed)
const byFile = {};
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.ruleId !== '@typescript-eslint/no-unused-vars') continue;
    // Match patterns like 'err', 'context', 'path', 'state', etc. that are catch vars or args
    const m = msg.message.match(/'(\w+)' is (defined|assigned a value) but never used/);
    if (!m) continue;
    const varName = m[1];
    if (varName === '_error' || varName === 'error') continue; // already handled
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
      // catch (err) -> catch (_err)
      const newLine = src.replace(new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`), `catch (_${varName})`);
      if (newLine !== src) { lineArr[idx] = newLine; changed++; continue; }
    }

    // For unused imports/vars: prefix with _
    // Pattern: const { varName, ... } or import { varName } or const varName =
    const patterns = [
      // destructuring: { varName,  or { varName }
      [new RegExp(`\\{([^}]*)\\b${varName}\\b([^}]*)\\}`), (match, pre, post) => {
        return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
      }],
      // simple: const varName = or let varName =
      [new RegExp(`\\b(const|let|var)\\s+${varName}\\b`), (match, kw) => `${kw} _${varName}`],
      // function param: (varName, or (varName) or , varName,
      [new RegExp(`([(,]\\s*)${varName}(\\s*[,)])`) , (match, pre, post) => `${pre}_${varName}${post}`],
    ];

    let fixed = false;
    for (const [re, replacer] of patterns) {
      const newLine = src.replace(re, replacer);
      if (newLine !== src) {
        lineArr[idx] = newLine;
        changed++;
        fixed = true;
        break;
      }
    }
    if (!fixed) {
      console.log(`  SKIP: ${filePath.replace(/.*ultrapower./, '')}:${line} '${varName}' - ${src.trim()}`);
    }
  }

  if (changed > 0) {
    fs.writeFileSync(filePath, lineArr.join('\n'), 'utf8');
    console.log(`Fixed ${changed} in ${filePath.replace(/.*ultrapower./, '')}`);
    totalFixed += changed;
  }
}
console.log('Total fixed:', totalFixed);
