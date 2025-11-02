#!/usr/bin/env node

/**
 * Build Script: Inject Version into Service Worker
 *
 * This script reads the version from package.json and injects it into:
 * 1. public/sw.js (for development)
 * 2. build/sw.js (for production)
 *
 * Usage:
 *   node scripts/inject-version.js [--build]
 *
 * Options:
 *   --build    Inject into build folder (production)
 *              Default: inject into public folder (development)
 */

const fs = require('fs');
const path = require('path');

// Get version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Determine target folder based on command line args
const isBuild = process.argv.includes('--build');
const targetFolder = isBuild ? 'build' : 'public';
const sourceFolder = 'public';

const sourcePath = path.join(__dirname, '..', sourceFolder, 'sw.js');
const targetPath = path.join(__dirname, '..', targetFolder, 'sw.js');

console.log(`[Version Injection] Starting...`);
console.log(`[Version Injection] Version: ${version}`);
console.log(`[Version Injection] Mode: ${isBuild ? 'production (build)' : 'development (public)'}`);

// Read the service worker file
let serviceWorkerContent;
try {
  serviceWorkerContent = fs.readFileSync(sourcePath, 'utf8');
} catch (error) {
  console.error(`[Version Injection] Error reading ${sourcePath}:`, error.message);
  process.exit(1);
}

// Replace VERSION_PLACEHOLDER with actual version
const updatedContent = serviceWorkerContent.replace(
  /VERSION_PLACEHOLDER/g,
  version
);

// Verify replacement happened
if (!updatedContent.includes(version)) {
  console.error('[Version Injection] Warning: VERSION_PLACEHOLDER not found in service worker!');
  console.error('[Version Injection] The service worker may already have a hardcoded version.');
}

// Write to target location
try {
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, updatedContent, 'utf8');
  console.log(`[Version Injection] ✅ Successfully wrote to ${targetPath}`);
  console.log(`[Version Injection] Service worker version: v${version}`);
} catch (error) {
  console.error(`[Version Injection] Error writing ${targetPath}:`, error.message);
  process.exit(1);
}

// Also update versionManager.js if it exists
const versionManagerPath = path.join(__dirname, '..', 'src', 'utils', 'versionManager.js');
if (fs.existsSync(versionManagerPath)) {
  try {
    let versionManagerContent = fs.readFileSync(versionManagerPath, 'utf8');

    // Replace the hardcoded version with a dynamic import
    versionManagerContent = versionManagerContent.replace(
      /export const APP_VERSION = ['"][\d.]+['"];/,
      `export const APP_VERSION = '${version}';`
    );

    fs.writeFileSync(versionManagerPath, versionManagerContent, 'utf8');
    console.log(`[Version Injection] ✅ Updated versionManager.js to v${version}`);
  } catch (error) {
    console.error('[Version Injection] Warning: Could not update versionManager.js:', error.message);
  }
}

console.log(`[Version Injection] Complete! 🎉`);
