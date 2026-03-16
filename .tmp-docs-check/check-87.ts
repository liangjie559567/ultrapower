import { enforceModel } from '@liangjie559567/ultrapower';

const input = {
  description: 'Implement feature',
  prompt: 'Add validation',
  subagent_type: 'executor'
};

const result = enforceModel(input);
console.log(result.modifiedInput.model); // 'sonnet'
console.log(result.injected); // true
