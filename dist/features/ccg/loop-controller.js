export class LoopController {
    async execute(config, task) {
        for (let round = 1; round <= config.maxRounds; round++) {
            try {
                const result = await Promise.race([
                    task(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), config.timeout)),
                ]);
                if (config.convergenceCheck(result)) {
                    return { completed: true, rounds: round, reason: 'converged' };
                }
            }
            catch (err) {
                if (err instanceof Error && err.message === 'timeout') {
                    return { completed: false, rounds: round, reason: 'timeout' };
                }
                throw err;
            }
        }
        return { completed: true, rounds: config.maxRounds, reason: 'max_rounds' };
    }
}
//# sourceMappingURL=loop-controller.js.map