# Skill 编写最佳实践

> 学习如何编写有效的 Skill，使 Claude 能够成功发现和使用它们。

好的 Skill 简洁、结构良好，并经过真实使用测试。本指南提供实用的编写决策，帮助你编写 Claude 能够有效发现和使用的 Skill。

有关 Skill 工作原理的概念背景，请参阅 [Skills 概述](/en/docs/agents-and-tools/agent-skills/overview)。

## 核心原则

### 简洁是关键

[context window](https://platform.claude.com/docs/en/build-with-claude/context-windows) 是公共资源。你的 Skill 与 Claude 需要了解的所有其他内容共享 context window，包括：

* 系统提示
* 对话历史
* 其他 Skill 的元数据
* 你的实际请求

并非 Skill 中的每个 token 都有即时成本。启动时，只有所有 Skill 的元数据（名称和描述）被预加载。Claude 仅在 Skill 变得相关时才读取 SKILL.md，并仅在需要时读取其他文件。然而，在 SKILL.md 中保持简洁仍然重要：一旦 Claude 加载它，每个 token 都与对话历史和其他上下文竞争。

**默认假设**：Claude 已经非常聪明

只添加 Claude 尚未拥有的上下文。对每条信息提出质疑：

* "Claude 真的需要这个解释吗？"
* "我可以假设 Claude 知道这个吗？"
* "这段话值得其 token 成本吗？"

**好示例：简洁**（约 50 个 token）：

````markdown
## 提取 PDF 文本

使用 pdfplumber 进行文本提取：

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**坏示例：过于冗长**（约 150 个 token）：

```markdown
## 提取 PDF 文本

PDF（便携式文档格式）文件是一种常见的文件格式，包含
文本、图像和其他内容。要从 PDF 中提取文本，你需要
使用一个库。有许多可用于 PDF 处理的库，但我们
推荐 pdfplumber，因为它易于使用且能处理大多数情况。
首先，你需要使用 pip 安装它。然后你可以使用下面的代码...
```

简洁版本假设 Claude 知道什么是 PDF 以及库如何工作。

### 设置适当的自由度

将具体程度与任务的脆弱性和可变性相匹配。

**高自由度**（基于文本的指令）：

使用时机：

* 多种方法都有效
* 决策取决于上下文
* 启发式方法指导方式

示例：

```markdown
## 代码审查流程

1. 分析代码结构和组织
2. 检查潜在的 bug 或边缘情况
3. 建议提高可读性和可维护性的改进
4. 验证是否符合项目约定
```

**中等自由度**（带参数的伪代码或脚本）：

使用时机：

* 存在首选模式
* 可以接受一些变化
* 配置影响行为

示例：

````markdown
## 生成报告

使用此模板并根据需要自定义：

```python
def generate_report(data, format="markdown", include_charts=True):
    # 处理数据
    # 以指定格式生成输出
    # 可选地包含可视化
```
````

**低自由度**（特定脚本，少量或无参数）：

使用时机：

* 操作脆弱且容易出错
* 一致性至关重要
* 必须遵循特定顺序

示例：

````markdown
## 数据库迁移

精确运行此脚本：

```bash
python scripts/migrate.py --verify --backup
```

不要修改命令或添加额外标志。
````

**类比**：将 Claude 想象为探索路径的机器人：

* **两侧有悬崖的窄桥**：只有一条安全的前进路径。提供具体的护栏和精确指令（低自由度）。示例：必须按精确顺序运行的数据库迁移。
* **没有危险的开阔田野**：许多路径都能成功。给出大方向并信任 Claude 找到最佳路线（高自由度）。示例：上下文决定最佳方法的代码审查。

### 使用你计划使用的所有模型进行测试

Skill 作为模型的补充，因此有效性取决于底层模型。使用你计划使用的所有模型测试你的 Skill。

**按模型的测试考虑**：

* **Claude Haiku**（快速、经济）：Skill 是否提供了足够的指导？
* **Claude Sonnet**（平衡）：Skill 是否清晰高效？
* **Claude Opus**（强大推理）：Skill 是否避免了过度解释？

对 Opus 完美有效的内容可能需要为 Haiku 提供更多细节。如果你计划在多个模型中使用 Skill，目标是编写对所有模型都有效的指令。

## Skill 结构

<Note>
  **YAML Frontmatter**：SKILL.md frontmatter 支持两个字段：

  * `name` - Skill 的人类可读名称（最多 64 个字符）
  * `description` - Skill 功能及使用时机的单行描述（最多 1024 个字符）

  有关完整的 Skill 结构详情，请参阅 [Skills 概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure)。
</Note>

### 命名约定

使用一致的命名模式使 Skill 更易于引用和讨论。我们建议使用**动名词形式**（动词 + -ing）命名 Skill，因为这清楚地描述了 Skill 提供的活动或能力。

**好的命名示例（动名词形式）**：

* "Processing PDFs"
* "Analyzing spreadsheets"
* "Managing databases"
* "Testing code"
* "Writing documentation"

**可接受的替代方案**：

* 名词短语："PDF Processing"、"Spreadsheet Analysis"
* 动作导向："Process PDFs"、"Analyze Spreadsheets"

**避免**：

* 模糊名称："Helper"、"Utils"、"Tools"
* 过于通用："Documents"、"Data"、"Files"
* 在 skill 集合中使用不一致的模式

一致的命名使以下操作更容易：

* 在文档和对话中引用 Skill
* 一眼了解 Skill 的功能
* 组织和搜索多个 Skill
* 维护专业、统一的 skill 库

### 编写有效的描述

`description` 字段启用 Skill 发现，应包括 Skill 的功能和使用时机。

<Warning>
  **始终使用第三人称**。描述被注入到系统提示中，不一致的视角可能导致发现问题。

  * **好：** "Processes Excel files and generates reports"
  * **避免：** "I can help you process Excel files"
  * **避免：** "You can use this to process Excel files"
</Warning>

**具体且包含关键词**。包括 Skill 的功能以及使用它的具体触发器/上下文。

每个 Skill 只有一个描述字段。描述对于 skill 选择至关重要：Claude 使用它从可能超过 100 个可用 Skill 中选择正确的 Skill。你的描述必须提供足够的细节，让 Claude 知道何时选择此 Skill，而 SKILL.md 的其余部分提供实现细节。

有效示例：

**PDF Processing skill：**

```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Excel Analysis skill：**

```yaml
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Git Commit Helper skill：**

```yaml
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

避免如下模糊描述：

```yaml
description: Helps with documents
```

```yaml
description: Processes data
```

```yaml
description: Does stuff with files
```

### 渐进式披露模式

SKILL.md 作为概述，根据需要将 Claude 指向详细材料，就像入职指南中的目录。有关渐进式披露工作原理的说明，请参阅概述中的 [Skills 工作原理](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

**实用指导：**

* 保持 SKILL.md 正文在 500 行以内以获得最佳性能
* 接近此限制时将内容拆分为单独文件
* 使用以下模式有效组织指令、代码和资源

#### 完整的 Skill 目录结构示例：

```
pdf/
├── SKILL.md              # 主要指令（触发时加载）
├── FORMS.md              # 表单填写指南（按需加载）
├── reference.md          # API 参考（按需加载）
├── examples.md           # 使用示例（按需加载）
└── scripts/
    ├── analyze_form.py   # 工具脚本（执行，不加载）
    ├── fill_form.py      # 表单填写脚本
    └── validate.py       # 验证脚本
```

#### 模式 1：带引用的高级指南

````markdown
---
name: PDF Processing
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

# PDF Processing

## Quick start

Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Advanced features

**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
**Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
````

Claude 仅在需要时加载 FORMS.md、REFERENCE.md 或 EXAMPLES.md。

#### 模式 2：领域特定组织

对于具有多个领域的 Skill，按领域组织内容以避免加载不相关的上下文。当用户询问销售指标时，Claude 只需要读取与销售相关的 schema，而不是财务或营销数据。这保持了低 token 使用量和聚焦的上下文。

```
bigquery-skill/
├── SKILL.md（概述和导航）
└── reference/
    ├── finance.md（收入、账单指标）
    ├── sales.md（机会、管道）
    ├── product.md（API 使用、功能）
    └── marketing.md（活动、归因）
```

#### 模式 3：条件详情

显示基本内容，链接到高级内容：

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

Claude 仅在用户需要这些功能时才读取 REDLINING.md 或 OOXML.md。

### 避免深层嵌套引用

当文件从其他被引用文件中被引用时，Claude 可能会部分读取文件。遇到嵌套引用时，Claude 可能使用 `head -100` 等命令预览内容而不是读取完整文件，导致信息不完整。

**保持引用从 SKILL.md 起只有一层深**。所有引用文件应直接从 SKILL.md 链接，以确保 Claude 在需要时读取完整文件。

**坏示例：太深**：

```markdown
# SKILL.md
See [advanced.md](advanced.md)...

# advanced.md
See [details.md](details.md)...

# details.md
Here's the actual information...
```

**好示例：一层深**：

```markdown
# SKILL.md

**Basic usage**: [instructions in SKILL.md]
**Advanced features**: See [advanced.md](advanced.md)
**API reference**: See [reference.md](reference.md)
**Examples**: See [examples.md](examples.md)
```

### 为较长的参考文件添加目录

对于超过 100 行的参考文件，在顶部包含目录。这确保 Claude 即使在部分读取时也能看到可用信息的完整范围。

**示例**：

```markdown
# API Reference

## Contents
- Authentication and setup
- Core methods (create, read, update, delete)
- Advanced features (batch operations, webhooks)
- Error handling patterns
- Code examples

## Authentication and setup
...

## Core methods
...
```

Claude 可以根据需要读取完整文件或跳转到特定部分。

## 工作流与反馈循环

### 对复杂任务使用工作流

将复杂操作分解为清晰的顺序步骤。对于特别复杂的工作流，提供一个 Claude 可以复制到响应中并逐步勾选的清单。

**示例 1：研究综合工作流**（适用于无代码的 Skill）：

````markdown
## 研究综合工作流

复制此清单并跟踪进度：

```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```

**Step 1: Read all source documents**

Review each document in the `sources/` directory. Note the main arguments and supporting evidence.

**Step 2: Identify key themes**

Look for patterns across sources. What themes appear repeatedly? Where do sources agree or disagree?

**Step 3: Cross-reference claims**

For each major claim, verify it appears in the source material. Note which source supports each point.

**Step 4: Create structured summary**

Organize findings by theme. Include:
- Main claim
- Supporting evidence from sources
- Conflicting viewpoints (if any)

**Step 5: Verify citations**

Check that every claim references the correct source document. If citations are incomplete, return to Step 3.
````

**示例 2：PDF 表单填写工作流**（适用于有代码的 Skill）：

````markdown
## PDF form filling workflow

Copy this checklist and check off items as you complete them:

```
Task Progress:
- [ ] Step 1: Analyze the form (run analyze_form.py)
- [ ] Step 2: Create field mapping (edit fields.json)
- [ ] Step 3: Validate mapping (run validate_fields.py)
- [ ] Step 4: Fill the form (run fill_form.py)
- [ ] Step 5: Verify output (run verify_output.py)
```

**Step 1: Analyze the form**

Run: `python scripts/analyze_form.py input.pdf`

**Step 2: Create field mapping**

Edit `fields.json` to add values for each field.

**Step 3: Validate mapping**

Run: `python scripts/validate_fields.py fields.json`

Fix any validation errors before continuing.

**Step 4: Fill the form**

Run: `python scripts/fill_form.py input.pdf fields.json output.pdf`

**Step 5: Verify output**

Run: `python scripts/verify_output.py output.pdf`

If verification fails, return to Step 2.
````

清晰的步骤防止 Claude 跳过关键验证。清单帮助 Claude 和你跟踪多步骤工作流的进度。

### 实现反馈循环

**常见模式**：运行验证器 → 修复错误 → 重复

此模式大大提高了输出质量。

**示例 1：风格指南合规**（适用于无代码的 Skill）：

```markdown
## Content review process

1. Draft your content following the guidelines in STYLE_GUIDE.md
2. Review against the checklist:
   - Check terminology consistency
   - Verify examples follow the standard format
   - Confirm all required sections are present
3. If issues found:
   - Note each issue with specific section reference
   - Revise the content
   - Review the checklist again
4. Only proceed when all requirements are met
5. Finalize and save the document
```

**示例 2：文档编辑流程**（适用于有代码的 Skill）：

```markdown
## Document editing process

1. Make your edits to `word/document.xml`
2. **Validate immediately**: `python ooxml/scripts/validate.py unpacked_dir/`
3. If validation fails:
   - Review the error message carefully
   - Fix the issues in the XML
   - Run validation again
4. **Only proceed when validation passes**
5. Rebuild: `python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. Test the output document
```

验证循环能早期捕获错误。

## 内容指南

### 避免时间敏感信息

不要包含会过时的信息：

**坏示例：时间敏感**（会变错）：

```markdown
If you're doing this before August 2025, use the old API.
After August 2025, use the new API.
```

**好示例**（使用"旧模式"部分）：

```markdown
## Current method

Use the v2 API endpoint: `api.example.com/v2/messages`

## Old patterns

<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>

The v1 API used: `api.example.com/v1/messages`

This endpoint is no longer supported.
</details>
```

旧模式部分提供历史上下文而不使主要内容杂乱。

### 使用一致的术语

选择一个术语并在整个 Skill 中使用：

**好——一致**：

* 始终使用 "API endpoint"
* 始终使用 "field"
* 始终使用 "extract"

**坏——不一致**：

* 混用 "API endpoint"、"URL"、"API route"、"path"
* 混用 "field"、"box"、"element"、"control"
* 混用 "extract"、"pull"、"get"、"retrieve"

一致性帮助 Claude 理解和遵循指令。

## 常见模式

### 模板模式

为输出格式提供模板。将严格程度与需求相匹配。

**对于严格要求**（如 API 响应或数据格式）：

````markdown
## Report structure

ALWAYS use this exact template structure:

```markdown
# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```
````

**对于灵活指导**（当适应有用时）：

````markdown
## Report structure

Here is a sensible default format, but use your best judgment based on the analysis:

```markdown
# [Analysis Title]

## Executive summary
[Overview]

## Key findings
[Adapt sections based on what you discover]

## Recommendations
[Tailor to the specific context]
```

Adjust sections as needed for the specific analysis type.
````

### 示例模式

对于输出质量依赖于看到示例的 Skill，提供输入/输出对，就像在常规提示中一样：

````markdown
## Commit message format

Generate commit messages following these examples:

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly in reports
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

Follow this style: type(scope): brief description, then detailed explanation.
````

示例帮助 Claude 比单独的描述更清楚地理解所需的风格和细节程度。

### 条件工作流模式

引导 Claude 通过决策点：

```markdown
## Document modification workflow

1. Determine the modification type:

   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow:
   - Use docx-js library
   - Build document from scratch
   - Export to .docx format

3. Editing workflow:
   - Unpack existing document
   - Modify XML directly
   - Validate after each change
   - Repack when complete
```

如果工作流变得庞大或复杂，步骤很多，考虑将它们推入单独的文件，并告诉 Claude 根据手头的任务读取适当的文件。

## 评估与迭代

### 先构建评估

**在编写大量文档之前先创建评估。** 这确保你的 Skill 解决真实问题，而不是记录想象中的问题。

**评估驱动开发：**

1. **识别差距**：在没有 Skill 的情况下让 Claude 运行代表性任务。记录具体的失败或缺失的上下文
2. **创建评估**：构建三个测试这些差距的场景
3. **建立基线**：衡量没有 Skill 时 Claude 的表现
4. **编写最小指令**：创建足够解决差距并通过评估的内容
5. **迭代**：执行评估，与基线比较，并改进

此方法确保你解决实际问题，而不是预测可能永远不会出现的需求。

**评估结构**：

```json
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using an appropriate PDF processing library or command-line tool",
    "Extracts text content from all pages in the document without missing any pages",
    "Saves the extracted text to a file named output.txt in a clear, readable format"
  ]
}
```

### 与 Claude 迭代开发 Skill

最有效的 Skill 开发过程涉及 Claude 本身。与一个 Claude 实例（"Claude A"）合作创建将被其他实例（"Claude B"）使用的 Skill。Claude A 帮助你设计和改进指令，而 Claude B 在真实任务中测试它们。

**创建新 Skill：**

1. **在没有 Skill 的情况下完成任务**：与 Claude A 通过正常提示解决问题。在工作过程中，你会自然地提供上下文、解释偏好并分享程序性知识。注意你反复提供的信息。

2. **识别可复用模式**：完成任务后，识别你提供的哪些上下文对类似的未来任务有用。

3. **请 Claude A 创建 Skill**："创建一个捕获我们刚刚使用的 BigQuery 分析模式的 Skill。包括表 schema、命名约定以及关于过滤测试账户的规则。"

4. **检查简洁性**：检查 Claude A 是否添加了不必要的解释。问："删除关于什么是胜率的解释——Claude 已经知道了。"

5. **改进信息架构**：请 Claude A 更有效地组织内容。例如："将表 schema 组织到单独的参考文件中。我们以后可能会添加更多表。"

6. **在类似任务上测试**：使用 Claude B（加载了 Skill 的新实例）在相关用例上使用 Skill。观察 Claude B 是否找到正确信息、正确应用规则并成功处理任务。

7. **根据观察迭代**：如果 Claude B 遇到困难或遗漏了某些内容，带着具体情况返回 Claude A："当 Claude 使用此 Skill 时，它忘记按 Q4 日期过滤。我们应该添加关于日期过滤模式的部分吗？"

### 观察 Claude 如何导航 Skill

在迭代 Skill 时，注意 Claude 在实践中实际如何使用它们。注意：

* **意外的探索路径**：Claude 是否以你未预期的顺序读取文件？这可能表明你的结构不如你想象的直观
* **错过的连接**：Claude 是否未能跟随对重要文件的引用？你的链接可能需要更明确或更突出
* **对某些部分的过度依赖**：如果 Claude 反复读取同一文件，考虑该内容是否应该在主 SKILL.md 中
* **被忽略的内容**：如果 Claude 从不访问某个捆绑文件，它可能是不必要的或在主指令中信号不足

根据这些观察而非假设进行迭代。Skill 元数据中的 `name` 和 `description` 尤为关键。Claude 在决定是否触发 Skill 以响应当前任务时使用这些。确保它们清楚地描述 Skill 的功能和使用时机。

## 要避免的反模式

### 避免 Windows 风格路径

在文件路径中始终使用正斜杠，即使在 Windows 上：

* ✓ **好**：`scripts/helper.py`、`reference/guide.md`
* ✗ **避免**：`scripts\helper.py`、`reference\guide.md`

Unix 风格路径在所有平台上都有效，而 Windows 风格路径在 Unix 系统上会导致错误。

### 避免提供太多选项

除非必要，不要呈现多种方法：

````markdown
**坏示例：太多选择**（令人困惑）：
"You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or..."

**好示例：提供默认值**（带逃生舱）：
"Use pdfplumber for text extraction:
```python
import pdfplumber
```

For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."
````

## 高级：带可执行代码的 Skill

以下部分专注于包含可执行脚本的 Skill。如果你的 Skill 只使用 markdown 指令，请跳至[有效 Skill 的清单](#checklist-for-effective-skills)。

### 解决问题，而非推卸责任

为 Skill 编写脚本时，处理错误条件而不是推卸给 Claude。

**好示例：明确处理错误**：

```python
def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        # Create file with default content instead of failing
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        # Provide alternative instead of failing
        print(f"Cannot access {path}, using default")
        return ''
```

**坏示例：推卸给 Claude**：

```python
def process_file(path):
    # Just fail and let Claude figure it out
    return open(path).read()
```

配置参数也应该有理由和文档，以避免"魔法常量"（Ousterhout 定律）。

**好示例：自文档化**：

```python
# HTTP requests typically complete within 30 seconds
# Longer timeout accounts for slow connections
REQUEST_TIMEOUT = 30

# Three retries balances reliability vs speed
# Most intermittent failures resolve by the second retry
MAX_RETRIES = 3
```

**坏示例：魔法数字**：

```python
TIMEOUT = 47  # Why 47?
RETRIES = 5   # Why 5?
```

### 提供工具脚本

即使 Claude 可以编写脚本，预制脚本也有优势：

**工具脚本的好处**：

* 比生成的代码更可靠
* 节省 token（无需在上下文中包含代码）
* 节省时间（无需代码生成）
* 确保跨使用的一致性

**重要区别**：在指令中明确 Claude 是否应该：

* **执行脚本**（最常见）："Run `analyze_form.py` to extract fields"
* **作为参考读取**（对于复杂逻辑）："See `analyze_form.py` for the field extraction algorithm"

对于大多数工具脚本，执行是首选，因为它更可靠和高效。

### 使用视觉分析

当输入可以渲染为图像时，让 Claude 分析它们：

````markdown
## Form layout analysis

1. Convert PDF to images:
   ```bash
   python scripts/pdf_to_images.py form.pdf
   ```

2. Analyze each page image to identify form fields
3. Claude can see field locations and types visually
````

Claude 的视觉能力有助于理解布局和结构。

### 创建可验证的中间输出

当 Claude 执行复杂的开放式任务时，它可能会犯错误。"计划-验证-执行"模式通过让 Claude 首先以结构化格式创建计划，然后在执行之前用脚本验证该计划来早期捕获错误。

**为何此模式有效：**

* **早期捕获错误**：验证在应用更改之前发现问题
* **机器可验证**：脚本提供客观验证
* **可逆规划**：Claude 可以在不触及原件的情况下迭代计划
* **清晰调试**：错误消息指向具体问题

**使用时机**：批量操作、破坏性更改、复杂验证规则、高风险操作。

### 包依赖

Skill 在具有平台特定限制的代码执行环境中运行：

* **claude.ai**：可以从 npm 和 PyPI 安装包，并从 GitHub 仓库拉取
* **Anthropic API**：没有网络访问，没有运行时包安装

在 SKILL.md 中列出所需包，并验证它们在[代码执行工具文档](/en/docs/agents-and-tools/tool-use/code-execution-tool)中可用。

### MCP 工具引用

如果你的 Skill 使用 MCP（Model Context Protocol）工具，始终使用完全限定的工具名称以避免"工具未找到"错误。

**格式**：`ServerName:tool_name`

**示例**：

```markdown
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
Use the GitHub:create_issue tool to create issues.
```

### 避免假设工具已安装

不要假设包可用：

````markdown
**坏示例：假设已安装**：
"Use the pdf library to process the file."

**好示例：明确依赖**：
"Install required package: `pip install pypdf`

Then use it:
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```"
````

## 有效 Skill 的清单

分享 Skill 前，验证：

### 核心质量

* [ ] 描述具体且包含关键词
* [ ] 描述包括 Skill 的功能和使用时机
* [ ] SKILL.md 正文在 500 行以内
* [ ] 额外细节在单独文件中（如需要）
* [ ] 无时间敏感信息（或在"旧模式"部分）
* [ ] 整个 Skill 使用一致的术语
* [ ] 示例具体而非抽象
* [ ] 文件引用只有一层深
* [ ] 适当使用渐进式披露
* [ ] 工作流有清晰步骤

### 代码和脚本

* [ ] 脚本解决问题而非推卸给 Claude
* [ ] 错误处理明确且有帮助
* [ ] 无"魔法常量"（所有值都有理由）
* [ ] 所需包在指令中列出并验证可用
* [ ] 脚本有清晰文档
* [ ] 无 Windows 风格路径（全部正斜杠）
* [ ] 关键操作包含验证/核实步骤
* [ ] 质量关键任务包含反馈循环

### 测试

* [ ] 至少创建了三个评估
* [ ] 使用 Haiku、Sonnet 和 Opus 测试
* [ ] 使用真实使用场景测试
* [ ] 已纳入团队反馈（如适用）
