import opentype from 'opentype.js';
import sharp from 'sharp';
import fs from 'fs';

// Carica il font Inter
const font = opentype.parse(fs.readFileSync('inter.ttf'));

// Converte una stringa in path SVG (carattere per carattere = evita bug GSUB/legature)
function textPath(text, size, startX, baselineY) {
  const scale = size / font.unitsPerEm;
  let x = startX;
  const parts = [];
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    if (glyph && glyph.index !== 0 && ch.trim() !== '') {
      parts.push(glyph.getPath(x, baselineY, size).toPathData(2));
    }
    x += (glyph ? glyph.advanceWidth : 0) * scale;
  }
  return parts.join(' ');
}

// "S" + spunta (componenti del logo Stima)
const S_PATH = `<path d="M18.29 0.72Q13.80 0.72 10.51-0.72Q7.21-2.17 5.34-4.77Q3.48-7.38 3.23-10.85L8.66-10.85Q8.88-8.52 10.24-7Q11.61-5.48 13.74-4.75Q15.86-4.01 18.29-4.01Q21.10-4.01 23.34-4.93Q25.58-5.84 26.89-7.51Q28.19-9.18 28.19-11.38Q28.19-13.39 27.07-14.64Q25.94-15.89 24.07-16.70Q22.21-17.51 19.98-18.12L14.97-19.54Q9.96-20.96 7.18-23.60Q4.40-26.25 4.40-30.36Q4.40-33.87 6.29-36.50Q8.18-39.13 11.41-40.58Q14.64-42.03 18.65-42.03Q22.74-42.03 25.88-40.58Q29.03-39.13 30.85-36.64Q32.67-34.15 32.79-31L27.61-31Q27.25-34.04 24.71-35.69Q22.18-37.35 18.48-37.35Q15.81-37.35 13.79-36.47Q11.77-35.60 10.66-34.08Q9.55-32.56 9.55-30.62Q9.55-28.44 10.90-27.12Q12.25-25.80 14.10-25.06Q15.95-24.33 17.45-23.91L21.60-22.77Q23.27-22.32 25.29-21.54Q27.30-20.76 29.14-19.47Q30.98-18.17 32.16-16.18Q33.34-14.19 33.34-11.30Q33.34-7.90 31.58-5.18Q29.81-2.45 26.44-0.86Q23.07 0.72 18.29 0.72" transform="translate(13.71 54.65)" fill="#ffffff" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>`;
const CHECK_PATH = `<path d="M48 12 L52 16 L56 9" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

const W = 1024, H = 500;

// Testo titolo e tagline (convertiti in path = nessuna dipendenza da font)
const titleD  = textPath('Stima', 128, 335, 265);
const taglineD = textPath('Preventivi e clienti, in tasca.', 33, 340, 330);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- Alone decorativo -->
  <circle cx="880" cy="90" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="470" r="180" fill="#ffffff" opacity="0.05"/>
  <!-- Logo S + spunta -->
  <g transform="translate(78 148) scale(3.35)">
    ${S_PATH}
    ${CHECK_PATH}
  </g>
  <!-- Titolo -->
  <path d="${titleD}" fill="#ffffff" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
  <!-- Tagline -->
  <path d="${taglineD}" fill="#dbeafe"/>
</svg>`;

fs.mkdirSync('assets', { recursive: true });
await sharp(Buffer.from(svg)).png().toFile('assets/play-feature-graphic.png');
console.log('✓ assets/play-feature-graphic.png (1024x500)');
