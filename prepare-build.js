import fs from 'fs';
import path from 'path';

const buildDir = path.resolve('build');
const assetsDir = path.resolve('assets');

const srcIco = path.join(assetsDir, 'logo.ico');
const srcPng = path.join(assetsDir, 'logo.png');

const destIco = path.join(buildDir, 'icon.ico');
const destPng = path.join(buildDir, 'icon.png');

console.log('--- Preparing Desktop Build Directory ---');

// 1. Ensure build folder exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('Created build/ directory.');
} else {
  console.log('build/ directory already exists.');
}

// 2. Copy logo.ico -> icon.ico
if (fs.existsSync(srcIco)) {
  fs.copyFileSync(srcIco, destIco);
  console.log(`Copied: ${srcIco} -> ${destIco}`);
} else {
  console.warn(`Warning: Source icon not found at ${srcIco}`);
}

// 3. Copy logo.png -> icon.png
if (fs.existsSync(srcPng)) {
  fs.copyFileSync(srcPng, destPng);
  console.log(`Copied: ${srcPng} -> ${destPng}`);
} else {
  console.warn(`Warning: Source PNG not found at ${srcPng}`);
}

console.log('--- Desktop Build Directory Prepared Successfully ---\n');
