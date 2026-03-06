# ultrapower 交互式教程

**版本**: v5.5.18
**预计完成时间**: 30 分钟

---

## 教程概览

本教程包含 5 个场景，帮助你掌握 ultrapower 的核心功能：

1. ✅ 环境验证与配置
2. ✅ 使用第一个 agent（executor）
3. ✅ 创建自定义 skill
4. ✅ 配置 hook 自动化
5. ✅ 团队协作模式（team）

---

## 场景 1: 环境验证与配置

### 目标
验证 ultrapower 安装正确，配置基本环境。

### 步骤

**1.1 验证安装**
```bash
/ultrapower:omc-doctor
```

**预期输出**:
```
✅ ultrapower v5.5.18
✅ Node.js v18.x.x
✅ Claude Code v1.x.x
✅ All systems ready
```

**1.2 查看可用 agents**
```bash
/ultrapower:omc-help agents
```

**1.3 查看可用 skills**
```bash
/ultrapower:omc-help skills
```

### 验证
- [ ] omc-doctor 显示全部 ✅
- [ ] 能看到 50+ agents 列表
- [ ] 能看到 70+ skills 列表

---

## 场景 2: 使用第一个 agent（executor）

### 目标
学习如何调用 agent 执行代码任务。

### 步骤

**2.1 创建简单函数**
```
Task(subagent_type="ultrapower:executor", prompt="创建一个计算两数之和的函数 add.ts")
```

**预期输出**:
```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

**2.2 添加测试**
```
Task(subagent_type="ultrapower:test-engineer", prompt="为 add 函数添加单元测试")
```

**预期输出**:
```typescript
import { add } from './add';

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

### 验证
- [ ] 函数代码已生成
- [ ] 测试代码已生成
- [ ] 测试通过

---

## 场景 3: 创建自定义 skill

### 目标
学习如何创建自定义 skill。

### 步骤

**3.1 创建 skill 目录**
```bash
mkdir -p skills/my-skill
```

**3.2 创建 SKILL.md**
```markdown
# My Custom Skill

触发词: "my-skill"

## 描述
这是我的第一个自定义 skill。

## 执行逻辑
1. 读取用户输入
2. 调用 executor agent
3. 返回结果
```

**3.3 测试 skill**
```
/ultrapower:my-skill "测试任务"
```

### 验证
- [ ] skill 文件已创建
- [ ] skill 可以被触发
- [ ] skill 执行成功

---

## 场景 4: 配置 hook 自动化

### 目标
学习如何配置 hook 实现自动化。

### 步骤

**4.1 创建 hook 配置**
```json
// .claude/hooks/auto-format.json
{
  "name": "auto-format",
  "event": "PostToolUse",
  "condition": "tool_name === 'Edit'",
  "action": "prettier --write {{file_path}}"
}
```

**4.2 测试 hook**
```
# 编辑任意文件
Edit(file_path="test.ts", old_string="...", new_string="...")

# hook 会自动运行 prettier
```

**4.3 验证 hook 执行**
```bash
cat .omc/logs/hook-execution.log
```

### 验证
- [ ] hook 配置已创建
- [ ] 编辑文件后 hook 自动触发
- [ ] 文件已格式化

---

## 场景 5: 团队协作模式（team）

### 目标
学习如何使用 team 模式进行多 agent 协作。

### 步骤

**5.1 启动 team 模式**
```
team "重构用户认证模块"
```

**5.2 观察流水线执行**
```
team-plan → team-prd → team-exec → team-verify → team-fix
```

**5.3 查看任务状态**
```
TaskList()
```

**5.4 查看执行结果**
```
# team 会自动完成所有阶段
# 最终输出验证报告
```

### 验证
- [ ] team 模式启动成功
- [ ] 所有阶段顺序执行
- [ ] 最终状态为 complete

---

## 下一步

恭喜完成教程！你现在可以：

- 查看 [USER_GUIDE.md](USER_GUIDE.md) 了解更多功能
- 查看 [REFERENCE.md](REFERENCE.md) 获取完整参考
- 加入社区讨论：[GitHub Discussions](https://github.com/liangjie559567/ultrapower/discussions)

---

## 故障排查

遇到问题？查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
