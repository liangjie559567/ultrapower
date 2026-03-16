// 执行前
Task(
  subagent_type="ultrapower:executor",
  prompt="Implement feature X"
)

// 执行后（自动）
Task(
  subagent_type="ultrapower:executor",
  model="sonnet",  // ← 自动注入
  prompt="Implement feature X"
)
