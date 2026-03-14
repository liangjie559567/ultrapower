import { StateManager } from './state-manager.js';
import { ScenarioRunner } from './scenario-runner.js';
import { implementScenario } from './scenarios/implement.js';
import { debugScenario } from './scenarios/debug.js';
import { reviewScenario } from './scenarios/review.js';
import { refactorScenario } from './scenarios/refactor.js';
import { securityScenario } from './scenarios/security.js';
import { teamScenario } from './scenarios/team.js';
const ALL_SCENARIOS = [
    implementScenario,
    debugScenario,
    reviewScenario,
    refactorScenario,
    securityScenario,
    teamScenario
];
const WELCOME_MESSAGE = `
🎓 欢迎使用 ultrapower！

这是一个交互式教程，帮助你快速掌握核心功能：
  1. 实现功能 - 使用 autopilot 自动化开发
  2. 修复Bug - 使用 debugger 诊断问题
  3. 代码审查 - 使用多维度审查保证质量
  4. 安全重构 - 使用 architect 和 executor 重构
  5. 安全审查 - 使用 security-reviewer 扫描漏洞
  6. 团队协作 - 使用 team 模式多 agent 协作

随时输入 'skip' 跳过教程。
`;
export class TutorialEngine {
    static async checkAndRun() {
        const state = await StateManager.load();
        if (!state) {
            await this.start();
        }
        else if (!state.completed && !state.skipped) {
            await this.resume(state);
        }
    }
    static async start() {
        console.log(WELCOME_MESSAGE);
        const state = {
            completed: false,
            skipped: false,
            completedScenarios: [],
            startedAt: new Date().toISOString(),
            exitCount: 0,
            totalTimeSpent: 0
        };
        await StateManager.save(state);
        await this.runScenarios();
    }
    static async resume(state) {
        const remaining = ALL_SCENARIOS.filter(s => !state.completedScenarios.includes(s.id));
        console.log(`\n检测到未完成的教程进度：
  已完成：${state.completedScenarios.join(', ') || '无'}
  剩余：${remaining.map(s => s.title).join(', ')}

继续教程将从下一个场景开始。
`);
        await StateManager.update({ exitCount: state.exitCount + 1 });
        await this.runScenarios();
    }
    static async runScenarios() {
        const state = await StateManager.load();
        if (!state)
            return;
        for (const scenario of ALL_SCENARIOS) {
            if (state.completedScenarios.includes(scenario.id))
                continue;
            const runner = new ScenarioRunner(scenario);
            const success = await runner.run();
            if (success) {
                const updated = [...state.completedScenarios, scenario.id];
                await StateManager.update({ completedScenarios: updated });
            }
        }
        await this.complete();
    }
    static async complete() {
        await StateManager.update({
            completed: true,
            completedAt: new Date().toISOString()
        });
        console.log(`
🎉 恭喜完成教程！

你已掌握：
✓ 使用 autopilot 实现功能
✓ 使用 debugger 诊断问题
✓ 使用 code-review 保证质量
✓ 使用 architect 进行安全重构
✓ 使用 security-reviewer 扫描漏洞
✓ 使用 team 模式多 agent 协作

下一步建议：
1. 运行 /ultrapower:omc-help 查看所有命令
2. 尝试 /ultrapower:wizard 选择适合的工作流
3. 查看文档：docs/standards/user-guide.md
`);
    }
    static async skip() {
        await StateManager.update({ skipped: true });
        console.log('教程已跳过。随时运行 /ultrapower:omc-help 查看帮助。');
    }
}
//# sourceMappingURL=tutorial.js.map