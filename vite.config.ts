import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    plugins: [preact(), tailwindcss(), viteSingleFile()],
    build: {
      outDir: `dist/${timestamp}`,
      target: 'esnext',
      assetsInlineLimit: 100000000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
        mangle: true,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
