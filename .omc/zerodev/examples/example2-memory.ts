// ZeroDev 示例 2: 项目记忆集成
import { detectPlatform } from '../../../src/agents/zerodev/requirement-clarifier';

async function example2() {
  console.log('=== 示例 2: 项目记忆集成 ===\n');

  // 场景 1: 无项目记忆
  const platform1 = detectPlatform('做个应用');
  console.log(`无记忆: ${platform1}`); // 'web' (默认)

  // 场景 2: 有项目记忆
  const projectMemory = {
    techStack: ['React Native', 'TypeScript']
  };
  const platform2 = detectPlatform('做个应用', projectMemory);
  console.log(`有记忆: ${platform2}`); // 'mobile' (从技术栈推断)

  // 场景 3: Electron 推断 desktop
  const platform3 = detectPlatform('做个应用', {
    techStack: ['Electron', 'TypeScript']
  });
  console.log(`Electron: ${platform3}`); // 'desktop'
}

example2().catch(console.error);
