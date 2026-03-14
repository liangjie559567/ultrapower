const ACHIEVEMENTS = [
    {
        id: 'first_autopilot',
        name: '自动驾驶员',
        description: '完成第一个 autopilot 任务',
        icon: '🚀'
    },
    {
        id: 'bug_hunter',
        name: 'Bug猎人',
        description: '成功诊断并修复问题',
        icon: '🐛'
    },
    {
        id: 'code_guardian',
        name: '代码守护者',
        description: '完成第一次代码审查',
        icon: '🛡️'
    },
    {
        id: 'tutorial_master',
        name: '教程大师',
        description: '完成所有教程场景',
        icon: '🏆'
    }
];
export function unlockAchievement(id) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
        console.log(`\n${achievement.icon} 成就解锁：${achievement.name}\n${achievement.description}\n`);
    }
}
//# sourceMappingURL=achievements.js.map