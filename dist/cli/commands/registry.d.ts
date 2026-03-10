import { Command } from 'commander';
export interface CommandLoader {
    name: string;
    loader: () => Promise<{
        default: Command;
    }>;
}
export declare const commandRegistry: CommandLoader[];
//# sourceMappingURL=registry.d.ts.map