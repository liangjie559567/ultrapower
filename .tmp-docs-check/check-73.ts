export interface HookOutput {
  continue: boolean;
  message?: string;
  additionalContext?: string;
  reason?: string;
  modifiedInput?: unknown;
}
