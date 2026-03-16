import { processHook } from '@liangjie559567/ultrapower';

const hookInput = {
  toolName: 'Task',
  toolInput: {
    description: 'Test',
    prompt: 'Test',
    subagent_type: 'executor'
  }
};

const result = await processHook('pre-tool-use', hookInput);
console.log(result.modifiedInput.model); // 'sonnet'
