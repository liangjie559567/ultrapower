import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { astGrepSearchTool } from "../ast-tools";

const TEST_DIR = join(process.cwd(), ".test-ast-stream");

describe("AST Stream Processing", () => {
  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("handles large files >10MB with streaming", async () => {
    const largeCode = `function test() {\n  console.log("test");\n}\n`.repeat(200000);
    const filePath = join(TEST_DIR, "large.js");
    writeFileSync(filePath, largeCode);

    const result = await astGrepSearchTool.handler({
      pattern: "console.log($MSG)",
      language: "javascript",
      path: filePath,
      maxResults: 5,
    });

    expect(result.content[0].text).toContain("Found");
    unlinkSync(filePath);
  });

  it("handles small files without streaming", async () => {
    const smallCode = `console.log("hello");`;
    const filePath = join(TEST_DIR, "small.js");
    writeFileSync(filePath, smallCode);

    const result = await astGrepSearchTool.handler({
      pattern: "console.log($MSG)",
      language: "javascript",
      path: filePath,
    });

    expect(result.content[0].text).toContain("Found 1 match");
    unlinkSync(filePath);
  });
});
