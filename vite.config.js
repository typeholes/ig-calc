import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// import commonjs from 'rollup-plugin-commonjs';
// import nodeResolve from 'rollup-plugin-node-resolve';
// import globals from 'rollup-plugin-node-globals';
// import builtins from 'rollup-plugin-node-builtins';
// import json from 'rollup-plugin-json';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/ig-calc/",
  //  server: { fs: { strict: false }},
  optimizeDeps: {
    //    include: ["function-plot"],
    //		allowNodeBuiltins: ['function-plot']
    //		include: ['pouchdb-live-find/dist/index.es.js']
  },
  plugins: [
    vue(),
    //    builtins(),
    //    nodeResolve({ jsnext: true, main: true, browser: true }),
    //    commonjs({
    //      ignoreGlobal: true
    //    }),
    //    globals(),
    //    json()
  ],
  define: { global: {} },
  build: { target: "esnext", sourcemap: true },
});
