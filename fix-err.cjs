const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));
const byFile = {};
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.ruleId === '@typescript-eslint/no-unused-vars' && msg.message.includes("'err'")) {
      if (!byFile[file.filePath]) byFile[file.filePath] = [];
      byFile[file.filePath].push(msg.line);
    }
  }
}
console.log(JSON.stringify(byFile, null, 2));
