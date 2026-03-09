# Performance Issues

## Slow Response

**Symptoms**: Operations take longer than expected

**Diagnosis**:
1. Check system resources (CPU, memory)
2. Use `/ultrapower:trace` to profile
3. Review recent changes

**Solutions**:

* Close unnecessary applications

* Reduce concurrent operations

* Optimize hook logic

## Memory Leak

**Symptoms**: Memory usage grows over time

**Diagnosis**:
1. Monitor memory with `process.memoryUsage()`
2. Check for unclosed resources
3. Review agent lifecycle

**Solutions**:

* Close file handles properly

* Clear caches periodically

* Restart long-running sessions

## High CPU Usage

**Causes**:

* Too many parallel agents

* Infinite loops in hooks

* Large file processing

**Solutions**:

* Limit concurrent agents

* Add loop guards

* Process files in chunks
