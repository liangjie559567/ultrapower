// 简单任务用 haiku
Task({ subagent_type: "ultrapower:writer", model: "haiku" })

// 标准任务用 sonnet（默认）
Task({ subagent_type: "ultrapower:executor" })

// 复杂任务用 opus
Task({ subagent_type: "ultrapower:architect", model: "opus" })
