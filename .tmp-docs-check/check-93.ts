// 对简单的 executor 任务使用 haiku
Task(
  subagent_type="ultrapower:executor",
  model="haiku",  // 覆盖默认的 sonnet
  prompt="Find definition of X"
)
