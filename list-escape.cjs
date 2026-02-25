const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));
const items = [];
for (const f of data) {
  for (const m of f.messages) {
    if (m.ruleId !== 'no-useless-escape') continue;
    items.push({ file: f.filePath.replace(/.*ultrapower./, ''), line: m.line, col: m.column, msg: m.message });
  }
}
console.log('no-useless-escape count:', items.length);
items.forEach(i => console.log(i.file + ':' + i.line + ':' + i.col, i.msg));
