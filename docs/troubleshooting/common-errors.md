# Common Errors

## TypeScript Errors

### TS2339: Property does not exist

**Cause**: Accessing undefined property or type mismatch

**Solution**:
1. Run `tsc --noEmit` to see all errors
2. Check type definitions
3. Add missing properties or fix type annotations

### Import Errors

**Cause**: Missing .js extension or wrong path

**Solution**:
1. Verify file exists at import path
2. Add .js extension for ESM imports
3. Run `npm install` to ensure dependencies

## Runtime Errors

### ENOENT: File not found

**Cause**: Missing file or incorrect path

**Solution**:
1. Verify file path is correct
2. Check file permissions
3. Ensure .omc/ directory structure exists

### Permission Denied

**Cause**: Insufficient file system permissions

**Solution**:
1. Check file/directory permissions
2. Run with appropriate user privileges
3. Verify allowedDirectories in config
