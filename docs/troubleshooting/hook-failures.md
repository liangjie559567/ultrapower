# Hook Failures

## Hook Timeout

**Symptoms**: Hook execution exceeds time limit

**Diagnosis**:
1. Check hook logs in `.omc/logs/`
2. Review hook execution time in bridge.ts
3. Identify slow operations

**Solutions**:

* Increase timeout in hook configuration

* Optimize hook logic

* Break into smaller operations

## Hook Crash

**Symptoms**: Hook terminates unexpectedly

**Diagnosis**:
1. Review error logs
2. Check hook input validation
3. Verify dependencies loaded

**Solutions**:

* Add error handling

* Validate inputs before processing

* Check for missing dependencies
