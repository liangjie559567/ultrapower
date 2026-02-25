const data = JSON.parse(require('fs').readFileSync('lint-output.json','utf8'));
const byRule = {};
for (const f of data) {
  for (const m of f.messages) {
    const rule = m.ruleId;
    if (!byRule[rule]) byRule[rule] = {};
    const rel = f.filePath.replace(/.*src./, 'src/').replace(/\\/g, '/');
    const parts = rel.split('/');
    // 取模块层级：src/features/xxx 或 src/hooks/xxx 等
    const module = parts.length >= 3 ? parts.slice(0,3).join('/') : parts.slice(0,2).join('/');
    byRule[rule][module] = (byRule[rule][module]||0)+1;
  }
}
for (const [rule, modules] of Object.entries(byRule)) {
  console.log('\n=== ' + rule + ' ===');
  Object.entries(modules).sort((a,b)=>b[1]-a[1]).forEach(([m,c])=>console.log('  '+c+'\t'+m));
}
