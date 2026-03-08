export declare function readFileLines(filePath: string): AsyncGenerator<string>;
export declare function processFileStream(filePath: string, processor: (line: string) => void | Promise<void>): Promise<void>;
//# sourceMappingURL=stream-processor.d.ts.map