import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { readFileSync } from 'node:fs';

import dts from "rollup-plugin-dts";

// Load package.json
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default [{
  input: 'src/index.ts',
  output: [
    {
      file: pkg.minimized,
      name: "RoutePlannerSDK",
      format: 'umd',
      sourcemap: "inline",
      freeze: false,
      esModule: false
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: "inline",
      freeze: false
    },
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: "inline",
      freeze: false
    }
  ],
  external: ["node-fetch"],
  plugins: [
    json(),
    terser({
      compress: {
        pure_getters: true,
        passes: 3
      }
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,      // Generate type declarations
      declarationDir: "dist", // Store .d.ts files in the dist folder
      rootDir: "src"          // Keep import paths clean
    }),
    commonjs({
      ignoreGlobal: true
    })
  ]
},
  {
    input: "dist/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()]
  }];
