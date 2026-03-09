#!/usr/bin/env python3
import os
import re

os.chdir('agents.codex')
for f in os.listdir('.'):
    if not f.endswith('.md') or f in ['AGENTS.md', 'CONVERSION-GUIDE.md']:
        continue

    with open(f, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Find frontmatter end
    fm_end = -1
    in_fm = False
    for i, line in enumerate(lines):
        if line.strip() == '---':
            if not in_fm:
                in_fm = True
            else:
                fm_end = i
                break

    if fm_end < 0:
        continue

    # Generate h1 from filename
    name = f.replace('.md', '').replace('-', ' ').title()

    # Find first ## 角色 or ## Role
    new_lines = lines[:fm_end+1]
    new_lines.append('\n')
    new_lines.append(f'# {name}\n')
    new_lines.append('\n')

    # Add rest, skipping duplicate h1s and fixing spacing
    i = fm_end + 1
    while i < len(lines):
        line = lines[i]
        # Skip empty lines right after frontmatter
        if i <= fm_end + 3 and line.strip() == '':
            i += 1
            continue
        # Skip duplicate h1
        if line.startswith('# ') and name.lower() in line.lower():
            i += 1
            continue
        # Skip standalone ## 角色 before h1
        if i < fm_end + 5 and line.strip() in ['## 角色', '## Role']:
            i += 1
            continue
        new_lines.append(line)
        i += 1

    with open(f, 'w', encoding='utf-8') as file:
        file.writelines(new_lines)

    print(f'Fixed: {f}')
