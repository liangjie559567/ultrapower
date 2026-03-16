// Enforce model parameter for Task/Agent calls
const delegationResult = enforceDelegationModel(
  input.toolName | | '',
  input.toolInput,
);

return {
  continue: true,
  modifiedInput: delegationResult.modifiedInput,
  ...(finalMessage ? { message: finalMessage } : {}),
};
