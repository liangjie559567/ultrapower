// 手动指定时，Delegation Enforcer 不会覆盖
Task({
  subagent_type: "ultrapower:executor",
  model: "opus",  // 强制使用 opus，Enforcer 不干预
  prompt: "Complex refactoring task..."
})
