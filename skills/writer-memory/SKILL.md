---
name: writer-memory
description: 面向作家的智能记忆系统——跟踪角色、关系、场景和主题
argument-hint: "init|char|rel|scene|query|validate|synopsis|status|export [args]"
---

# Writer Memory - 面向作家的智能记忆系统

为创意写作者设计的持久化记忆系统，对韩语叙事工作流提供一流支持。

## 概述

Writer Memory 跨 Claude session 为小说作家维护上下文。它跟踪：

- **Characters（캐릭터）**：情感弧（감정궤도）、态度（태도）、对话语气（대사톤）、语言等级
- **World（세계관）**：设定、规则、氛围、约束
- **Relationships（관계）**：角色动态及其随时间的演变
- **Scenes（장면）**：镜头构成（컷구성）、叙述语气、情感标签
- **Themes（테마）**：情感主题（정서테마）、作者意图

所有数据持久化在 `.writer-memory/memory.json` 中，便于 git 协作。

## 命令

| 命令 | 行动 |
|------|------|
| `/ultrapower:writer-memory init <project-name>` | 初始化新项目记忆 |
| `/ultrapower:writer-memory status` | 显示记忆概览（角色数、场景数等） |
| `/ultrapower:writer-memory char add <name>` | 添加新角色 |
| `/ultrapower:writer-memory char <name>` | 查看角色详情 |
| `/ultrapower:writer-memory char update <name> <field> <value>` | 更新角色字段 |
| `/ultrapower:writer-memory char list` | 列出所有角色 |
| `/ultrapower:writer-memory rel add <char1> <char2> <type>` | 添加关系 |
| `/ultrapower:writer-memory rel <char1> <char2>` | 查看关系 |
| `/ultrapower:writer-memory rel update <char1> <char2> <event>` | 添加关系事件 |
| `/ultrapower:writer-memory scene add <title>` | 添加新场景 |
| `/ultrapower:writer-memory scene <id>` | 查看场景详情 |
| `/ultrapower:writer-memory scene list` | 列出所有场景 |
| `/ultrapower:writer-memory theme add <name>` | 添加主题 |
| `/ultrapower:writer-memory world set <field> <value>` | 设置世界属性 |
| `/ultrapower:writer-memory query <question>` | 自然语言查询记忆（支持韩语） |
| `/ultrapower:writer-memory validate <character> <dialogue>` | 检查对话是否符合角色语气 |
| `/ultrapower:writer-memory synopsis` | 生成以情感为中心的梗概 |
| `/ultrapower:writer-memory export` | 将完整记忆导出为可读 markdown |
| `/ultrapower:writer-memory backup` | 创建手动备份 |

## 记忆类型

### 캐릭터 메모리（角色记忆）

跟踪一致描绘所必需的个人角色属性：

| 字段 | 韩语 | 描述 |
|------|------|------|
| `arc` | 감정궤도 | 情感旅程（如"체념 -> 욕망자각 -> 선택"） |
| `attitude` | 태도 | 对生活/他人的当前态度 |
| `tone` | 대사톤 | 对话风格（如"담백"、"직설적"、"회피적"） |
| `speechLevel` | 말투 레벨 | 正式程度：반말、존댓말、해체、혼합 |
| `keywords` | 핵심 단어 | 他们使用的特征词/短语 |
| `taboo` | 금기어 | 他们绝不会说的词/短语 |
| `emotional_baseline` | 감정 기준선 | 默认情感状态 |
| `triggers` | 트리거 | 引发情感反应的事物 |

**示例：**
```
/writer-memory char add 새랑
/writer-memory char update 새랑 arc "체념 -> 욕망자각 -> 선택"
/writer-memory char update 새랑 tone "담백, 현재충실, 감정억제"
/writer-memory char update 새랑 speechLevel "해체"
/writer-memory char update 새랑 keywords "그냥, 뭐, 괜찮아"
/writer-memory char update 새랑 taboo "사랑해, 보고싶어"
```

### 세계관 메모리（世界记忆）

建立你的故事所处的宇宙：

| 字段 | 韩语 | 描述 |
|------|------|------|
| `setting` | 배경 | 时间、地点、社会背景 |
| `rules` | 규칙 | 世界如何运作（魔法系统、社会规范） |
| `atmosphere` | 분위기 | 整体情绪和基调 |
| `constraints` | 제약 | 在这个世界中不能发生的事 |
| `history` | 역사 | 相关背景故事 |

### 관계 메모리（关系记忆）

捕捉角色间随时间变化的动态：

| 字段 | 描述 |
|------|------|
| `type` | 基础关系：romantic、familial、friendship、rivalry、professional |
| `status` | 当前状态：budding、stable、strained、broken、healing |
| `power_dynamic` | 谁占上风（如有） |
| `events` | 改变关系的时间线 |
| `tension` | 当前未解决的冲突 |
| `intimacy_level` | 情感亲密度（1-10） |

**示例：**
```
/writer-memory rel add 새랑 해랑 romantic
/writer-memory rel update 새랑 해랑 "첫 키스 - 새랑 회피"
/writer-memory rel update 새랑 해랑 "해랑 고백 거절당함"
/writer-memory rel update 새랑 해랑 "새랑 먼저 손 잡음"
```

### 장면 메모리（场景记忆）

跟踪单个场景及其情感架构：

| 字段 | 韩语 | 描述 |
|------|------|------|
| `title` | 제목 | 场景标识符 |
| `characters` | 등장인물 | 出场人物 |
| `location` | 장소 | 发生地点 |
| `cuts` | 컷 구성 | 逐镜头分解 |
| `narration_tone` | 내레이션 톤 | 叙述声音风格 |
| `emotional_tag` | 감정 태그 | 主要情感（如"설렘+불안"） |
| `purpose` | 목적 | 这个场景在故事中存在的原因 |
| `before_after` | 전후 변화 | 角色发生了什么变化 |

