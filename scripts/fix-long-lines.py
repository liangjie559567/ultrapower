#!/usr/bin/env python3
import os
import re

os.chdir('agents.codex')

# Files and line numbers to fix
fixes = {
    'code-reviewer.md': [44],
    'build-fixer.md': [74],
    'axiom-tech-lead.md': [10],
}

for filename, line_nums in fixes.items():
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line_num in line_nums:
        idx = line_num - 1
        if idx < len(lines):
            line = lines[idx].rstrip()
            if len(line) > 80:
                # Split at appropriate point
                if '。' in line:
                    parts = line.split('。')
                    if len(parts) > 1:
                        lines[idx] = parts[0] + '。\n'
                        lines.insert(idx + 1, '  ' + '。'.join(parts[1:]) + '\n')
                elif '，' in line and len(line) > 100:
                    # Find good split point around middle
                    mid = len(line) // 2
                    for i in range(mid - 20, mid + 20):
                        if i < len(line) and line[i] == '，':
                            lines[idx] = line[:i+1] + '\n'
                            lines.insert(idx + 1, '  ' + line[i+1:] + '\n')
                            break

    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f'Fixed: {filename}')
