#!/usr/bin/env node

/**
 * Post-build script to patch async_hooks imports in Cloudflare Pages build
 * This replaces async_hooks imports with our polyfill
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKER_JS = '.vercel/output/static/_worker.js/index.js';

console.log('🔧 Patching async_hooks imports...');

try {
  // Check if worker file exists
  if (!fs.existsSync(WORKER_JS)) {
    console.log('⚠️  Worker file not found, skipping patch');
    process.exit(0);
  }

  // Read worker content
  let content = fs.readFileSync(WORKER_JS, 'utf-8');

  // Replace async_hooks imports with our polyfill
  const polyfillContent = fs.readFileSync('./async_hooks.js', 'utf-8');

  // Inject polyfill at the beginning
  const injectedContent = `
// === async_hooks polyfill for Cloudflare Workers ===
${polyfillContent}
// === End of async_hooks polyfill ===

${content}
`;

  // Replace require/import statements for async_hooks
  let patchedContent = injectedContent
    .replace(/require\(['"]async_hooks['"]\)/g, '({ AsyncLocalStorage, AsyncResource, executionAsyncId, triggerAsyncId, createHook })')
    .replace(/from\s+['"]async_hooks['"]/g, 'from "data:text/javascript,export { AsyncLocalStorage, AsyncResource, executionAsyncId, triggerAsyncId, createHook }"');

  // Write patched content
  fs.writeFileSync(WORKER_JS, patchedContent);

  console.log('✅ Successfully patched async_hooks imports');
} catch (error) {
  console.error('❌ Error patching worker:', error.message);
  // Don't fail the build
  process.exit(0);
}
