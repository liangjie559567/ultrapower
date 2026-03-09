/**
 * reflection-cleanup.ts — 一次性反思日志清理脚本
 *
 * 功能：
 * 1. 备份原文件至 reflection_log_backup_YYYYMMDD.md
 * 2. 移除所有 isEmpty === true 的空条目
 * 3. 使用 atomicWriteFileSync 写回主文件
 *
 * 用法：人工触发，非自动 hook 集成。
 */

import * as fs from 'fs';
import * as path from 'path';
import { atomicWriteFileSync } from '../../lib/atomic-write.js';
import { parseReflectionLog, ReflectionBlock } from './reflection-parser.js';

/**
 * 获取当前日期字符串，格式 YYYYMMDD
 */
function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * 清理反思日志：移除空条目并备份原文件。
 *
 * @param baseDir 项目根目录（含 .omc/axiom/ 子目录）
 * @returns 清理结果摘要
 */
export async function cleanupReflectionLog(
  baseDir: string
): Promise<{ removed: number; kept: number; backupPath: string }> {
  const reflectionLog = path.join(baseDir, '.omc/axiom/reflection_log.md');
  const backupPath = path.join(
    baseDir,
    '.omc/axiom',
    `reflection_log_backup_${getTodayString()}.md`
  );

  // 读取原文件
  const originalContent = await fs.promises.readFile(reflectionLog, 'utf-8');

  // 备份原文件
  await fs.promises.copyFile(reflectionLog, backupPath);

  // 解析块列表
  const blocks = parseReflectionLog(originalContent);

  // 分离有效块与空块
  const keptBlocks = blocks.filter((b: ReflectionBlock) => !b.isEmpty);
  const removed = blocks.length - keptBlocks.length;
  const kept = keptBlocks.length;

  // 提取文件头（"# Reflection Log" 标题行及其前导内容）
  const lines = originalContent.split('\n');
  const firstBlockStart = lines.findIndex((line) => /^## 反思/.test(line));
  const headerLines = firstBlockStart > 0 ? lines.slice(0, firstBlockStart) : [];
  const header = headerLines.join('\n');

  // 重建文件内容：文件头 + 非空块 rawContent 拼接
  let newContent: string;
  if (header.trim().length > 0) {
    newContent = header.trimEnd() + '\n\n' + keptBlocks.map((b) => b.rawContent).join('\n') + '\n';
  } else {
    newContent = keptBlocks.map((b) => b.rawContent).join('\n') + '\n';
  }

  // 原子写回主文件
  atomicWriteFileSync(reflectionLog, newContent);

  console.log(`[清理] 已移除 ${removed} 条空条目，保留 ${kept} 条有效反思`);

  return { removed, kept, backupPath };
}
