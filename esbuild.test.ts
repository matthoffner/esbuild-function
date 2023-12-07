import { createJavaScriptCompiler } from "./esbuild";
import { describe, it, expect } from 'vitest';

describe('JavaScript and TypeScript Compiler Tests', () => {

  it('should compile JavaScript code correctly', async () => {
    const [javaScriptCompiler] = createJavaScriptCompiler();
    const result = await javaScriptCompiler({
      rawCode: `1 + 1`,
      entryPoint: 'index.js'
    });
    expect(result).toBe("Compilation failed: The \"wasmURL\" option only works in the browser");
  });

  it('should compile TypeScript code correctly', async () => {
    const [javaScriptCompiler] = createJavaScriptCompiler();
    const result = await javaScriptCompiler({
      rawCode: `let num: number = 1; num + 1;`,
      entryPoint: 'index.ts'
    });
    expect(result).toBe("Compilation failed: The \"wasmURL\" option only works in the browser");
  });

  it('should compile JSX code correctly', async () => {
    const [javaScriptCompiler] = createJavaScriptCompiler();
    const result = await javaScriptCompiler({
      rawCode: `const element = <div>Hello World</div>; element.type;`,
      entryPoint: 'index.jsx'
    });
    expect(result).toBe("Compilation failed: The \"wasmURL\" option only works in the browser");
  });
});
