const data = JSON.parse(require('fs').readFileSync('lint-output.json','utf8'));
for (const f of data) {
  for (const m of f.messages) {
    if (m.ruleId !== '@typescript-eslint/no-require-imports') continue;
    const rel = f.filePath.replace(/.*src./, 'src/').replace(/\\/g, '/');
    if (rel.includes('__tests__') || rel.includes('.test.')) continue;
    console.log(rel + ':' + m.line + '\t' + m.message);
  }
}
