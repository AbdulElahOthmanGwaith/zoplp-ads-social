#!/usr/bin/env node
/**
 * سكريبت تحديث التكوين
 * Configuration Update Script
 */

const fs = require('fs');
const path = require('path');
const config = require('../requirements.config.cjs');

console.log('🔄 تحديث تكوين المشروع...');
console.log('🔄 Updating project configuration...');

// تحديث ملف package.json
function updatePackage() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const currentPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // دمج التطبيق مع المتطلبات الجديدة
  const updatedPackage = {
    ...currentPackage,
    name: config.project.name.toLowerCase().replace(/\s+/g, '-'),
    version: config.project.version,
    description: config.project.description,
    author: config.project.author,
    engines: config.engines,
    scripts: {
      ...currentPackage.scripts,
      ...config.scripts
    },
    dependencies: {
      ...currentPackage.dependencies,
      ...config.dependencies
    },
    devDependencies: {
      ...currentPackage.devDependencies,
      ...config.devDependencies,
      'vite-plugin-pwa': '^0.20.5'  // إضافة PWA plugin
    }
  };

  fs.writeFileSync(packagePath, JSON.stringify(updatedPackage, null, 2));
  console.log('✅ تم تحديث package.json');
}

// تحديث ملف vite.config.ts
function updateViteConfig() {
  const viteConfigContent = `import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import sourceIdentifierPlugin from 'vite-plugin-source-identifier';
import { VitePWA } from 'vite-plugin-pwa';

// استيراد التكوين المركزي
const requirementsConfig = require('./requirements.config.cjs');
const isProd = process.env.BUILD_MODE === 'prod';

export default defineConfig({
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
`;

  fs.writeFileSync(path.join(__dirname, '..', 'vite.config.ts'), viteConfigContent);
  console.log('✅ تم تحديث vite.config.ts');
}

async function runUpdate() {
  try {
    updatePackage();
    updateViteConfig();
    
    console.log('\n🎉 تم تحديث جميع إعدادات المشروع!');
    console.log('🎉 All project configurations updated!');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث التكوين:', error);
    console.error('❌ Error updating configuration:', error);
    process.exit(1);
  }
}

runUpdate();