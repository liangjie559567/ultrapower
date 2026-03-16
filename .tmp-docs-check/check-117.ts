// 在修改文件后立即验证
const diagnostics = await lsp_diagnostics({ file: 'src/foo.ts' });
if (diagnostics.errorCount > 0) {
  // 在生产代码中修复，而非测试 hack
  console.error(diagnostics.messages);
}

// 项目级检查
const result = await lsp_diagnostics_directory({ directory: process.cwd() });
console.log(`${result.errorCount} errors, ${result.warningCount} warnings`);
