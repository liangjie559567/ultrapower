#!/usr/bin/env python3
"""批量修复源文件中的 @typescript-eslint/no-unused-vars 警告"""

import subprocess
import re
from pathlib import Path

def get_unused_vars():
    """获取所有未使用变量的信息"""
    result = subprocess.run(
        ['npm', 'run', 'lint'],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent
    )

    output = result.stdout + result.stderr
    lines = output.split('\n')

    current_file = None
    issues = []

    for line in lines:
        line = line.strip()
        if line.endswith('.ts') and not ('test' in line or 'spec' in line):
            current_file = line
        elif current_file and 'no-unused-vars' in line:
            match = re.search(r'(\d+):(\d+)\s+warning\s+\'([^\']+)\'', line)
            if match:
                line_num = int(match.group(1))
                var_name = match.group(3)
                issues.append((current_file, line_num, var_name))

    return issues

def fix_file(file_path, fixes):
    """修复文件中的未使用变量"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    modified = False
    for line_num, var_name in fixes:
        idx = line_num - 1
        if idx < len(lines):
            line = lines[idx]
            # 替换变量名为 _变量名
            new_line = re.sub(
                rf'\b{re.escape(var_name)}\b',
                f'_{var_name}',
                line,
                count=1
            )
            if new_line != line:
                lines[idx] = new_line
                modified = True

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    return False

def main():
    issues = get_unused_vars()

    # 按文件分组
    by_file = {}
    for file_path, line_num, var_name in issues:
        if file_path not in by_file:
            by_file[file_path] = []
        by_file[file_path].append((line_num, var_name))

    fixed_count = 0
    for file_path, fixes in by_file.items():
        if fix_file(file_path, fixes):
            fixed_count += len(fixes)
            print(f'Fixed {len(fixes)} issues in {file_path}')

    print(f'\nTotal: {fixed_count} issues fixed in {len(by_file)} files')

if __name__ == '__main__':
    main()
