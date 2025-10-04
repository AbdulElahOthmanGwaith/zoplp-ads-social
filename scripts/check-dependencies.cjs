#!/usr/bin/env node
/**
 * سكريبت فحص الاعتماديات
 * Dependencies Check Script
 */

const fs = require('fs');
const path = require('path');
const config = require('../requirements.config.cjs');

console.log('🔍 فحص الاعتماديات...');
console.log('🔍 Checking dependencies...');

function checkPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ ملف package.json غير موجود');
    console.error('❌ package.json file not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // فحص الاعتماديات المطلوبة
  const missingDeps = [];
  const outdatedDeps = [];

  // فحص dependencies
  Object.entries(config.dependencies).forEach(([dep, version]) => {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missingDeps.push(`${dep}@${version}`);
    } else if (packageJson.dependencies[dep] !== version) {
      outdatedDeps.push({
        name: dep,
        current: packageJson.dependencies[dep],
        required: version
      });
    }
  });

  // فحص devDependencies
  Object.entries(config.devDependencies).forEach(([dep, version]) => {
    if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
      missingDeps.push(`${dep}@${version} (dev)`);
    } else if (packageJson.devDependencies[dep] !== version) {
      outdatedDeps.push({
        name: dep,
        current: packageJson.devDependencies[dep],
        required: version,
        dev: true
      });
    }
  });

  // إظهار النتائج
  if (missingDeps.length === 0 && outdatedDeps.length === 0) {
    console.log('✅ جميع الاعتماديات محدثة ومتطابقة مع المتطلبات');
    console.log('✅ All dependencies are up to date and match requirements');
    return true;
  }

  if (missingDeps.length > 0) {
    console.log('\n⚠️ اعتماديات مفقودة:');
    console.log('⚠️ Missing dependencies:');
    missingDeps.forEach(dep => console.log(`  - ${dep}`));
  }

  if (outdatedDeps.length > 0) {
    console.log('\n🔄 اعتماديات تحتاج تحديث:');
    console.log('🔄 Dependencies needing update:');
    outdatedDeps.forEach(dep => {
      console.log(`  - ${dep.name}: ${dep.current} → ${dep.required} ${dep.dev ? '(dev)' : ''}`);
    });
  }

  return false;
}

function checkEnvironmentFiles() {
  const requiredEnvFiles = ['.env.example'];
  const optionalEnvFiles = ['.env.local', '.env.development', '.env.production'];
  
  console.log('\n📁 فحص ملفات متغيرات البيئة:');
  console.log('📁 Checking environment files:');

  requiredEnvFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} موجود`);
    } else {
      console.log(`❌ ${file} مفقود (مطلوب)`);
    }
  });

  optionalEnvFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} موجود`);
    } else {
      console.log(`⚠️ ${file} مفقود (اختياري)`);
    }
  });
}

function generateHealthReport() {
  const report = {
    timestamp: new Date().toISOString(),
    project: config.project.name,
    version: config.project.version,
    status: 'healthy',
    issues: []
  };

  // فحص ملفات المشروع المهمة
  const importantFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tailwind.config.js',
    'requirements.config.js'
  ];

  importantFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      report.issues.push(`Missing important file: ${file}`);
      report.status = 'needs-attention';
    }
  });

  // حفظ التقرير
  const reportPath = path.join(__dirname, '..', 'health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 تم إنشاء تقرير الصحة: health-report.json');
  console.log('📊 Health report generated: health-report.json');
  console.log(`📈 حالة المشروع: ${report.status}`);
  console.log(`📈 Project status: ${report.status}`);
}

async function runCheck() {
  const isHealthy = checkPackageJson();
  checkEnvironmentFiles();
  generateHealthReport();
  
  if (isHealthy) {
    console.log('\n🎉 المشروع في حالة جيدة!');
    console.log('🎉 Project is in good health!');
  } else {
    console.log('\n⚠️ يحتاج المشروع إلى بعض التحديثات');
    console.log('⚠️ Project needs some updates');
    console.log('\n💡 لتحديث المشروع تلقائياً، شغل:');
    console.log('💡 To update project automatically, run:');
    console.log('   pnpm run setup');
  }
}

runCheck();
