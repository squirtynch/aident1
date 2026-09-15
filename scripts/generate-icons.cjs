// Script to generate placeholder icons for Tauri build
// Run this before building: node scripts/generate-icons.cjs

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG (minimal valid PNG)
const minimalPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, // compressed data
  0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, // 
  0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
  0x44, 0xAE, 0x42, 0x60, 0x82
]);

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icons
const iconSizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
];

iconSizes.forEach(({ name }) => {
  const iconPath = path.join(iconsDir, name);
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(iconPath, minimalPNG);
    console.log(`Created placeholder icon: ${name}`);
  }
});

// Create .ico file (Windows icon) - using minimal PNG as placeholder
const icoPath = path.join(iconsDir, 'icon.ico');
if (!fs.existsSync(icoPath)) {
  fs.writeFileSync(icoPath, minimalPNG);
  console.log('Created placeholder icon: icon.ico');
}

// Create .icns file (macOS icon) - using minimal PNG as placeholder
const icnsPath = path.join(iconsDir, 'icon.icns');
if (!fs.existsSync(icnsPath)) {
  fs.writeFileSync(icnsPath, minimalPNG);
  console.log('Created placeholder icon: icon.icns');
}

console.log('Icon generation complete!');
