import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('assets/layers', { recursive: true });
await mkdir('assets/sprites', { recursive: true });

const propLayers = [
  { id: 'task-board', label: 'Task Board', x: 28, y: 214, w: 252, h: 162, solid: true },
  { id: 'agent-portal', label: 'Agent Portal', x: 768, y: 220, w: 174, h: 126, solid: true },
  { id: 'service-desk', label: 'Service Desk', x: 724, y: 478, w: 184, h: 124, solid: true },
  { id: 'secretary-station', label: 'Secretary', x: 52, y: 420, w: 194, h: 116, solid: true },
  { id: 'rest-area', label: 'Rest Area', x: 34, y: 572, w: 260, h: 112, solid: false },
  { id: 'desk-1', label: 'Desk 1', x: 352, y: 274, w: 156, h: 124, solid: true },
  { id: 'desk-2', label: 'Desk 2', x: 562, y: 274, w: 156, h: 124, solid: true },
  { id: 'desk-3', label: 'Desk 3', x: 352, y: 462, w: 156, h: 124, solid: true },
  { id: 'desk-4', label: 'Desk 4', x: 562, y: 462, w: 156, h: 124, solid: true },
  { id: 'desk-5', label: 'Desk 5', x: 694, y: 332, w: 156, h: 124, solid: true },
  { id: 'desk-6', label: 'Desk 6', x: 218, y: 466, w: 156, h: 124, solid: true }
];

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>\n`;
const rect = (x, y, w, h, fill, stroke = '#102131', sw = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${sw ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;

const emptyOffice = svg(960, 720, `
  <defs>
    <pattern id="tile" width="48" height="48" patternUnits="userSpaceOnUse">
      <rect width="48" height="48" fill="#375267"/>
      <path d="M48 0H0V48" fill="none" stroke="#496b81" stroke-width="2" opacity="0.45"/>
    </pattern>
  </defs>
  ${rect(0, 0, 960, 120, '#cfe9f5')}
  ${rect(0, 120, 960, 600, 'url(#tile)')}
  ${rect(0, 108, 960, 14, '#102131')}
  ${rect(28, 16, 904, 78, '#8bd0ec', '#102131', 4)}
  ${rect(64, 54, 58, 40, '#6aa6c3')}${rect(142, 34, 74, 60, '#5d9fbd')}${rect(244, 48, 60, 46, '#6fb4cc')}
  ${rect(682, 42, 68, 52, '#5d9fbd')}${rect(778, 28, 80, 66, '#6aa6c3')}${rect(872, 58, 42, 36, '#6fb4cc')}
  ${rect(0, 0, 960, 720, 'none', '#172837', 8)}
