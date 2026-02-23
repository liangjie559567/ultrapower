---
name: swarm
description: N coordinated agents on shared task list (compatibility facade over team)
---

# Swarm (Compatibility Facade)

Swarm is a compatibility alias for the `/ultrapower:team` skill. All swarm invocations are routed to the Team skill's staged pipeline.

## Usage

```
/ultrapower:swarm N:agent-type "task description"
/ultrapower:swarm "task description"
```

## Behavior

This skill is identical to `/ultrapower:team`. Invoke the Team skill with the same arguments:

```
/ultrapower:team <arguments>
```

Follow the Team skill's full documentation for staged pipeline, agent routing, and coordination semantics.
