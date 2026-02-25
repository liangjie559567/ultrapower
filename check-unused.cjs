const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));
const items = [];
for (const f of data) {
  for (const m of f.messages) {
    if (m.ruleId !== '@typescript-eslint/no-unused-vars') continue;
    const match = m.message.match(/'(\w+)' is (defined|assigned a value) but never used/);
    if (!match) continue;
    const varName = match[1];
    if (varName.startsWith('_')) continue;
    items.push({ file: f.filePath.replace(/.*ultrapower./, ''), line: m.line, varName, msg: m.message });
  }
}
console.log('Needs fix:', items.length);
const byVar = {};
for (const i of items) { byVar[i.varName] = (byVar[i.varName]||0)+1; }
Object.entries(byVar).sort((a,b)=>b[1]-a[1]).slice(0,30).forEach(([k,v])=>console.log(v, k));
console.log('\nSample items:');
items.slice(0,20).forEach(i => console.log(`  ${i.file}:${i.line} '${i.varName}'`));
