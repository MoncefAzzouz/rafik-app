import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const workspace = path.resolve(root, '..', '..');
const pics = path.join(workspace, 'pics ');
const backgroundPath = path.join(import.meta.dirname, 'rafik-route-background.png');
const iconPath = path.join(workspace, 'rafik-app', 'assets', 'rafik_app_icon.png');

const screens = [
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.19.07.png',
    slug: 'delivery-made-simple',
    title: ['Delivery made', 'simple'],
    subtitle: 'Book the right vehicle in just a few taps.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.19.11.png',
    slug: 'one-app-every-move',
    title: ['One app.', 'Every move.'],
    subtitle: 'From parcels to trucks, choose what fits.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.19.24.png',
    slug: 'set-your-route',
    title: ['Set your route'],
    subtitle: 'Pick precise locations directly on the map.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.19.39.png',
    slug: 'know-the-journey',
    title: ['Know the journey'],
    subtitle: 'Preview the route before you confirm.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.19.51.png',
    slug: 'built-around-your-needs',
    title: ['Built around', 'your needs'],
    subtitle: 'Add timing, cargo details and special notes.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.19.56.png',
    slug: 'review-with-confidence',
    title: ['Review with', 'confidence'],
    subtitle: 'Check every detail before sending your request.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.20.19.png',
    slug: 'you-are-all-set',
    title: ["You're all set"],
    subtitle: 'Your request is confirmed and ready to go.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.20.24.png',
    slug: 'every-order-organized',
    title: ['Every order,', 'organized'],
    subtitle: 'See status, schedule and route at a glance.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.20.29.png',
    slug: 'made-for-you',
    title: ['Made for you'],
    subtitle: 'Choose your language and manage your account.',
  },
  {
    file: 'Simulator Screenshot - iPhone 12 - 2026-09-08 at 16.20.50.png',
    slug: 'track-what-matters',
    title: ['Track what', 'matters'],
    subtitle: 'Follow active deliveries from your home screen.',
  },
];

