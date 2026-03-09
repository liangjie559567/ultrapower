#!/usr/bin/env python3
import re
import os
from pathlib import Path

def fix_long_lines(content, max_length=80):
    """Split lines longer than max_length at appropriate points"""
    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        if len(line) <= max_length:
            fixed_lines.append(line)
            continue

        # Don't split URLs, code blocks, or tables
        if line.strip().startswith('|') or line.strip().startswith('```') or 'http' in line:
            fixed_lines.append(line)
            continue

        # For Chinese text, try to split at punctuation
        if any('\u4e00' <= c <= '\u9fff' for c in line):
            # Split at Chinese punctuation or spaces
            parts = []
            current = ""
            for char in line:
                current += char
                if len(current) >= max_length and char in '，。、；：！？）」』':
                    parts.append(current)
                    current = ""
            if current:
                parts.append(current)
            fixed_lines.extend(parts)
        else:
            fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_markdown_file(filepath):
    """Fix common markdown lint errors"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix dash lists to asterisk lists
    content = re.sub(r'^- ', '* ', content, flags=re.MULTILINE)

    # Fix ordered list prefixes (reset numbering)
    def fix_ol(match):
        lines = match.group(0).split('\n')
        fixed = []
        counter = 1
        for line in lines:
            if re.match(r'^\d+\.', line):
                fixed.append(re.sub(r'^\d+\.', f'{counter}.', line))
                counter += 1
            else:
                fixed.append(line)
        return '\n'.join(fixed)

    # Find ordered lists and fix them
    content = re.sub(r'(?:^\d+\..*\n)+', fix_ol, content, flags=re.MULTILINE)

    # Add blank line after headings if missing
    content = re.sub(r'(^#{1,6} .+)\n([^#\n])', r'\1\n\n\2', content, flags=re.MULTILINE)

    # Add blank line before headings if missing
    content = re.sub(r'([^\n])\n(^#{1,6} )', r'\1\n\n\2', content, flags=re.MULTILINE)

    # Add blank line before lists if missing
    content = re.sub(r'([^\n])\n(\* )', r'\1\n\n\2', content, flags=re.MULTILINE)

    # Remove multiple consecutive blank lines (keep max 2)
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Fix table spacing - ensure spaces around pipes
    lines = content.split('\n')
    fixed_lines = []
    for line in lines:
        if '|' in line and not line.strip().startswith('```'):
            # Add spaces around pipes
            line = re.sub(r'\|([^ ])', r'| \1', line)
            line = re.sub(r'([^ ])\|', r'\1 |', line)
        fixed_lines.append(line)
    content = '\n'.join(fixed_lines)

    # Wrap bare URLs in angle brackets
    content = re.sub(r'(?<!\[)(?<!\()https?://[^\s\)]+(?!\))', r'<\g<0>>', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all markdown files
for root, dirs, files in os.walk('.'):
    # Skip node_modules and .git
    if 'node_modules' in root or '.git' in root:
        continue

    for file in files:
        if file.endswith('.md'):
            filepath = os.path.join(root, file)
            if fix_markdown_file(filepath):
                print(f"Fixed: {filepath}")

print("Done!")
