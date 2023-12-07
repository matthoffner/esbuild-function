import { createJavaScriptInterpreter } from "./esbuild";
import { describe, it, expect } from 'vitest';

describe('JavaScript and TypeScript Interpreter Tests', () => {

  it('should interpret JavaScript code correctly', async () => {
    const [javaScriptInterpreter] = createJavaScriptInterpreter();
    const result = await javaScriptInterpreter({
      code: `1 + 1`,
    });
    expect(result).toBe(2);
  });

  it('should interpret TypeScript code correctly', async () => {
    const [javaScriptInterpreter] = createJavaScriptInterpreter();
    const result = await javaScriptInterpreter({
      code: `let num: number = 1; num + 1;`,
    });
    expect(result).toBe(2);
  });

  it('should interpret JSX code correctly', async () => {
    const [javaScriptInterpreter] = createJavaScriptInterpreter();
    const result = await javaScriptInterpreter({
      code: `const element = <div>Hello World</div>; element.type;`,
    });
    expect(result).toBe("div");
  });

  it('should timeout for long running scripts', async () => {
    const [javaScriptInterpreter] = createJavaScriptInterpreter();
    const result = await javaScriptInterpreter({
      code: `while (true) {}`,
    });

    expect(result).toBe("Failed to execute script: Script execution timed out after 5000ms");
  });

  it('should not have access to Node.js environment', async () => {
    const [javaScriptInterpreter] = createJavaScriptInterpreter();
    const result = await javaScriptInterpreter({
      code: `process.exit(1)`,
    });

    expect(result).toBe("Failed to execute script: process is not defined");
  });

});
