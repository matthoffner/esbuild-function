import { z } from "zod";
import { Tool } from "openai-function-calling-tools";
import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
  name: "fileCache",
});

export const unpkgFetchPlugin = (
  inputCode: string | undefined,
  entryPoint: string
): esbuild.Plugin => {
  return {
    name: "unpkg-fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      //match entrypoint
      if (entryPoint === "index.ts") {
        build.onLoad({ filter: /(^index\.ts$)/ }, () => {
          return {
            loader: "tsx",
            contents: inputCode,
          };
        });
      } else {
        build.onLoad({ filter: /(^index\.js$)/ }, () => {
          return {
            loader: "jsx",
            contents: inputCode,
          };
        });
      }

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        const cacheResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );
        if (cacheResult) {
          return cacheResult;
        }
      });

      //match css file
      build.onLoad({ filter: /.css$/ }, async (args: esbuild.OnLoadArgs) => {
        const { data, request } = await axios.get(args.path);

        const escapedData = data
          .replace(/\n/g, "")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = `const style = document.createElement("style");
               style.innerText = '${escapedData}';
               document.head.appendChild(style);`;

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents,
          //specify the place where the content was found
          resolveDir: new URL("./", request.responseURL).pathname,
        };
        //store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });

      //=================================================

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        console.log(`...fetching ${args.path}`);
        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          //specify the place where the content was found
          resolveDir: new URL("./", request.responseURL).pathname,
        };
        //store response in cache
        await fileCache.setItem(args.path, result);
        console.log("end of fetching");
        return result;
      });
    },
  };
};

export const unpkgPathPlugin = (): esbuild.Plugin => {
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      //
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === "entry-point") {
          return { path: args.path, namespace: "a" };
        }
      });

      //match relative path in a module "./" or "../"
      build.onResolve({ filter: /^\.+\// }, (args: esbuild.OnResolveArgs) => {
        return {
          namespace: "a",
          path: new URL(args.path, `https://unpkg.com${args.resolveDir}/`).href,
        };
      });

      //match main file in a module
      build.onResolve({ filter: /.*/ }, async (args: esbuild.OnResolveArgs) => {
        return {
          namespace: "a",
          path: `https://unpkg.com/${args.path}`,
        };
      });
    },
  };
};

// Define the version of esbuild-wasm to use
const ESBUILD_WASM_VERSION = "0.14.42";

function createJavaScriptCompiler() {
  const paramsSchema = z.object({
    rawCode: z.string(),
    entryPoint: z.string(),
  });
  const name = "javaScriptCompiler";
  const description = "Compiles JavaScript, TypeScript, or JSX code within a chat interface using esbuild-wasm. Accepts raw code and an entry point as input, and provides compiled output, facilitating real-time code execution and analysis in a chatbot environment.";

  const execute = async (params: z.infer<typeof paramsSchema>) => {
    const { rawCode, entryPoint } = params;

    try {
      // Initialize esbuild-wasm if it hasn't been initialized
      if (!esbuild.initialized) {
        await esbuild.initialize({
          worker: true,
          wasmURL: `https://unpkg.com/esbuild-wasm@${ESBUILD_WASM_VERSION}/esbuild.wasm`,
        });
      }

      // Compile the code using esbuild-wasm
      const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        minify: true,
        outdir: "/",
        plugins: [unpkgPathPlugin(), unpkgFetchPlugin(rawCode, entryPoint)],
        metafile: true,
        allowOverwrite: true
      });

      return result.outputFiles[0].text;
    } catch (error) {
      return `Compilation failed: ${error.message}`;
    }
  };

  return new Tool<typeof paramsSchema, z.ZodType<any, any>>(paramsSchema, name, description, execute).tool;
}

export { createJavaScriptCompiler };