`);

function deskSvg(label) {
  return svg(156, 124, `
    ${rect(0, 28, 156, 80, '#8f643f', '#102131', 4)}
    ${rect(12, 40, 132, 52, '#b98352', '#102131', 3)}
    ${rect(52, 8, 54, 36, '#101c26', '#dbe9ef', 4)}
    ${rect(112, 78, 26, 18, '#ffcf66', '#102131', 2)}
    ${rect(12, 98, 132, 12, '#5b3f2b')}
    <text x="14" y="118" fill="#102131" font-size="12" font-family="monospace" font-weight="700">${label}</text>
  `);
}

const propSvgs = {
  'task-board': svg(252, 162, `
    ${rect(0, 0, 252, 162, '#e9f2f5', '#102131', 4)}
    ${rect(16, 18, 64, 44, '#fff3bd', '#102131', 2)}${rect(94, 18, 64, 44, '#d6f4ff', '#102131', 2)}${rect(172, 18, 64, 44, '#ffd6cc', '#102131', 2)}
    ${rect(16, 82, 64, 44, '#d9f4ce', '#102131', 2)}${rect(94, 82, 64, 44, '#fff3bd', '#102131', 2)}${rect(172, 82, 64, 44, '#d6f4ff', '#102131', 2)}
  `),
  'agent-portal': svg(174, 126, `
    ${rect(0, 16, 174, 94, '#182b40', '#102131', 4)}
    <circle cx="87" cy="63" r="44" fill="#2bd1ff" opacity="0.95"/>
    <circle cx="87" cy="63" r="28" fill="#b895ff"/>
    <circle cx="87" cy="63" r="12" fill="#eaf6ff"/>
  `),
  'service-desk': svg(184, 124, `
    ${rect(12, 44, 160, 64, '#9c6842', '#102131', 4)}
    ${rect(36, 12, 74, 46, '#4c8db6', '#102131', 3)}
    ${rect(124, 26, 34, 30, '#eaf6ff', '#102131', 3)}
    ${rect(132, 34, 6, 6, '#102131')}${rect(146, 34, 6, 6, '#102131')}
  `),
  'secretary-station': svg(194, 116, `
    ${rect(0, 30, 194, 72, '#a87548', '#102131', 4)}
    ${rect(26, 10, 62, 36, '#101c26', '#dbe9ef', 4)}
    ${rect(116, 20, 42, 22, '#ffcf66', '#102131', 2)}
  `),
  'rest-area': svg(260, 112, `
    ${rect(22, 28, 158, 58, '#d07470', '#102131', 4)}
    ${rect(40, 10, 124, 28, '#e8938c', '#102131', 3)}
    ${rect(190, 52, 46, 32, '#8f643f', '#102131', 3)}
    ${rect(74, 86, 34, 12, '#4f6b68')}${rect(134, 86, 34, 12, '#4f6b68')}
  `)
};

for (let i = 1; i <= 6; i += 1) propSvgs[`desk-${i}`] = deskSvg(`Desk ${i}`);

await writeFile('assets/layers/empty-office.svg', emptyOffice);
for (const [name, content] of Object.entries(propSvgs)) await writeFile(`assets/layers/${name}.svg`, content);

const colors = ['#64d2a6', '#ffcf66', '#9fb7ff', '#ff8a7a', '#dda6ff'];
const names = ['C', 'H', 'R', 'O', 'T'];
const frames = colors.map((color, row) => [0, 1, 2].map((frame) => {
  const x = frame * 48;
  const y = row * 64;
  const legShift = frame === 1 ? 3 : frame === 2 ? -3 : 0;
  const armShift = frame === 1 ? -2 : frame === 2 ? 2 : 0;
  return `
    ${rect(x + 16, y + 3, 16, 16, '#ffd0a3', '#102131', 2)}
    ${rect(x + 20, y + 10, 3, 3, '#102131')}${rect(x + 27, y + 10, 3, 3, '#102131')}
    ${rect(x + 12, y + 20, 24, 28, color, '#102131', 2)}
    ${rect(x + 8 + armShift, y + 24, 6, 20, '#ffd0a3', '#102131', 2)}
    ${rect(x + 34 - armShift, y + 24, 6, 20, '#ffd0a3', '#102131', 2)}
    ${rect(x + 14 + legShift, y + 48, 8, 12, '#101820', '#102131', 1)}
    ${rect(x + 27 - legShift, y + 48, 8, 12, '#101820', '#102131', 1)}
    <text x="${x + 21}" y="${y + 38}" fill="#102131" font-size="12" font-family="monospace" font-weight="700">${names[row]}</text>
  `;
}).join('')).join('');

await writeFile('assets/sprites/agent-sprite-sheet.svg', svg(144, 320, frames));

await writeFile('assets/layers/manifest.json', JSON.stringify({
  source: 'assets/layers/empty-office.svg',
  spriteSheet: 'assets/sprites/agent-sprite-sheet.svg',
  stage: { width: 960, height: 720 },
  layers: propLayers.map(layer => ({ ...layer, asset: `assets/layers/${layer.id}.svg` }))
}, null, 2));

console.log('Generated transparent office layers, empty room, and rule-based sprite sheet.');