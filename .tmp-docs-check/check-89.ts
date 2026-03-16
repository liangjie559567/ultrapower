import { isAgentCall } from '@liangjie559567/ultrapower';

isAgentCall('Task', { subagent_type: 'executor', ... }); // true
isAgentCall('Bash', { command: 'ls' }); // false
