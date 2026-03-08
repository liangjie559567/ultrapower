#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

const fix = process.argv.includes('--fix');

const findMdFiles = (dir, files = []) => {
  try {
    for (const f of readdirSync(dir)) {
      const path = join(dir, f);
      if (statSync(path).isDirectory() && !f.startsWith('.') && f !== 'node_modules') {
        findMdFiles(path, files);
      } else if (f.endsWith('.md')) {
        files.push(path);
      }
    }
  } catch {}
  return files;
};

const extractLinks = (content, filePath) => {
  const links = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const [, text, url] = match;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      links.push({ text, url, line: content.substring(0, match.index).split('\n').length });
    }
  }

  return links;
};

const checkLink = (link, fromFile) => {
  const [path, anchor] = link.split('#');
  const baseDir = dirname(fromFile);
  const targetPath = path ? resolve(baseDir, path) : fromFile;

  if (!existsSync(targetPath)) {
    return { valid: false, reason: 'File not found' };
  }

  if (anchor) {
    try {
      const content = readFileSync(targetPath, 'utf8');
      const anchorPattern = new RegExp(`^#{1,6}\\s+.*${anchor.replace(/-/g, '[-\\s]')}`, 'im');
      if (!anchorPattern.test(content)) {
        return { valid: false, reason: 'Anchor not found' };
      }
    } catch {
      return { valid: false, reason: 'Cannot read file' };
    }
  }

  return { valid: true };
};

try {
  const files = findMdFiles('.');
  let brokenCount = 0;
  let fixedCount = 0;

  console.log(`🔍 Checking ${files.length} markdown files...\n`);

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const links = extractLinks(content, file);

    for (const { text, url, line } of links) {
      const result = checkLink(url, file);

      if (!result.valid) {
        console.log(`❌ ${file}:${line}`);
        console.log(`   Link: [${text}](${url})`);
        console.log(`   Error: ${result.reason}\n`);
        brokenCount++;

        if (fix) {
          // 尝试简单修复：移除不存在的相对路径前缀
          const simplified = url.replace(/^\.\.\//, '').replace(/^\.\//, '');
          if (checkLink(simplified, file).valid) {
            const updated = content.replace(`](${url})`, `](${simplified})`);
            writeFileSync(file, updated, 'utf8');
            console.log(`   ✓ Fixed: ${simplified}\n`);
            fixedCount++;
          }
        }
      }
    }
  }

  if (brokenCount === 0) {
    console.log('✅ All links are valid!\n');
  } else {
    console.log(`${fix ? '✅' : '📋'} Found ${brokenCount} broken link(s)${fix ? `, fixed ${fixedCount}` : ''}\n`);
    if (!fix && brokenCount > fixedCount) {
      console.log('Run with --fix to attempt automatic fixes\n');
    }
  }

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
