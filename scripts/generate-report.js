#!/usr/bin/env node

/**
 * 周报生成脚本
 *
 * 用法:
 *   node scripts/generate-report.js              # 生成当前周报告
 *   node scripts/generate-report.js --week last  # 生成上周报告
 *   node scripts/generate-report.js --since 2026-04-01 --until 2026-04-07
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 动态导入 TypeScript 模块需要使用 tsx 或编译后的代码
// 由于项目使用 TypeScript，我们需要通过 tsx 运行
console.log('⚠️  This script requires TypeScript modules.');
console.log('Please install tsx: npm install -D tsx');
console.log('Then run: npx tsx scripts/generate-report.ts');
console.log('');
console.log('Or use the npm script: npm run report');

process.exit(1);
