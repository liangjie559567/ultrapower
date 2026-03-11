---
"@liangjie559567/ultrapower": patch
---

Fix Windows HUD display issue and enhance diagnostics

- **Fix**: Windows path format causing HUD not to display (backslashes → forward slashes)
- **Enhancement**: Add path format check to omc-doctor
- **Knowledge**: New pattern PAT-018 for Windows config paths
- **Auto-fix**: omc-setup now detects and fixes corrupted paths automatically
