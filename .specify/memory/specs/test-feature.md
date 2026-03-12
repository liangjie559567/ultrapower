# Feature: Spec Kit Integration Test

## Overview
Test the Spec Kit integration by creating a simple skill that validates project structure.

## Requirements

### Functional
1. Create a new skill `project-validator`
2. Skill should check if required files exist:
   - package.json
   - tsconfig.json
   - CLAUDE.md
3. Output validation report

### Non-Functional
- Execution time < 1 second
- Clear error messages
- Exit code 0 on success, 1 on failure

## Success Criteria
- Skill created in `skills/project-validator/`
- SKILL.md documentation complete
- Manual test passes
