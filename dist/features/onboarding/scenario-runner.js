export class ScenarioRunner {
    scenario;
    constructor(scenario) {
        this.scenario = scenario;
    }
    async run() {
        console.log(`\n=== ${this.scenario.title} ===`);
        console.log(this.scenario.description);
        for (const step of this.scenario.steps) {
            const success = await this.runStep(step);
            if (!success)
                return false;
        }
        return true;
    }
    async runStep(step) {
        console.log(`\n[${step.id}] ${step.title}`);
        console.log(step.instruction);
        if (step.example) {
            console.log(`\n示例：\n  ${step.example}\n`);
        }
        console.log(`验证：${step.validation}`);
        console.log('✓ 步骤完成');
        return true;
    }
}
//# sourceMappingURL=scenario-runner.js.map