### 테마 메모리（主题记忆）

捕捉贯穿故事的深层含义：

| 字段 | 韩语 | 描述 |
|------|------|------|
| `name` | 이름 | 主题标识符 |
| `expression` | 표현 방식 | 这个主题如何体现 |
| `scenes` | 관련 장면 | 体现这个主题的场景 |
| `character_links` | 캐릭터 연결 | 哪些角色承载这个主题 |
| `author_intent` | 작가 의도 | 你希望读者感受到什么 |

## 梗概生成（시놉시스）

`/synopsis` 命令使用 5 个核心要素生成以情感为中心的摘要：

### 5 个核心要素（시놉시스 5요소）

1. **주인공 태도 요약**（主角态度摘要）
   - 主角如何面对生活/爱情/冲突
   - 他们的核心情感立场
   - 示例："새랑은 상실을 예방하기 위해 먼저 포기하는 사람"

2. **관계 핵심 구도**（核心关系结构）
   - 推动故事的中心动态
   - 权力失衡和张力
   - 示例："사랑받는 자와 사랑하는 자의 불균형"

3. **정서적 테마**（情感主题）
   - 故事唤起的感受
   - 不是情节，而是情感真相
   - 示例："손에 쥔 행복을 믿지 못하는 불안"

4. **장르 vs 실제감정 대비**（类型 vs 真实情感对比）
   - 表面类型期望 vs 实际情感内容
   - 示例："로맨스지만 본질은 자기수용 서사"

5. **엔딩 정서 잔상**（结局情感余韵）
   - 故事结束后的挥之不去的感受
   - 示例："씁쓸한 안도, 불완전한 해피엔딩의 여운"

## 角色验证（캐릭터 검증）

`/validate` 命令检查对话是否符合角色已建立的声音。

### 检查内容

| 检查 | 描述 |
|------|------|
| **语言等级** | 正式程度是否匹配？（반말/존댓말/해체） |
| **语气匹配** | 情感基调是否合适？ |
| **关键词使用** | 使用了特征词吗？ |
| **禁忌违反** | 使用了禁用词吗？ |
| **情感范围** | 在角色基线范围内吗？ |
| **情境适合** | 对关系和场景是否合适？ |

### 验证结果

- **PASS**：对话与角色一致
- **WARN**：轻微不一致，可能是有意为之
- **FAIL**：与已建立声音有显著偏差

**示例：**
```
/writer-memory validate 새랑 "사랑해, 해랑아. 너무 보고싶었어."
```
输出：
```
[FAIL] 새랑 validation failed:
- TABOO: "사랑해" - character avoids direct declarations
- TABOO: "보고싶었어" - character suppresses longing expressions
- TONE: Too emotionally direct for 새랑's 담백 style

Suggested alternatives:
- "...왔네." (minimal acknowledgment)
- "늦었다." (deflection to external fact)
- "밥 먹었어?" (care expressed through practical concern)
```

## 上下文查询（맥락 질의）

对记忆进行自然语言查询，完全支持韩语。

### 示例查询

```
/writer-memory query "새랑은 이 상황에서 뭐라고 할까?"
/writer-memory query "규리의 현재 감정 상태는?"
/writer-memory query "해랑과 새랑의 관계는 어디까지 왔나?"
/writer-memory query "이 장면의 정서적 분위기는?"
/writer-memory query "새랑이 먼저 연락하는 게 맞아?"
/writer-memory query "해랑이 화났을 때 말투는?"
```

系统从所有相关记忆类型中综合答案。

## 行为

1. **初始化时**：创建带项目元数据和空集合的 `.writer-memory/memory.json`
2. **自动备份**：修改前将变更备份到 `.writer-memory/backups/`
3. **韩语优先**：情感词汇全程使用韩语术语
4. **Session 加载**：session 开始时加载记忆以提供即时上下文
5. **Git 友好**：JSON 格式化以便干净的 diff 和协作

## 集成

### 与 OMC Notepad 系统
Writer Memory 与 `.omc/notepad.md` 集成：
- 场景想法可以作为笔记捕获
- 分析 session 中的角色洞察被保留
- notepad 和记忆之间的交叉引用

### 与 Architect Agent
对于复杂的角色分析：
```
Task(subagent_type="ultrapower:architect",
     model="opus",
     prompt="Analyze 새랑's arc across all scenes...")
```

### 角色验证 Pipeline
验证从以下来源提取上下文：
- 角色记忆（语气、关键词、禁忌）
- 关系记忆（与对话伙伴的动态）
- 场景记忆（当前情感上下文）
- 主题记忆（作者意图）

## 提示

1. **从角色开始**：在场景之前构建角色记忆
2. **关键场景后更新关系**：积极跟踪演变
3. **写作时使用验证**：尽早发现声音不一致
4. **困难场景前查询**：让系统提醒你上下文
5. **定期生成梗概**：定期生成以检查主题连贯性
6. **重大变更前备份**：重大故事转折前使用 `/backup`

## 故障排除

**记忆未加载？**
- 检查 `.writer-memory/memory.json` 是否存在
- 验证 JSON 语法是否有效
- 运行 `/writer-memory status` 进行诊断

**验证太严格？**
- 检查禁忌列表中是否有意外条目
- 考虑角色是否在成长（弧线进展）
- 有意打破模式对戏剧性时刻是有效的

**查询找不到上下文？**
- 确保相关数据在记忆中
- 尝试更具体的查询
- 检查角色名称是否完全匹配
