import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 __dirname 在 ES Module 中不可用的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: 'src/chart/index.ts', // 你的库入口文件
  output: [
    {
      file: 'dist/chart/index.cjs', // CommonJS 输出
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/chart/index.mjs', // ES Module 输出
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    alias({
      entries: [
        { find: '@', replacement: path.resolve(__dirname, 'src') }
      ]
    }),
    nodeResolve({
      preferBuiltins: true,
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    }),
    commonjs(),
    json(),
    esbuild({
      sourceMap: true,
      target: 'es2022', // 与你的 tsconfig.json 保持一致
      tsconfig: 'tsconfig.chart.json' // 使用你的特定 tsconfig
    }),
  ],
  // 将 peerDependencies 标记为外部依赖，不打包进最终文件
  external: ['zod', '@mastra/core']
};