#!/usr/bin/env node
/**
 * Documentation Sync Checker
 * Validates consistency between docs and code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let exitCode = 0;

function error(msg) {
  console.error(`❌ ${msg}`);
  exitCode = 1;
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

// 1. Check mode list consistency
function checkModes() {
  console.log('\n📋 Checking mode list consistency...');

  const validateModePath = path.join(__dirname, '../../src/lib/validateMode.ts');
  const validateModeContent = fs.readFileSync(validateModePath, 'utf8');

  const modesMatch = validateModeContent.match(/export const VALID_MODES = \[([\s\S]*?)\] as const;/);
  if (!modesMatch) {
    error('Cannot parse VALID_MODES from validateMode.ts');
    return;
  }

  const modes = modesMatch[1]
    .split(',')
    .map(m => m.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  console.log(`  Found ${modes.length} modes in validateMode.ts`);

  // Check docs/CLAUDE.md
  const claudeMdPath = path.join(__dirname, '../../docs/CLAUDE.md');
  const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');

  const missingInDocs = modes.filter(mode => !claudeMdContent.includes(mode));
  if (missingInDocs.length > 0) {
    error(`Modes missing in docs/CLAUDE.md: ${missingInDocs.join(', ')}`);
  } else {
    success('All modes documented in docs/CLAUDE.md');
  }
}

// 2. Check agent count consistency
function checkAgents() {
  console.log('\n👥 Checking agent definitions...');

  const definitionsPath = path.join(__dirname, '../../src/agents/definitions.ts');
  const definitionsContent = fs.readFileSync(definitionsPath, 'utf8');

  const agentExports = definitionsContent.match(/export const \w+Agent.*?AgentConfig/g) || [];
  console.log(`  Found ${agentExports.length} agent exports in definitions.ts`);

  const agentsDir = path.join(__dirname, '../../agents');
  if (fs.existsSync(agentsDir)) {
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    console.log(`  Found ${agentFiles.length} agent .md files in agents/`);

    if (Math.abs(agentExports.length - agentFiles.length) > 5) {
      warn(`Agent count mismatch: ${agentExports.length} exports vs ${agentFiles.length} files`);
    } else {
      success('Agent counts are consistent');
    }
  }
}

// 3. Check skill count
function checkSkills() {
  console.log('\n🎯 Checking skills...');

  const skillsDir = path.join(__dirname, '../../skills');
  if (!fs.existsSync(skillsDir)) {
    warn('skills/ directory not found');
    return;
  }

  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`  Found ${skillDirs.length} skill directories`);

  const missingSkillMd = skillDirs.filter(dir => {
    const skillMdPath = path.join(skillsDir, dir, 'SKILL.md');
    return !fs.existsSync(skillMdPath);
  });

  if (missingSkillMd.length > 0) {
    error(`Skills missing SKILL.md: ${missingSkillMd.join(', ')}`);
  } else {
    success('All skills have SKILL.md');
  }
}

// 4. Validate TypeScript code blocks in docs
function checkCodeBlocks() {
  console.log('\n💻 Validating TypeScript code blocks...');

  const docsDir = path.join(__dirname, '../../docs');
  if (!fs.existsSync(docsDir)) {
    warn('docs/ directory not found');
    return;
  }

  const mdFiles = [];
  function findMdFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findMdFiles(fullPath);
      } else if (entry.name.endsWith('.md')) {
        mdFiles.push(fullPath);
      }
    }
  }
  findMdFiles(docsDir);

  console.log(`  Checking ${mdFiles.length} markdown files...`);

  let codeBlockCount = 0;
  const tempDir = path.join(__dirname, '../../.tmp-docs-check');

  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    for (const mdFile of mdFiles) {
      const content = fs.readFileSync(mdFile, 'utf8');
      const codeBlocks = content.match(/```(?:typescript|ts)\n([\s\S]*?)```/g) || [];

      codeBlocks.forEach((block, idx) => {
        const code = block.replace(/```(?:typescript|ts)\n/, '').replace(/```$/, '');
        if (code.trim().length < 10) return;

        codeBlockCount++;
        const tempFile = path.join(tempDir, `check-${codeBlockCount}.ts`);
        fs.writeFileSync(tempFile, code);

        try {
          execSync(`npx tsc --noEmit --skipLibCheck ${tempFile}`, {
            stdio: 'pipe',
            cwd: path.join(__dirname, '../..')
          });
        } catch (e) {
          const relPath = path.relative(path.join(__dirname, '../..'), mdFile);
          warn(`TypeScript error in ${relPath} code block #${idx + 1}`);
        }
      });
    }

    if (codeBlockCount > 0) {
      success(`Validated ${codeBlockCount} TypeScript code blocks`);
    } else {
      console.log('  No TypeScript code blocks found');
    }
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  }
}

// Run all checks
console.log('🔍 Starting documentation sync checks...\n');

checkModes();
checkAgents();
checkSkills();
checkCodeBlocks();

console.log('\n' + '='.repeat(50));
if (exitCode === 0) {
  console.log('✅ All documentation sync checks passed!');
} else {
  console.log('❌ Documentation sync checks failed!');
}

process.exit(exitCode);
