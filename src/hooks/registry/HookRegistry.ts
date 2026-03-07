import type { HookInput, HookOutput, HookType } from "../bridge-types.js";

export type HookProcessor = (input: HookInput) => Promise<HookOutput>;

export class HookRegistry {
  private processors = new Map<HookType, HookProcessor>();

  register(hookType: HookType, processor: HookProcessor): void {
    this.processors.set(hookType, processor);
  }

  get(hookType: HookType): HookProcessor | undefined {
    return this.processors.get(hookType);
  }

  has(hookType: HookType): boolean {
    return this.processors.has(hookType);
  }
}

export const registry = new HookRegistry();
