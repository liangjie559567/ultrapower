# MCP Server Guide

## Creating a Custom MCP Server

### Minimal Server

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'my-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'my_tool',
      description: 'Does something useful',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my_tool') {
    return {
      content: [{ type: 'text', text: 'Result' }]
    };
  }
  throw new Error('Unknown tool');
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Definition Pattern

```typescript
interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  handler: (args: any) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
}

const tools: ToolDef[] = [
  {
    name: 'example_tool',
    description: 'Example tool',
    schema: z.object({
      input: z.string().describe('Input text')
    }),
    handler: async (args) => ({
      content: [{ type: 'text', text: `Processed: ${args.input}` }]
    })
  }
];
```

### Schema Conversion

Convert Zod to JSON Schema for MCP:

```typescript
function zodToJsonSchema(schema: z.ZodObject<any>) {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(schema.shape)) {
    properties[key] = zodTypeToJsonSchema(value);
    if (!value.isOptional()) required.push(key);
  }

  return { type: 'object', properties, required };
}
```

## Deployment

### Local Development

```bash
# Build server
npm run build

# Test manually
node dist/my-server.js
```

### Claude Code Integration

Add to `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/my-server.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### NPM Package

```json
{
  "name": "my-mcp-server",
  "bin": {
    "my-server": "dist/server.js"
  },
  "files": ["dist"]
}
```

Users install via:
```bash
npm install -g my-mcp-server
```

Config:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "my-server"
    }
  }
}
```

## Best Practices

### Error Handling

```typescript
handler: async (args) => {
  try {
    const result = await doWork(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: error.message })
      }],
      isError: true
    };
  }
}
```

### Logging

```typescript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function log(level: string, message: string) {
  if (shouldLog(level)) {
    console.error(`[${level}] ${message}`);
  }
}
```

### Validation

```typescript
import { z } from 'zod';

const schema = z.object({
  file: z.string().min(1),
  line: z.number().int().positive()
});

handler: async (args) => {
  const validated = schema.parse(args);
  // Use validated data
}
```

### Timeouts

```typescript
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

handler: async (args) => {
  return await withTimeout(doWork(args), 30000);
}
```

## Examples

### File System Tool

```typescript
{
  name: 'read_file',
  description: 'Read file contents',
  schema: z.object({
    path: z.string().describe('File path')
  }),
  handler: async ({ path }) => {
    const content = await fs.readFile(path, 'utf-8');
    return { content: [{ type: 'text', text: content }] };
  }
}
```

### HTTP API Tool

```typescript
{
  name: 'fetch_data',
  description: 'Fetch from API',
  schema: z.object({
    url: z.string().url()
  }),
  handler: async ({ url }) => {
    const response = await fetch(url);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
}
```

### Database Tool

```typescript
{
  name: 'query_db',
  description: 'Execute SQL query',
  schema: z.object({
    query: z.string(),
    params: z.array(z.any()).optional()
  }),
  handler: async ({ query, params = [] }) => {
    const rows = await db.query(query, params);
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
  }
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('my_tool', () => {
  it('processes input correctly', async () => {
    const result = await handler({ input: 'test' });
    expect(result.content[0].text).toContain('test');
  });
});
```

### Integration Tests

```typescript
import { spawn } from 'child_process';

it('server responds to list_tools', async () => {
  const server = spawn('node', ['dist/server.js']);

  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }) + '\n');

  const response = await readResponse(server.stdout);
  expect(response.result.tools).toHaveLength(1);
});
```

## Next Steps

- [Client Guide](./client-guide.md) - Use tools in agents
- [Configuration](./configuration.md) - Environment variables
- [Performance](./performance.md) - Optimization tips
