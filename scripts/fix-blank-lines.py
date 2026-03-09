#!/usr/bin/env python3
import os
import re

os.chdir('agents.codex')
for f in os.listdir('.'):
    if not f.endswith('.md'):
        continue

    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()

    # Replace 3+ newlines with 2 newlines
    fixed = re.sub(r'\n{3,}', '\n\n', content)

    with open(f, 'w', encoding='utf-8') as file:
        file.write(fixed)

    print(f'Fixed: {f}')
