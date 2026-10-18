import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const inputPath = path.resolve('public/favicon.PNG');
  if (!fs.existsSync(inputPath)) {
    console.error('File public/favicon.PNG not found!');
    return;
  }

  // 1. Get trimmed metadata
  const { data: trimmedBuffer, info: trimmedInfo } = await sharp(inputPath)
    .trim()
    .toBuffer({ resolveWithObject: true });

  console.log(`Original: 1254x1254 | Trimmed: ${trimmedInfo.width}x${trimmedInfo.height}`);

  // Create a square canvas with slight aesthetic margin (padding: 8%) so it doesn't touch the borders
  const maxDim = Math.max(trimmedInfo.width, trimmedInfo.height);
  const targetCanvasSize = Math.round(maxDim * 1.15); // 7.5% padding on each side

  // Generate crisp master PNG
  const masterBuffer = await sharp(trimmedBuffer)
    .resize({
      width: maxDim,
      height: maxDim,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: Math.round((targetCanvasSize - maxDim) / 2),
      bottom: Math.round((targetCanvasSize - maxDim) / 2),
      left: Math.round((targetCanvasSize - maxDim) / 2),
      right: Math.round((targetCanvasSize - maxDim) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Save as high-res favicon.png and icon-512.png
  await sharp(masterBuffer).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(masterBuffer).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(masterBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(masterBuffer).resize(48, 48).png().toFile('public/icon-48.png');
  await sharp(masterBuffer).resize(32, 32).png().toFile('public/icon-32.png');
  await sharp(masterBuffer).resize(16, 16).png().toFile('public/icon-16.png');
  await sharp(masterBuffer).resize(32, 32).png().toFile('app/icon.png');
  await sharp(masterBuffer).resize(180, 180).png().toFile('app/apple-icon.png');

  // Also create a rounded squircle badge version for mobile & PWA (dark/light friendly)
  const squircleSvg = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.12"/>
        </filter>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#bgGrad)" filter="url(#shadow)" stroke="#e2e8f0" stroke-width="4"/>
    </svg>
  `);

  const innerLogo = await sharp(trimmedBuffer)
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const appIconBuffer = await sharp(squircleSvg)
    .composite([{ input: innerLogo, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(appIconBuffer).resize(512, 512).png().toFile('public/app-icon-512.png');
  await sharp(appIconBuffer).resize(192, 192).png().toFile('public/app-icon-192.png');
  await sharp(appIconBuffer).resize(180, 180).png().toFile('public/apple-touch-icon-badge.png');

  // Generate multi-resolution ICO file (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    icoSizes.map(s => sharp(masterBuffer).resize(s, s).png().toBuffer())
  );

  let offset = 6 + (16 * icoSizes.length);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type (1 = ICO)
  header.writeUInt16LE(icoSizes.length, 4); // Number of images

  const dirEntries = [];
  for (let i = 0; i < icoSizes.length; i++) {
    const s = icoSizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0); // width
    entry.writeUInt8(s >= 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buf.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  const finalIco = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
  fs.writeFileSync('public/favicon.ico', finalIco);
  fs.writeFileSync('app/favicon.ico', finalIco);

  console.log('All favicons and app icons generated successfully!');
}

main().catch(console.error);
