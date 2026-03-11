import { Command } from 'commander';
import { getTokenTracker } from '../../analytics/token-tracker.js';
import { colors, renderTable, formatCostWithColor, formatTokenCount } from '../utils/formatting.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('commands:agents');
export async function agentsCommand(options) {
    const tracker = getTokenTracker();
    const stats = tracker.getSessionStats();
    // Use getTopAgentsAllSessions to read from file rather than in-memory session stats
    const topAgents = await tracker.getTopAgentsAllSessions(options.limit || 10);
    if (options.json) {
        logger.info(JSON.stringify({ topAgents, stats }, null, 2));
        return;
    }
    logger.info(colors.bold('\n🤖 Agent Usage Breakdown\n'));
    if (topAgents.length === 0) {
        logger.info(colors.gray('No agent data available yet.'));
        logger.info(colors.gray('Run `omc backfill` to extract agent usage from Claude transcripts.\n'));
        return;
    }
    const agentData = topAgents.map(agent => ({
        agent: agent.agent,
        tokens: formatTokenCount(agent.tokens),
        cost: agent.cost
    }));
    const table = renderTable(agentData, [
        { header: 'Agent', field: 'agent', width: 35 },
        { header: 'Tokens', field: 'tokens', width: 12, align: 'right' },
        { header: 'Cost', field: 'cost', width: 12, align: 'right', format: (v) => formatCostWithColor(v) }
    ]);
    logger.info(table);
    logger.info('');
}
export function createAgentsCommand() {
    return new Command('agents')
        .description('Show agent usage breakdown')
        .option('--json', 'Output as JSON')
        .option('--limit <n>', 'Limit number of agents', '10')
        .action(agentsCommand);
}
//# sourceMappingURL=agents.js.map