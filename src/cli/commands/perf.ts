import { Command } from 'commander';
import { Dashboard } from '../../monitoring/dashboard.js';

export const perfCommand = new Command('perf')
  .description('Performance monitoring dashboard')
  .option('-h, --hours <hours>', 'Time window in hours', '24')
  .option('--baseline', 'Set current metrics as baseline')
  .option('--export <format>', 'Export metrics (json|csv)')
  .option('--output <path>', 'Output file path')
  .option('--type <type>', 'Metric type for CSV export')
  .action((options) => {
    const dashboard = new Dashboard();

    if (options.baseline) {
      dashboard.setBaselines();
      return;
    }

    if (options.export) {
      const format = options.export as 'json' | 'csv';
      const output = options.output || `.omc/metrics/export.${format}`;
      dashboard.export(format, output, options.type);
      return;
    }

    const hours = parseInt(options.hours, 10);
    dashboard.display(hours);
  });
