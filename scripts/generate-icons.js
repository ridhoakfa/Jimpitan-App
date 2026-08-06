/**
 * Icon Generator Script for PWA
 * Generates all required icon sizes from logo MITRAWISESA
 * 
 * Usage:
 * 1. Install sharp: npm install sharp --save-dev
 * 2. Place mitrawisesa.png in public/ folder
 * 3. Run: node scripts/generateicon.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================================
// PERUBAHAN: Gunakan mitrawisesa.png sebagai master icon
// ==========================================================
const MASTER_ICON = path.join(__dirname, '..', 'public', 'mitrawisesa.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

// Icon sizes required for PWA
const SIZES = [
  72,   // Android small
  96,   // Android medium
  128,  // Android large
  144,  // Android extra large
  152,  // iOS
  192,  // Android & Chrome
  384,  // Android
  512   // Splash screen
];

// Favicon sizes
const FAVICON_SIZES = [16, 32, 48];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from MITRAWISESA logo...\n');

  // Check if master icon exists
  if (!fs.existsSync(MASTER_ICON)) {
    console.error('❌ MITRAWISESA logo not found!');
    console.error(`   Please ensure public/mitrawisesa.png exists`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    // Get master icon info
    const metadata = await sharp(MASTER_ICON).metadata();
    console.log(`📐 Master icon: ${metadata.width}x${metadata.height} ${metadata.format}\n`);

    if (metadata.width < 512 || metadata.height < 512) {
      console.warn('⚠️  Warning: Master icon is smaller than 512x512');
      console.warn('   Recommended minimum: 512x512 for best quality\n');
    }

    // Generate each size
    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      
      await sharp(MASTER_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    // Generate favicons
    console.log('\n🎨 Generating favicons...\n');
    
    for (const size of FAVICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `favicon-${size}x${size}.png`);
      
      await sharp(MASTER_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: favicon-${size}x${size}.png`);
    }

    // Generate apple-touch-icon (180x180 for retina)
    const appleTouchPath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
    await sharp(MASTER_ICON)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(appleTouchPath);
    
    console.log('✅ Generated: apple-touch-icon.png');

    // Generate favicon.ico (multi-size)
    // Sharp doesn't directly support .ico, so we generate PNGs and then use a tool, but we can just use the 32x32 PNG as favicon.ico replacement
    // We'll generate a single favicon.ico using another approach, but we can just use favicon-32x32.png as favicon.ico
    
    // For compatibility, copy favicon-32x32.png to favicon.ico (if you have a tool to convert, but we'll just use PNG)
    // Most modern browsers support PNG favicon, so we can use favicon-32x32.png directly.
    // But we still generate favicon.ico from the 32x32 PNG using sharp's toFormat('ico') if supported.
    // Sharp doesn't support .ico natively, so we'll just keep using favicon-32x32.png as favicon.
    // For .ico generation, we can use 'png-to-ico' or similar, but we'll just rely on the PNG fallback.
    // We'll copy favicon-32x32.png to favicon.ico for compatibility.
    const fav32Path = path.join(OUTPUT_DIR, 'favicon-32x32.png');
    const icoPath = path.join(OUTPUT_DIR, 'favicon.ico');
    if (fs.existsSync(fav32Path)) {
      fs.copyFileSync(fav32Path, icoPath);
      console.log('✅ Generated: favicon.ico (from favicon-32x32.png)');
    }

    // Generate favicon.svg (we can just copy mitrawisesa.png? but SVG is different, we'll keep existing)
    // We'll create a simple SVG based on the master icon? Actually we can just use mitrawisesa.png as is.
    // But favicon.svg might be used for browser tabs. We'll generate a simple SVG placeholder.
    // Since we don't have an SVG version, we can just keep the existing favicon.svg or create a simple one.
    // For simplicity, we'll keep favicon.svg as is, or we can generate a generic SVG.
    // But to be safe, we'll keep the existing favicon.svg or create one from the PNG? That's complex.
    // We'll just keep the existing favicon.svg (if any) or we can delete it.
    // We'll generate a simple SVG favicon with the logo text.
    // But for now, we'll just keep the PNGs.

    console.log('\n✨ All icons generated successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Check generated icons in public/ folder');
    console.log('   2. Update manifest.json with new icon paths');
    console.log('   3. Update index.html with correct favicon and apple-touch-icon');
    console.log('   4. Test PWA installation\n');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run generator
generateIcons().catch(console.error);