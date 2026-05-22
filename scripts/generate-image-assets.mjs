import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

await loadDotEnv();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://realtime-test-eastus2.cognitiveservices.azure.com';
const deployment = process.env.DEPLOYMENT_NAME || 'gpt-image-2';
const apiVersion = process.env.OPENAI_API_VERSION || '2025-04-01-preview';
const apiKey = process.env.AZURE_OPENAI_API_KEY;

const assets = [
  {
    file: 'assets/generated/office-background.png',
    prompt: [
      'Use case: game assets.',
      'Asset type: 2D pixel art office background for a management RPG.',
      'Primary request: an agent bot office in pixel art style with 6 desks, task board, agent portal, outsource service desk, rest area, secretary station, and clean walkable floor paths.',
      'Composition/framing: top-down three-quarter RPG office view, square canvas, no UI panels, no characters, no text labels, objects separated with readable silhouettes.',
      'Style/medium: polished pixel art, crisp edges, colorful but professional, game-ready background.',
      'Constraints: no watermark, no logo, no text, no blur, no realistic photo style.'
    ].join('\n')
  },
  {
    file: 'assets/generated/agent-sprite-sheet.png',
    prompt: [
      'Use case: game assets.',
      'Asset type: pixel art character sprite sheet for an office RPG.',
      'Primary request: six small agent employees as full-body pixel sprites: Codex coding agent, Hermes operations agent, Claude Code reviewer, Open Claw tool runner, secretary assistant, temporary portal agent.',
      'Composition/framing: transparent-looking sprite sheet layout on a flat solid light background, front-facing idle pose, each sprite separated with equal padding.',
      'Style/medium: crisp pixel art sprites, simple office outfits, readable silhouettes, game-ready.',
      'Constraints: no text, no watermark, no shadows crossing between sprites, no complex background.'
    ].join('\n')
  },
  {
    file: 'assets/generated/office-props.png',
    prompt: [
      'Use case: game assets.',
      'Asset type: pixel art prop sheet for an office RPG.',
      'Primary request: separate props for task board, agent portal, outsource service desk, rest sofa, secretary desk, employee desk, plants, storage boxes, coffee table, wall screen.',
      'Composition/framing: organized sprite sheet on a flat solid light background, each object isolated with padding.',
      'Style/medium: polished pixel art, crisp edges, matching office RPG background.',
      'Constraints: no text, no watermark, no perspective mismatch, no photorealism.'
    ].join('\n')
  }
];

if (!apiKey) {
  console.error('Missing AZURE_OPENAI_API_KEY. Set it in your shell before running this script.');
  process.exit(1);
}

await mkdir('assets/generated', { recursive: true });

for (const asset of assets) {
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      prompt: asset.prompt,
      size: '1024x1024',
      quality: 'high',
      n: 1
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Azure image generation failed for ${asset.file}: ${response.status} ${detail}`);
  }

  const result = await response.json();
  const image = result.data?.[0];
  if (!image) throw new Error(`Azure response did not include image data for ${asset.file}.`);

  let bytes;
  if (image.b64_json) {
    bytes = Buffer.from(image.b64_json, 'base64');
  } else if (image.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) throw new Error(`Could not download generated image for ${asset.file}.`);
    bytes = Buffer.from(await imageResponse.arrayBuffer());
  } else {
    throw new Error(`Azure response had neither b64_json nor url for ${asset.file}.`);
  }

  await mkdir(dirname(asset.file), { recursive: true });
  await writeFile(join(process.cwd(), asset.file), bytes);
  console.log(`Saved ${asset.file}`);
}

async function loadDotEnv() {
  let text;
  try {
    text = await readFile('.env', 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
