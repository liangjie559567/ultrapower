const data = JSON.parse(require('fs').readFileSync('lint-output.json','utf8'));
for (const f of data) {
  const msgs = f.messages.filter(m => m.ruleId === '@typescript-eslint/no-explicit-any');
  if (!msgs.length) continue;
  const rel = f.filePath.replace(/.*src./, 'src/').replace(/\\/g, '/');
  msgs.forEach(m => console.log(rel + ':' + m.line + ':' + m.column));
}
