// SDK does not provide `success` field, so default to 'completed' when undefined (Bug #1 fix)
const succeeded = input.success !== false;
