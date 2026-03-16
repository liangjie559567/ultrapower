export const allCustomTools: GenericToolDefinition[] = [
  ...lspTools,           // LSP 工具
  ...astTools,           // AST 工具
  pythonReplTool,        // Python REPL
  ...stateTools,         // 状态管理工具
  ...notepadTools,       // Notepad 工具
  ...memoryTools,        // 项目记忆工具
  ...traceTools,         // 追踪工具
  dependencyAnalyzerTool,// 依赖分析
  docSyncTool,           // 文档同步
  parallelOpportunityDetectorTool, // 并行机会检测
  ...skillsTools         // Skills 工具
];
