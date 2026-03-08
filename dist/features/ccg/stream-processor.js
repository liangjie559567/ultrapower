import { createReadStream } from 'fs';
import { createInterface } from 'readline';
export async function* readFileLines(filePath) {
    const stream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
        yield line;
    }
}
export async function processFileStream(filePath, processor) {
    for await (const line of readFileLines(filePath)) {
        await processor(line);
    }
}
//# sourceMappingURL=stream-processor.js.map