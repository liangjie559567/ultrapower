import { auditLogger } from './logger.js';
async function main() {
    const result = await auditLogger.verify();
    console.log(`Audit log verification:`);
    console.log(`  Valid entries: ${result.valid}`);
    console.log(`  Invalid entries: ${result.invalid}`);
    process.exit(result.invalid > 0 ? 1 : 0);
}
main();
//# sourceMappingURL=verify-cli.js.map