import { createJavaScriptInterpreter } from "./javaScriptInterpreter";
import { describe, it, expect } from 'vitest';

describe('JavaScript Interpreter Tests', () => {

  it('should interpret JavaScript code correctly', async () => {
    const [javaScriptInterpreter] = createJavaScriptInterpreter();
    const result = await javaScriptInterpreter({
      code: `1 + 1`,
    });
    expect(result).toBe(2);
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