function dataUri(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function esc(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrap(text, max = 34) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const bg = dataUri(backgroundPath);
const icon = dataUri(iconPath);

function defs(width, height) {
  return `
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#031A4A" stop-opacity=".52"/>
        <stop offset=".34" stop-color="#0755D9" stop-opacity=".08"/>
        <stop offset="1" stop-color="#031A4A" stop-opacity=".16"/>
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".24"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity=".09"/>
      </linearGradient>
      <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow dx="0" dy="30" stdDeviation="30" flood-color="#00163D" flood-opacity=".46"/>
      </filter>
      <filter id="smallShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#00163D" flood-opacity=".35"/>
      </filter>
      <clipPath id="iconClip"><rect x="0" y="0" width="100" height="100" rx="24"/></clipPath>
      <clipPath id="phoneClip"><rect x="0" y="0" width="960" height="2078" rx="48"/></clipPath>
      <clipPath id="tabletPhoneClip"><rect x="0" y="0" width="930" height="2013" rx="46"/></clipPath>
    </defs>
    <image href="${bg}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
    <rect width="${width}" height="${height}" fill="url(#shade)"/>
  `;
}

function brand(index, width, iconSize, x, y) {
  const number = String(index + 1).padStart(2, '0');
  return `
    <g transform="translate(${x} ${y})" filter="url(#smallShadow)">
      <rect width="${iconSize}" height="${iconSize}" rx="${Math.round(iconSize * .24)}" fill="#071B43"/>
      <image href="${icon}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#iconClip)"/>
    </g>
    <text x="${x + iconSize + 26}" y="${y + iconSize * .67}" fill="#FFFFFF" font-size="38" font-weight="800" letter-spacing="3">RAFIK</text>
    <text x="${width - x}" y="${y + iconSize * .65}" text-anchor="end" fill="#FFFFFF" fill-opacity=".78" font-size="28" font-weight="700" letter-spacing="2">${number} / 10</text>
  `;
}

function iphoneSvg(item, index) {
  const width = 1284;
  const height = 2778;
  const titleY = 285;
  const titleLines = item.title.map((line, i) =>
    `<tspan x="86" y="${titleY + i * 84}">${esc(line)}</tspan>`).join('');
  const subY = titleY + item.title.length * 84 + 28;
  const screenshot = dataUri(path.join(pics, item.file));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${defs(width, height)}
    <circle cx="1130" cy="430" r="220" fill="#72D9FF" fill-opacity=".10"/>
    ${brand(index, width, 82, 86, 84)}
    <text fill="#FFFFFF" font-family="Arial, sans-serif" font-size="76" font-weight="800" letter-spacing="-2">${titleLines}</text>
    <text x="88" y="${subY}" fill="#FFFFFF" fill-opacity=".86" font-family="Arial, sans-serif" font-size="31" font-weight="400">${esc(item.subtitle)}</text>
    <g transform="translate(139 615)" filter="url(#shadow)">
      <rect width="1006" height="2124" rx="68" fill="#FFFFFF" fill-opacity=".97"/>
    </g>
    <g transform="translate(162 638)">
      <image href="${screenshot}" width="960" height="2078" preserveAspectRatio="none" clip-path="url(#phoneClip)"/>
      <rect width="960" height="2078" rx="48" fill="none" stroke="#FFFFFF" stroke-opacity=".46" stroke-width="3"/>
    </g>
  </svg>`;
}

function ipadSvg(item, index) {
  const width = 2048;
  const height = 2732;
  const titleY = 620;
  const titleLines = item.title.map((line, i) =>
    `<tspan x="110" y="${titleY + i * 104}">${esc(line)}</tspan>`).join('');
  const subtitleLines = wrap(item.subtitle, 30);
  const subY = titleY + item.title.length * 104 + 62;
  const subs = subtitleLines.map((line, i) =>
    `<tspan x="112" y="${subY + i * 50}">${esc(line)}</tspan>`).join('');
  const screenshot = dataUri(path.join(pics, item.file));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${defs(width, height)}
    <circle cx="510" cy="2360" r="520" fill="#FFFFFF" fill-opacity=".055"/>
    <circle cx="255" cy="2200" r="245" fill="#64D8FF" fill-opacity=".08"/>
    ${brand(index, width, 90, 110, 105)}
    <g transform="translate(110 392)">
      <rect width="370" height="66" rx="33" fill="url(#glass)" stroke="#FFFFFF" stroke-opacity=".18"/>
      <circle cx="36" cy="33" r="8" fill="#73E5FF"/>
      <text x="60" y="42" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="1.5">MOVE • DELIVER • TRACK</text>
    </g>
    <text fill="#FFFFFF" font-family="Arial, sans-serif" font-size="88" font-weight="800" letter-spacing="-2">${titleLines}</text>
    <text fill="#FFFFFF" fill-opacity=".84" font-family="Arial, sans-serif" font-size="34" font-weight="400">${subs}</text>
    <g transform="translate(110 1230)">
      <rect width="720" height="196" rx="38" fill="url(#glass)" stroke="#FFFFFF" stroke-opacity=".18"/>
      <circle cx="78" cy="98" r="27" fill="#77E4FF"/>
      <circle cx="640" cy="98" r="27" fill="#FFFFFF" fill-opacity=".92"/>
      <path d="M105 98 C240 18 455 180 613 98" fill="none" stroke="#FFFFFF" stroke-opacity=".65" stroke-width="7" stroke-linecap="round" stroke-dasharray="16 18"/>
      <text x="76" y="166" text-anchor="middle" fill="#FFFFFF" fill-opacity=".82" font-family="Arial, sans-serif" font-size="21" font-weight="700">PICKUP</text>
      <text x="640" y="166" text-anchor="middle" fill="#FFFFFF" fill-opacity=".82" font-family="Arial, sans-serif" font-size="21" font-weight="700">ARRIVAL</text>
    </g>
    <text x="112" y="2544" fill="#FFFFFF" fill-opacity=".58" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="2">DELIVERY, DESIGNED AROUND YOU</text>
    <g transform="translate(1025 318)" filter="url(#shadow)">
      <rect width="978" height="2061" rx="68" fill="#FFFFFF" fill-opacity=".97"/>
    </g>
    <g transform="translate(1049 342)">
      <image href="${screenshot}" width="930" height="2013" preserveAspectRatio="none" clip-path="url(#tabletPhoneClip)"/>
      <rect width="930" height="2013" rx="46" fill="none" stroke="#FFFFFF" stroke-opacity=".46" stroke-width="3"/>
    </g>
  </svg>`;
}

async function render(svg, output, width, height) {
  const svgPath = output.replace(/\.png$/, '.svg');
  const profile = fs.mkdtempSync('/private/tmp/rafik-app-store-chrome-');
  fs.writeFileSync(svgPath, svg);
  fs.rmSync(output, { force: true });
  const child = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--no-sandbox',
    '--hide-scrollbars',
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-extensions',
    '--disable-sync',
    '--no-first-run',
    '--no-default-browser-check',
    '--force-device-scale-factor=1',
    '--run-all-compositor-stages-before-draw',
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    `--screenshot=${output}`,
    pathToFileURL(svgPath).href,
  ], { detached: true, stdio: 'ignore' });

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (fs.existsSync(output) && fs.statSync(output).size > 10000) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!fs.existsSync(output) || fs.statSync(output).size <= 10000) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    throw new Error(`Chrome did not finish rendering ${output}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  fs.unlinkSync(svgPath);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Chrome can briefly retain profile files after the screenshot is complete.
  }
}

for (const [index, item] of screens.entries()) {
  const number = String(index + 1).padStart(2, '0');
  await render(
    iphoneSvg(item, index),
    path.join(root, 'iphone-6.7', `${number}-${item.slug}.png`),
    1284,
    2778,
  );
  await render(
    ipadSvg(item, index),
    path.join(root, 'ipad-12.9', `${number}-${item.slug}.png`),
    2048,
    2732,
  );
}

console.log(`Rendered ${screens.length} iPhone images at 1284×2778.`);
console.log(`Rendered ${screens.length} iPad images at 2048×2732.`);
