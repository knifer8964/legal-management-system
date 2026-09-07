// Generate a simple icon.ico file using a minimal valid ICO format
const fs = require('fs');
const path = require('path');

// Create a 32x32 RGBA BMP icon in ICO format
const width = 32;
const height = 32;
const bpp = 32;

// ICO header (6 bytes) + 1 directory entry (16 bytes) + BMP header (40 bytes) + pixel data
const headerSize = 6;
const dirEntrySize = 16;
const bmpHeaderSize = 40;
const pixelDataSize = width * height * 4; // RGBA
const andMaskSize = width * height / 8; // 1bit AND mask
const imageSize = bmpHeaderSize + pixelDataSize + andMaskSize;
const totalSize = headerSize + dirEntrySize + imageSize;

const buf = Buffer.alloc(totalSize, 0);
let offset = 0;

// ICO header
buf.writeUInt16LE(0, offset); offset += 2; // reserved
buf.writeUInt16LE(1, offset); offset += 2; // type: icon
buf.writeUInt16LE(1, offset); offset += 2; // count: 1 image

// Directory entry
buf.writeUInt8(width, offset); offset += 1;     // width
buf.writeUInt8(height, offset); offset += 1;    // height
buf.writeUInt8(0, offset); offset += 1;         // color count (0 = 256+)
buf.writeUInt8(0, offset); offset += 1;         // reserved
buf.writeUInt16LE(1, offset); offset += 2;      // planes
buf.writeUInt16LE(bpp, offset); offset += 2;    // bpp
buf.writeUInt32LE(imageSize, offset); offset += 4; // image size
buf.writeUInt32LE(headerSize + dirEntrySize, offset); offset += 4; // image offset

// BMP header (BITMAPINFOHEADER)
buf.writeUInt32LE(bmpHeaderSize, offset); offset += 4; // header size
buf.writeInt32LE(width, offset); offset += 4;          // width
buf.writeInt32LE(height * 2, offset); offset += 4;     // height (doubled for ICO)
buf.writeUInt16LE(1, offset); offset += 2;             // planes
buf.writeUInt16LE(bpp, offset); offset += 2;           // bpp
buf.writeUInt32LE(0, offset); offset += 4;             // compression
buf.writeUInt32LE(pixelDataSize, offset); offset += 4; // image size
buf.writeInt32LE(0, offset); offset += 4;              // x ppm
buf.writeInt32LE(0, offset); offset += 4;              // y ppm
buf.writeUInt32LE(0, offset); offset += 4;             // colors used
buf.writeUInt32LE(0, offset); offset += 4;             // important colors

// Pixel data - simple blue gradient with white border (legal/justice theme)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = offset + (y * width + x) * 4;
    // BGRA format
    if (x < 2 || x >= width-2 || y < 2 || y >= height-2) {
      // White border
      buf[i] = 255;     // B
      buf[i+1] = 255;   // G
      buf[i+2] = 255;   // R
      buf[i+3] = 255;   // A
    } else {
      // Blue gradient
      const t = (x + y) / (width + height);
      buf[i] = Math.round(180 + 75 * t);     // B
      buf[i+1] = Math.round(80 + 40 * t);    // G
      buf[i+2] = Math.round(24 + 60 * (1-t)); // R
      buf[i+3] = 255;                         // A
    }
  }
}
offset += pixelDataSize;

// AND mask (all zeros = fully visible)
// Already zero-filled

const outPath = path.join(__dirname, '..', 'frontend', 'electron', 'assets', 'icon.ico');
fs.writeFileSync(outPath, buf);
console.log(`Generated ${outPath} (${buf.length} bytes)`);
