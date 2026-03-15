import { execSync } from 'child_process';
export async function updateCommand() {
    console.log('🔄 Updating ultrapower...');
    try {
        execSync('npm install -g @liangjie559567/ultrapower@latest', {
            stdio: 'inherit',
            encoding: 'utf-8'
        });
        console.log('✅ Update complete! Run "omc setup" to reconcile hooks.');
    }
    catch (error) {
        console.error('❌ Update failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
//# sourceMappingURL=update.js.map