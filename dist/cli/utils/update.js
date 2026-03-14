import { performUpgrade } from '../../lib/upgrade.js';
export async function updateCommand() {
    const result = await performUpgrade();
    console.log(`\n✅ ${result.message}`);
}
//# sourceMappingURL=update.js.map