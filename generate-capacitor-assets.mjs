import sharp from 'sharp';
import fs from 'fs';

// ---- Componenti "Stima" (dal font Inter, path reale) ----
const GRAD_DEF = `<defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>`;

// "S" grassetta (path Inter, con translate per centrarla)
const S_PATH = `<path d="M18.29 0.72Q13.80 0.72 10.51-0.72Q7.21-2.17 5.34-4.77Q3.48-7.38 3.23-10.85L8.66-10.85Q8.88-8.52 10.24-7Q11.61-5.48 13.74-4.75Q15.86-4.01 18.29-4.01Q21.10-4.01 23.34-4.93Q25.58-5.84 26.89-7.51Q28.19-9.18 28.19-11.38Q28.19-13.39 27.07-14.64Q25.94-15.89 24.07-16.70Q22.21-17.51 19.98-18.12L14.97-19.54Q9.96-20.96 7.18-23.60Q4.40-26.25 4.40-30.36Q4.40-33.87 6.29-36.50Q8.18-39.13 11.41-40.58Q14.64-42.03 18.65-42.03Q22.74-42.03 25.88-40.58Q29.03-39.13 30.85-36.64Q32.67-34.15 32.79-31L27.61-31Q27.25-34.04 24.71-35.69Q22.18-37.35 18.48-37.35Q15.81-37.35 13.79-36.47Q11.77-35.60 10.66-34.08Q9.55-32.56 9.55-30.62Q9.55-28.44 10.90-27.12Q12.25-25.80 14.10-25.06Q15.95-24.33 17.45-23.91L21.60-22.77Q23.27-22.32 25.29-21.54Q27.30-20.76 29.14-19.47Q30.98-18.17 32.16-16.18Q33.34-14.19 33.34-11.30Q33.34-7.90 31.58-5.18Q29.81-2.45 26.44-0.86Q23.07 0.72 18.29 0.72" transform="translate(13.71 54.65)" fill="#ffffff" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>`;

const CHECK_PATH = `<path d="M48 12 L52 16 L56 9" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

const S_AND_CHECK = S_PATH + '\n' + CHECK_PATH;

const svgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner}</svg>`;

// ---- 1. icon-only.png (1024): icona completa full-bleed con angoli stondati ----
const iconOnly = svgWrap(`${GRAD_DEF}<rect width="64" height="64" rx="14" fill="url(#g)"/>${S_AND_CHECK}`);

// ---- 2. icon-background.png (1024): solo gradiente (quadrato pieno, la maschera la applica il launcher) ----
const iconBg = svgWrap(`${GRAD_DEF}<rect width="64" height="64" fill="url(#g)"/>`);

// ---- 3. icon-foreground.png (1024): S + spunta nel safe-zone (trasparente) ----
// Contenuto (S+spunta) ~ bbox x[17,60] y[2,55], scala 0.7 e centra
const iconFg = svgWrap(`<g transform="translate(5.05 11.91) scale(0.7)">${S_AND_CHECK}</g>`);

// ---- 4/5. splash (2732): badge arrotondato centrato su sfondo ----
const badge = `<g transform="translate(1016 1016) scale(10.9375)"><rect width="64" height="64" rx="16" fill="url(#g)"/>${S_AND_CHECK}</g>`;
const splashLight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">${GRAD_DEF}<rect width="2732" height="2732" fill="#ffffff"/>${badge}</svg>`;
const splashDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">${GRAD_DEF}<rect width="2732" height="2732" fill="#0f172a"/>${badge}</svg>`;

fs.mkdirSync('assets', { recursive: true });

await sharp(Buffer.from(iconOnly)).resize(1024, 1024).png().toFile('assets/icon-only.png');
await sharp(Buffer.from(iconBg)).resize(1024, 1024).png().toFile('assets/icon-background.png');
await sharp(Buffer.from(iconFg)).resize(1024, 1024).png().toFile('assets/icon-foreground.png');
await sharp(Buffer.from(splashLight)).resize(2732, 2732).png().toFile('assets/splash.png');
await sharp(Buffer.from(splashDark)).resize(2732, 2732).png().toFile('assets/splash-dark.png');

console.log('✓ Asset Capacitor generati in assets/');
