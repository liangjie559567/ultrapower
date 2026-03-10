import { Command } from 'commander';
import { getQueryEngine } from '../../analytics/query-engine.js';
import { getSessionManager } from '../../analytics/session-manager.js';
import { exportCostReport, exportSessionHistory, exportUsagePatterns, ExportFormat } from '../../analytics/export.js';
import { colors } from '../utils/formatting.js';

export async function exportCommand(
  type: 'cost' | 'sessions' | 'patterns',
  format: ExportFormat,
  outputPath: string,
  options: { period?: 'daily' | 'weekly' | 'monthly' }
): Promise<void> {
  const engine = getQueryEngine();
  const manager = getSessionManager();

  console.log(colors.bold(`\n📤 Exporting ${type} data to ${format.toUpperCase()}...\n`));

  try {
    if (type === 'cost') {
      const period = options.period || 'monthly';
      const report = await engine.getCostReport(period);
      await exportCostReport(report, format, outputPath);
    } else if (type === 'sessions') {
      const history = await manager.getHistory();
      await exportSessionHistory(history, format, outputPath);
    } else if (type === 'patterns') {
      const patterns = await engine.getUsagePatterns();
      await exportUsagePatterns(patterns, format, outputPath);
    }

    console.log(colors.green(`✓ Exported to ${outputPath}\n`));
  } catch (error) {
    console.error(colors.red(`✗ Export failed: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

export function createExportCommand(): Command {
  return new Command('export')
    .argument('<type>', 'Type: cost, sessions, patterns')
    .argument('<format>', 'Format: json, csv')
    .argument('<output>', 'Output file path')
    .description('Export data (type: cost, sessions, patterns; format: json, csv)')
    .option('--period <period>', 'Period for cost export: daily, weekly, monthly', 'monthly')
    .action(exportCommand);
}
