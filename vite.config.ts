import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import sourceIdentifierPlugin from 'vite-plugin-source-identifier';
import { VitePWA } from 'vite-plugin-pwa';

// استيراد التكوين المركزي
const requirementsConfig = require('./requirements.config.cjs');
const isProd = process.env.BUILD_MODE === 'prod';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  // إعداد base path لـ GitHub Pages
  base: isGitHubPages ? '/zoplp-ads-social/' : '/',
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: requirementsConfig.pwa.workboxConfig,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: requirementsConfig.pwa.manifest,
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: requirementsConfig.development.port,
    host: requirementsConfig.development.host,
    open: requirementsConfig.development.open,
    cors: requirementsConfig.development.cors
  },
  build: {
    outDir: requirementsConfig.build.outDir,
    assetsDir: requirementsConfig.build.assetsDir,
    sourcemap: requirementsConfig.build.sourcemap,
    minify: requirementsConfig.build.minify,
    target: requirementsConfig.build.target,
    rollupOptions: requirementsConfig.build.rollupOptions
  }
});
