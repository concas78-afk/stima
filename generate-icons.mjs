import sharp from 'sharp';

// Genera le icone PNG a partire dall'SVG vettoriale (64x64 viewBox)
const BASE = 64;
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 1024, name: 'icon-1024.png' },
];

for (const s of sizes) {
  const density = Math.round((72 * s.size) / BASE);
  await sharp('public/icon.svg', { density })
    .png()
    .toFile(`public/${s.name}`);
  console.log(`✓ ${s.name} (${s.size}x${s.size})`);
}

console.log('Fatto!');
