import { Command } from 'commander';
export function createDoctorCommand() {
    return new Command('doctor')
        .description('Diagnose and fix common issues')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const { doctorConflictsCommand } = await import('./doctor-conflicts.js');
        await doctorConflictsCommand(options);
    });
}
//# sourceMappingURL=doctor.js.map