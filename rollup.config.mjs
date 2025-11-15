import path from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

/** @type {import('rollup').RollupOptions[]} */
const configs = [
  {
    input: {
      index: "index.ts",
      "adapters/index": "adapters/index.ts",
      "components/index": "components/index.ts"
    },
    output: [
      {
        dir: "dist",
        entryFileNames: "[name].js",
        format: "esm",
        sourcemap: true,
        preserveModules: false
      },
      {
        dir: "dist",
        entryFileNames: "[name].cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
        preserveModules: false
      }
    ],
    external: (id) => {
      // Treat peer deps and react libs as external
      return (
        id.startsWith("react") ||
        id.startsWith("@tanstack/react-table") ||
        id.startsWith("date-fns") ||
        id.startsWith("lucide-react") ||
        id === "md5"
      );
    },
    plugins: [
      resolve({
        extensions: [".mjs", ".js", ".json", ".node", ".ts", ".tsx"]
      }),
      commonjs(),
      typescript({
        tsconfig: path.resolve(process.cwd(), "tsconfig.rollup.json"),
        declaration: false
      })
    ]
  }
];

export default configs;


