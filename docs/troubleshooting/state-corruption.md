# State Corruption

## Invalid State

**Symptoms**: State file contains invalid data

**Diagnosis**:
1. Check state file: `.omc/state/{mode}-state.json`
2. Validate JSON structure
3. Review recent operations

**Solutions**:
1. Backup state directory
2. Delete corrupted file
3. Restart session to regenerate

**Auto-fix**: Use `/ultrapower:omc-doctor --fix-state`

## Missing State

**Symptoms**: State file not found

**Solutions**:
1. Run `/ultrapower:omc-setup`
2. Verify `.omc/` directory exists
3. Check file permissions
4. Restart workflow

## State Recovery

Backup location: `.omc/state/backups/`

To restore:
```bash
cp .omc/state/backups/latest.json .omc/state/{mode}-state.json
```
