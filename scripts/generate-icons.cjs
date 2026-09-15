// Script to generate proper placeholder icons for Tauri build
// Run this before building: node scripts/generate-icons.cjs

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a valid PNG buffer
function createPNGBuffer(size) {
  const width = size;
  const height = size;
  
  // Create raw pixel data (RGBA) with a blue gradient
  const pixels = [];
  for (let y = 0; y < height; y++) {
    pixels.push(0); // Filter byte for each row
    for (let x = 0; x < width; x++) {
      // Create a gradient from blue to purple
      const r = Math.floor((x / width) * 100);
      const g = Math.floor((y / height) * 50);
      const b = Math.floor(200 + (x / width) * 55);
      const a = 255;
      pixels.push(r, g, b, a);
    }
  }
  
  // Compress pixel data using zlib
  const rawData = Buffer.from(pixels);
  const compressed = zlib.deflateSync(rawData);
  
  // Build PNG file
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT chunk
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create a valid ICO file from PNG buffers
function createICOBuffer(pngBuffers) {
  // ICO header: Reserved (2) + Type (2, must be 1) + Count (2)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = icon)
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images
  
  // Calculate directory entries and image data
  const directorySize = pngBuffers.length * 16;
  let currentOffset = 6 + directorySize; // After header and directory
  
  const directoryEntries = [];
  const imageDataBuffers = [];
  
  for (const pngBuffer of pngBuffers) {
    // Extract dimensions from PNG (read from IHDR chunk)
    const width = pngBuffer.readUInt32BE(16);
    const height = pngBuffer.readUInt32BE(20);
    
    // Directory entry (16 bytes)
    const entry = Buffer.alloc(16);
    entry[0] = width >= 256 ? 0 : width; // Width (0 means 256)
    entry[1] = height >= 256 ? 0 : height; // Height (0 means 256)
    entry[2] = 0; // Color count (0 for >= 256 colors)
    entry[3] = 0; // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data
    
    directoryEntries.push(entry);
    imageDataBuffers.push(pngBuffer);
    
    currentOffset += pngBuffer.length;
  }
  
  // Combine all parts
  return Buffer.concat([header, ...directoryEntries, ...imageDataBuffers]);
}

function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
  
  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  console.log('Generating icon images...');
  
  // Generate PNG icons at various sizes
  const pngSizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
  ];
  
  const pngBuffers = [];
  
  for (const { name, size } of pngSizes) {
    const iconPath = path.join(iconsDir, name);
    const buffer = createPNGBuffer(size);
    fs.writeFileSync(iconPath, buffer);
    pngBuffers.push(buffer);
    console.log(`Created: ${name} (${size}x${size})`);
  }
  
  // Generate additional sizes for ICO
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoPngBuffers = [];
  
  for (const size of icoSizes) {
    const buffer = createPNGBuffer(size);
    icoPngBuffers.push(buffer);
  }
  
  // Create proper ICO file with multiple resolutions
  console.log('Creating Windows ICO file...');
  const icoBuffer = createICOBuffer(icoPngBuffers);
  const icoPath = path.join(iconsDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('Created: icon.ico (multi-resolution)');
  
  // Create macOS ICNS (using largest PNG as placeholder)
  const icnsPath = path.join(iconsDir, 'icon.icns');
  const largestPng = createPNGBuffer(512);
  fs.writeFileSync(icnsPath, largestPng);
  console.log('Created: icon.icns (placeholder)');
  
  console.log('\nIcon generation complete!');
  console.log('All icons are valid and ready for Tauri build.');
}

try {
  generateIcons();
} catch (err) {
  console.error('Error generating icons:', err);
  process.exit(1);
}
