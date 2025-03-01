import { defineConfig } from "rollup";
import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { uglify } from "rollup-plugin-uglify";

export default defineConfig({
  input: "./index.ts",
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: "ESNext",
        },
      },
      useTsconfigDeclarationDir: true,
    }),
    resolve(),
    commonjs(),
    uglify(),
  ],
  output: {
    dir: "./dist",
    entryFileNames: `[name].min.js`,
    exports: "named",
    format: "es",
  },
  treeshake: true,
});
