// 每次委托都需要明确指定模型
Task(
  subagent_type="ultrapower:executor",
  model="sonnet",
  prompt="Implement X"
)

Task(
  subagent_type="ultrapower:executor-low",
  model="haiku",
  prompt="Quick lookup"
)
