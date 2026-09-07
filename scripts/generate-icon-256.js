// Generate a 256x256 PNG icon, then convert to ICO using png-to-ico
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

// Generate a 256x256 RGBA PNG manually (simple format)
const width = 256;
const height = 256;

// PNG signature
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// We'll use zlib to create the PNG
const zlib = require('zlib');

// IHDR chunk
function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crc32val = crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32val >>> 0, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

// CRC32
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // color type (RGBA)
ihdr[10] = 0;  // compression
ihdr[11] = 0;  // filter
ihdr[12] = 0;  // interlace

// Pixel data with filter byte per scanline
const rawPixels = Buffer.alloc((width * 4 + 1) * height);
let pos = 0;
for (let y = 0; y < height; y++) {
  rawPixels[pos++] = 0; // filter: none
  for (let x = 0; x < width; x++) {
    const i = pos + (x * 4);
    if (x < 8 || x >= width - 8 || y < 8 || y >= height - 8) {
      // White border
      rawPixels[i] = 255;     // R
      rawPixels[i + 1] = 255; // G
      rawPixels[i + 2] = 255; // B
      rawPixels[i + 3] = 255; // A
    } else {
      // Blue gradient (legal/justice theme)
      const t = (x + y) / (width + height);
      rawPixels[i] = Math.round(24 + 60 * (1 - t));     // R
      rawPixels[i + 1] = Math.round(80 + 40 * t);       // G
      rawPixels[i + 2] = Math.round(180 + 75 * t);      // B
      rawPixels[i + 3] = 255;                            // A
    }
  }
  pos += width * 4;
}

const compressed = zlib.deflateSync(rawPixels);

// IEND
const iend = Buffer.alloc(0);

const png = Buffer.concat([
  sig,
  makeChunk('IHDR', ihdr),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', iend)
]);

// Convert to ICO
(async () => {
  const ico = await pngToIco([png]);
  const outPath = path.join(__dirname, '..', 'frontend', 'electron', 'assets', 'icon.ico');
  fs.writeFileSync(outPath, ico);
  console.log(`Generated ${outPath} (${ico.length} bytes)`);
})();
