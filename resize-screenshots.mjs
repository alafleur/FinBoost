#!/usr/bin/env node

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Target dimensions for pixel-perfect rendering
const SIZES = {
  // Mobile: CSS width 240px (w-64 - p-2)  
  m240: { width: 240, height: 431 },  // 1x mobile
  m480: { width: 480, height: 862 },  // 2x mobile (retina)
  
  // Desktop: CSS width 304px (lg:w-80 - p-2)
  s304: { width: 304, height: 547 },  // 1x desktop  
  s608: { width: 608, height: 1094 }, // 2x desktop (retina)
};

// Source screenshot files (your current 341×612 images)
const SCREENSHOTS = [
  'Step 1 Learn & Complete Lessons_v1_1755745601876.png',
  'Step 2 Take Financial Actions_v1_1755745601875.png', 
  'Step 3 Climb the Leaderboard_v1_1755745601874.png',
  'Step 4 Win Real Cash Rewards_v1_1755745601873.png'
];

async function resizeScreenshot(inputPath, outputDir, baseName) {
  console.log(`📱 Processing: ${baseName}`);
  
  // Create all 4 sizes for this screenshot
  for (const [suffix, size] of Object.entries(SIZES)) {
    const outputPath = path.join(outputDir, `${baseName}_${suffix}.png`);
    
    try {
      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'fill',  // Stretch to exact dimensions (maintains text readability)
          kernel: sharp.kernel.lanczos3  // High-quality scaling algorithm
        })
        .png({ quality: 100 })  // Lossless PNG
        .toFile(outputPath);
        
      console.log(`  ✅ ${suffix}: ${size.width}×${size.height} → ${outputPath}`);
    } catch (error) {
      console.error(`  ❌ ${suffix}: Failed to resize - ${error.message}`);
    }
  }
  
  console.log('');
}

async function main() {
  const inputDir = './attached_assets';
  const outputDir = './client/src/assets/screenshots';
  
  console.log('🖼️  FinBoost Screenshot Resizer - Pixel Perfect Edition\n');
  console.log('Target dimensions for zero-blur rendering:');
  console.log('📱 Mobile:  240×431 (1×), 480×862 (2×)');
  console.log('🖥️  Desktop: 304×547 (1×), 608×1094 (2×)\n');
  
  // Create output directory
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`❌ Failed to create output directory: ${error.message}`);
      return;
    }
  }
  
  // Process each screenshot
  for (let i = 0; i < SCREENSHOTS.length; i++) {
    const filename = SCREENSHOTS[i];
    const inputPath = path.join(inputDir, filename);
    const baseName = `step${i + 1}`;
    
    try {
      await fs.access(inputPath);
      await resizeScreenshot(inputPath, outputDir, baseName);
    } catch (error) {
      console.log(`⚠️  Skipping ${filename} - File not found`);
    }
  }
  
  console.log('🎉 Screenshot resizing complete!');
  console.log('\nNext steps:');
  console.log('1. Import the new assets in HomeV3.tsx');
  console.log('2. Update the screenshots array with new image paths');  
  console.log('3. Test in browser - console should show "scaling: 100%"');
}

// Run the script
main().catch(console.error);