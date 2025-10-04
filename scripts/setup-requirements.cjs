#!/usr/bin/env node
/**
 * سكريبت إعداد المتطلبات
 * Requirements Setup Script
 */

const fs = require('fs');
const path = require('path');
const config = require('../requirements.config.cjs');

console.log('🚀 بدء إعداد متطلبات التطبيق...');
console.log('Starting application requirements setup...');

// إنشاء ملف package.json محدث
function updatePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  const packageJson = {
    name: config.project.name.toLowerCase().replace(/\s+/g, '-'),
    private: config.project.private,
    version: config.project.version,
    type: config.project.type,
    description: config.project.description,
    author: config.project.author,
    engines: config.engines,
    scripts: config.scripts,
    dependencies: config.dependencies,
    devDependencies: config.devDependencies
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ تم تحديث package.json');
  console.log('✅ Updated package.json');
}

// إنشاء ملفات متغيرات البيئة
function createEnvFiles() {
  // ملف .env.development
  const devEnvContent = Object.entries(config.environmentVariables.development)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(path.join(__dirname, '..', '.env.development'), devEnvContent);
  console.log('✅ تم إنشاء .env.development');

  // ملف .env.production
  const prodEnvContent = Object.entries(config.environmentVariables.production)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(path.join(__dirname, '..', '.env.production'), prodEnvContent);
  console.log('✅ تم إنشاء .env.production');

  // ملف .env.example (للمتغيرات الحساسة)
  const supabaseEnvExample = Object.keys(config.environmentVariables.supabase)
    .map(key => `${key}=your_${key.toLowerCase()}_here`)
    .join('\n');
  
  fs.writeFileSync(path.join(__dirname, '..', '.env.example'), 
    `# نسخ هذا الملف إلى .env.local وملء القيم\n# Copy this file to .env.local and fill in the values\n\n${supabaseEnvExample}`);
  console.log('✅ تم إنشاء .env.example');
}

// إنشاء ملف تكوين Vite محدث
function updateViteConfig() {
  const viteConfigContent = `import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import sourceIdentifierPlugin from 'vite-plugin-source-identifier';
import { VitePWA } from 'vite-plugin-pwa';

const config = require('./requirements.config.js');
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
      workbox: config.pwa.workboxConfig,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: config.pwa.manifest,
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
    port: config.development.port,
    host: config.development.host,
    open: config.development.open,
    cors: config.development.cors
  },
  build: {
    outDir: config.build.outDir,
    assetsDir: config.build.assetsDir,
    sourcemap: config.build.sourcemap,
    minify: config.build.minify,
    target: config.build.target,
    rollupOptions: config.build.rollupOptions
  }
});
`;

  fs.writeFileSync(path.join(__dirname, '..', 'vite.config.ts'), viteConfigContent);
  console.log('✅ تم تحديث vite.config.ts');
}

// تشغيل جميع المهام
async function runSetup() {
  try {
    updatePackageJson();
    createEnvFiles();
    updateViteConfig();
    
    console.log('\n🎉 تم إعداد جميع المتطلبات بنجاح!');
    console.log('🎉 All requirements setup completed successfully!');
    console.log('\n📋 الخطوات التالية:');
    console.log('📋 Next steps:');
    console.log('1. نسخ .env.example إلى .env.local وملء متغيرات Supabase');
    console.log('1. Copy .env.example to .env.local and fill Supabase variables');
    console.log('2. تشغيل: pnpm install');
    console.log('2. Run: pnpm install');
    console.log('3. تشغيل: pnpm dev');
    console.log('3. Run: pnpm dev');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد المتطلبات:', error);
    console.error('❌ Error setting up requirements:', error);
    process.exit(1);
  }
}

runSetup();
