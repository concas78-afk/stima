import opentype from 'opentype.js';
import fs from 'fs';

// Carica il font Inter (variabile)
const font = opentype.parse(fs.readFileSync('inter.ttf'));

// Rende la "S" a dimensione target (~30px di larghezza)
const fontSize = 57;
const path = font.getPath('S', 0, 0, fontSize);
const bb = path.getBoundingBox();
const d = path.toPathData(2);

const cx = (bb.x1 + bb.x2) / 2;
const cy = (bb.y1 + bb.y2) / 2;

// Centra la S verticalmente/orizzontalmente nel quadrato 64x64
const tx = 32 - cx;
const ty = 34 - cy;

// Spunta in alto a destra, ben staccata dalla S
const check = 'M48 8 L52 12 L57 5';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#g)"/>
  <!-- S: riempita + stroke per renderla più "cicciona" -->
  <path d="${d}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)})" fill="#ffffff" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>
  <!-- Spunta -->
  <path d="${check}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

fs.writeFileSync('public/icon.svg', svg);
console.log('S larga:', (bb.x2 - bb.x1).toFixed(1) + 'px', '| alta:', (bb.y2 - bb.y1).toFixed(1) + 'px');
console.log('✓ public/icon.svg rigenerato (S grassetta + flag riposizionato)');
