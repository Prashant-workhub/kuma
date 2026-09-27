import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.join(rootDir, 'public', 'favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Target mipmap directories and sizes for Android launcher icons
const mipmapSizes = [
  { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

// Circular SVG wrapper for round icon
const roundSvgBuffer = Buffer.from(`
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circleClip">
      <circle cx="50" cy="50" r="49" />
    </clipPath>
  </defs>
  <g clip-path="url(#circleClip)">
    <rect width="100" height="100" fill="#0c0e17" />
    <rect x="38" y="32" width="31" height="35" rx="5" fill="#242834" />
    <path d="M30 29.5 L38 34 V 66 L30 70.5 Z" fill="#FFFFFF" />
    <path d="M38 34 L38 66" stroke="#2c303f" stroke-width="0.8" />
    <rect x="38" y="34" width="4" height="32" fill="#1d202b" />
    <rect x="42" y="34" width="22" height="32" rx="3.5" fill="#FFFFFF" />
    <rect x="46" y="42" width="10" height="2" rx="1" fill="#a4abb6" />
    <rect x="46" y="48" width="12" height="2" rx="1" fill="#a4abb6" />
    <rect x="46" y="54" width="8" height="2" rx="1" fill="#a4abb6" />
    <circle cx="71" cy="33.5" r="9.5" fill="#5F6DF8" stroke="#0c0e17" stroke-width="2" />
    <path d="M71 29 V38 M66.5 33.5 H75.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>
`);

// Foreground SVG wrapper for adaptive launcher icon (centered at ~60% safe area)
const foregroundSvgBuffer = Buffer.from(`
<svg viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(21.6, 21.6) scale(0.648)">
    <rect width="100" height="100" rx="28" fill="#0c0e17" />
    <rect x="38" y="32" width="31" height="35" rx="5" fill="#242834" />
    <path d="M30 29.5 L38 34 V 66 L30 70.5 Z" fill="#FFFFFF" />
    <path d="M38 34 L38 66" stroke="#2c303f" stroke-width="0.8" />
    <rect x="38" y="34" width="4" height="32" fill="#1d202b" />
    <rect x="42" y="34" width="22" height="32" rx="3.5" fill="#FFFFFF" />
    <rect x="46" y="42" width="10" height="2" rx="1" fill="#a4abb6" />
    <rect x="46" y="48" width="12" height="2" rx="1" fill="#a4abb6" />
    <rect x="46" y="54" width="8" height="2" rx="1" fill="#a4abb6" />
    <circle cx="71" cy="33.5" r="9.5" fill="#5F6DF8" stroke="#0c0e17" stroke-width="2" />
    <path d="M71 29 V38 M66.5 33.5 H75.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>
`);

// Splash SVG generator
function createSplashSvg(width, height) {
  const iconSize = Math.min(width, height) * 0.35;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2 - 20;

  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0c0e17" />
  <g transform="translate(${iconX}, ${iconY}) scale(${iconSize / 100})">
    <rect width="100" height="100" rx="28" fill="#0c0e17" />
    <rect x="38" y="32" width="31" height="35" rx="5" fill="#242834" />
    <path d="M30 29.5 L38 34 V 66 L30 70.5 Z" fill="#FFFFFF" />
    <path d="M38 34 L38 66" stroke="#2c303f" stroke-width="0.8" />
    <rect x="38" y="34" width="4" height="32" fill="#1d202b" />
    <rect x="42" y="34" width="22" height="32" rx="3.5" fill="#FFFFFF" />
    <rect x="46" y="42" width="10" height="2" rx="1" fill="#a4abb6" />
    <rect x="46" y="48" width="12" height="2" rx="1" fill="#a4abb6" />
    <rect x="46" y="54" width="8" height="2" rx="1" fill="#a4abb6" />
    <circle cx="71" cy="33.5" r="9.5" fill="#5F6DF8" stroke="#0c0e17" stroke-width="2" />
    <path d="M71 29 V38 M66.5 33.5 H75.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  </g>
  <text x="${width / 2}" y="${iconY + iconSize + 50}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="900" font-size="${Math.max(24, iconSize * 0.22)}" text-anchor="middle" letter-spacing="-0.5">NoteIT</text>
  <text x="${width / 2}" y="${iconY + iconSize + 80}" fill="#5F6DF8" font-family="system-ui, sans-serif" font-weight="700" font-size="${Math.max(12, iconSize * 0.1)}" text-anchor="middle" letter-spacing="3">SCHOLAR AI</text>
</svg>
`);
}

async function generate() {
  console.log('Starting Android Icon & Splash Generation...');

  const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

  for (const item of mipmapSizes) {
    const targetDir = path.join(resDir, item.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Standard Launcher Icon
    await sharp(svgPath)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. Round Launcher Icon
    await sharp(roundSvgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 3. Foreground Launcher Icon
    await sharp(foregroundSvgBuffer)
      .resize(item.fgSize, item.fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated launcher icons for ${item.dir} (${item.size}px)`);
  }

  // Generate splash screens for drawable directories
  const splashTargets = [
    { dir: 'drawable', w: 512, h: 512 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const item of splashTargets) {
    const targetDir = path.join(resDir, item.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const splashBuffer = createSplashSvg(item.w, item.h);
    await sharp(splashBuffer)
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`Generated splash.png for ${item.dir} (${item.w}x${item.h})`);
  }

  console.log('Successfully generated all Android launcher icons and splash screens!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
