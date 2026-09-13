// Generates public/icons/icon.svg, icon-192.png, icon-512.png and public/favicon.svg
// with a tiny built-in rasterizer (no image libraries).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG1 = [0x0b, 0x1f, 0x16];
const BG2 = [0x07, 0x14, 0x10];
const GLOW = [0x40, 0xa0, 0x6e];
const CARD = [0xf6, 0xf2, 0xea];
const CARD_SHADOW = [0x03, 0x0a, 0x07];
const RED = [0xb4, 0x30, 0x2e];
const GOLD = [0xd6, 0xb2, 0x5e];

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function roundedRect(x, y, w, h, r) {
  const qx = Math.abs(x) - (w / 2 - r);
  const qy = Math.abs(y) - (h / 2 - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r; // signed distance
}

function rotate(x, y, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + y * s, -x * s + y * c];
}

/** Returns an RGB colour for normalised coordinates u,v in [0,1]. */
function shade(u, v, maskable) {
  const x = (u - 0.5) * 2; // -1..1
  const y = (v - 0.5) * 2;
  // Background: rounded square (or full bleed for maskable) with gradient and glow.
  const bgRadius = maskable ? 0 : 0.22;
  const bgDist = roundedRect(x, y, 2, 2, bgRadius);
  if (!maskable && bgDist > 0) return null;
  let color = mix(BG1, BG2, (y + 1) / 2);
  const glow = Math.max(0, 1 - Math.hypot(x, y * 1.3) / 0.9);
  color = mix(color, GLOW, glow * 0.3);

  const scale = maskable ? 0.8 : 1;
  const cards = [
    { rot: -16, dx: -0.16, dy: 0.02, w: 0.68, h: 0.94, red: false },
    { rot: 12, dx: 0.14, dy: 0.02, w: 0.68, h: 0.94, red: true },
  ];
  for (const card of cards) {
    const [lx, ly] = rotate((x - card.dx) / scale, (y - card.dy) / scale, card.rot);
    const shadow = roundedRect(lx - 0.02, ly - 0.05, card.w, card.h, 0.09);
    if (shadow < 0.06) color = mix(color, CARD_SHADOW, Math.max(0, 0.5 * (1 - shadow / 0.06)));
    const d = roundedRect(lx, ly, card.w, card.h, 0.09);
    if (d < 0) {
      color = CARD;
      // border
      if (d > -0.02) color = mix(CARD, GOLD, 0.7);
      // pips
      const cx = lx;
      const cy = ly;
      if (card.red) {
        // diamond in the centre
        if (Math.abs(cx) / 0.17 + Math.abs(cy) / 0.24 <= 1) color = RED;
        // small corner index
        if (Math.abs(cx + 0.22) / 0.05 + Math.abs(cy + 0.33) / 0.07 <= 1) color = RED;
        if (Math.abs(cx - 0.22) / 0.05 + Math.abs(cy - 0.33) / 0.07 <= 1) color = RED;
      } else {
        // spade: circle pair + triangle + stem
        const sx = cx;
        const sy = cy + 0.03;
        const inLeft = Math.hypot(sx + 0.1, sy - 0.02) < 0.12;
        const inRight = Math.hypot(sx - 0.1, sy - 0.02) < 0.12;
        const inTri = sy < 0.02 && sy > -0.26 && Math.abs(sx) < (sy + 0.26) * 0.75;
        const inStem = Math.abs(sx) < 0.035 && sy > 0.02 && sy < 0.24;
        const inBase = Math.abs(sx) < 0.1 && sy > 0.2 && sy < 0.25;
        if (inLeft || inRight || inTri || inStem || inBase) color = [0x1b, 0x1a, 0x17];
      }
    }
  }
  return color;
}

function render(size, maskable) {
  const ss = 3;
  const rows = [];
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(size * 4);
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = (px + (sx + 0.5) / ss) / size;
          const v = (py + (sy + 0.5) / ss) / size;
          const c = shade(u, v, maskable);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }
      const n = ss * ss;
      const cover = a / n / 255;
      row[px * 4] = cover > 0 ? Math.round(r / (a / 255)) : 0;
      row[px * 4 + 1] = cover > 0 ? Math.round(g / (a / 255)) : 0;
      row[px * 4 + 2] = cover > 0 ? Math.round(b / (a / 255)) : 0;
      row[px * 4 + 3] = Math.round(cover * 255);
    }
    rows.push(Buffer.concat([Buffer.from([0]), row]));
  }
  return encodePng(size, size, Buffer.concat(rows));
}

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, raw) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1f16"/>
      <stop offset="1" stop-color="#071410"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="55%">
      <stop offset="0" stop-color="#40a06e" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#40a06e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6f2ea"/>
      <stop offset="1" stop-color="#ebe5d8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect width="512" height="512" rx="112" fill="url(#glow)"/>
  <g transform="translate(215 262) rotate(-16)">
    <rect x="-87" y="-120" width="174" height="240" rx="22" fill="#030a07" opacity="0.5" transform="translate(6 12)"/>
    <rect x="-87" y="-120" width="174" height="240" rx="22" fill="url(#card)" stroke="#d6b25e" stroke-width="6"/>
    <path d="M0 -62c26 32 58 56 58 86 0 20-14 34-32 34-10 0-20-5-26-13 2 15 8 25 18 34H-18c10-9 16-19 18-34-6 8-16 13-26 13-18 0-32-14-32-34 0-30 32-54 58-86z" fill="#1b1a17"/>
  </g>
  <g transform="translate(292 262) rotate(12)">
    <rect x="-87" y="-120" width="174" height="240" rx="22" fill="#030a07" opacity="0.5" transform="translate(6 12)"/>
    <rect x="-87" y="-120" width="174" height="240" rx="22" fill="url(#card)" stroke="#d6b25e" stroke-width="6"/>
    <path d="M0 -70 48 0 0 70-48 0z" fill="#b4302e"/>
    <path d="M-58 -100 -46 -84 -58 -68 -70 -84z M58 100 46 84 58 68 70 84z" fill="#b4302e"/>
  </g>
</svg>
`;

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon.svg', svg);
writeFileSync('public/favicon.svg', svg);
writeFileSync('public/icons/icon-192.png', render(192, false));
writeFileSync('public/icons/icon-512.png', render(512, true));
console.log('icons written');
