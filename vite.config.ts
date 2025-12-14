import { rmSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-electron-plugin";
import { customStart, loadViteEnv } from "vite-electron-plugin/plugin";
import legacy from "@vitejs/plugin-legacy";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// import visualizer from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const sourcemap = command === "serve" || !!process.env.VSCODE_DEBUG;

  // 从 version.json 读取版本号
  const versionJson = JSON.parse(readFileSync("./version.json", "utf-8"));
  const isProd = mode === "production";
  const appVersion = isProd ? `v${versionJson.prod}` : `v${versionJson.dev}`;

  return {
    define: {
      // 将版本号注入到环境变量
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
    plugins: [
      react(),
      electron({
        include: ["electron"],
        transformOptions: {
          sourcemap,
        },
        plugins: [
          ...(!!process.env.VSCODE_DEBUG
            ? [
                // Will start Electron via VSCode Debug
                customStart(() =>
                  console.log(
                    /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App",
                  ),
                ),
              ]
            : []),
          // Allow use `import.meta.env.VITE_SOME_KEY` in Electron-Main
          loadViteEnv(),
        ],
      }),
      legacy({
        targets: ["defaults", "not IE 11"],
      }),
      // visualizer({ open: true }),
    ],
    clearScreen: false,
    build: {
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 500,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes("node_modules") &&
              !id.includes("rc") &&
              !id.includes("ant")
            ) {
              return id.toString().split("node_modules/")[1].split("/")[0].toString();
            }
          },
        },
      },
    },
  };
});
