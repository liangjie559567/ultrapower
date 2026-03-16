type DiagnosticsStrategy = 'tsc' | 'lsp' | 'auto';
// auto（默认）：有 tsc 时使用 tsc --noEmit，否则回退到 LSP
// tsc：强制使用 TypeScript 编译器检查
// lsp：强制使用逐文件 LSP 诊断
