// 显式模型永远不会被覆盖
Task(
  subagent_type="ultrapower:executor",
  model="haiku",  // ← 明确使用 haiku 而非默认的 sonnet
  prompt="Quick lookup"
)
