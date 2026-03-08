#!/usr/bin/env node
import { startServer } from '../../dist/mcp/standalone-server.js';
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer().catch(console.error);
}
//# sourceMappingURL=index.js.map