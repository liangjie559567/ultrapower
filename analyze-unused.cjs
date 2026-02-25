const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));
const items = [];
for (const f of data) {
  for (const m of f.messages) {
    if (m.ruleId !== '@typescript-eslint/no-unused-vars') continue;
    const match = m.message.match(/'(\w+)' is (defined|assigned a value) but never used/);
    if (!match) continue;
    const varName = match[1];
    items.push({ file: f.filePath.replace(/.*ultrapower./, ''), line: m.line, varName, msg: m.message });
  }
}
console.log('Total no-unused-vars:', items.length);
const byVar = {};
for (const i of items) { byVar[i.varName] = (byVar[i.varName]||0)+1; }
const sorted = Object.entries(byVar).sort((a,b)=>b[1]-a[1]);
console.log('\nTop vars:');
sorted.slice(0,20).forEach(([k,v])=>console.log(v, k));
console.log('\nAlready prefixed with _:');
const prefixed = sorted.filter(([k])=>k.startsWith('_'));
console.log(prefixed.length, 'vars already have _ prefix');
const notPrefixed = sorted.filter(([k])=>!k.startsWith('_'));
console.log(notPrefixed.length, 'vars still need _ prefix');
