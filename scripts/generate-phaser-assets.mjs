import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

await loadDotEnv();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://realtime-test-eastus2.cognitiveservices.azure.com';
const deployment = process.env.DEPLOYMENT_NAME || 'gpt-image-2';
const apiVersion = process.env.OPENAI_API_VERSION || '2025-04-01-preview';
const apiKey = process.env.AZURE_OPENAI_API_KEY;

const assets = [
  {
    file: 'assets/generated/phaser-empty-office.png',
    size: '1024x768',
    prompt: [
      'Use case: game assets.',
      'Asset type: empty 2D pixel art office background for a Phaser office RPG.',
      'Primary request: recreate the same layout style as the existing Agent OS generated office, but show only the empty room: blue-gray carpet tile floor, upper window wall with city skyline, clean walkable office floor, wall lighting, no furniture, no desks, no task board, no portal, no service desk, no sofa, no characters.',
      'Composition/framing: top-down three-quarter RPG office view, 4:3 landscape game background, clear open floor paths, same perspective as a furnished agent office.',
      'Style/medium: polished crisp pixel art, bright professional tech-office mood, game-ready background.',
      'Constraints: no text, no logo, no watermark, no characters, no furniture, no UI panels.'
    ].join('\n')
  },
  {
    file: 'assets/generated/phaser-props-chroma.png',
    transparentFile: 'assets/generated/phaser-props-transparent.png',
    size: '1024x1024',
    prompt: [
      'Use case: game assets.',
      'Asset type: strict 4 by 4 pixel art office prop sprite sheet for a Phaser office RPG.',
      'Primary request: sixteen isolated office props matching the Agent OS Azure pixel office style: employee desk, task board, agent portal, outsource service desk, secretary station, rest sofa, coffee table, plant, storage boxes, water cooler, server vending machine, wall screen, shelf, rug, small robot terminal, floor lamp.',
      'Composition/framing: exact 4 columns by 4 rows grid, each cell 256 by 256 pixels. One prop per cell, centered horizontally with its floor contact point near the lower middle of the cell. Leave equal padding and keep every prop fully inside its cell.',
      'Perspective: consistent top-down three-quarter RPG perspective, camera about 45 degrees above the floor. All props must share the same scale, angle, floor contact, lighting direction, and pixel density. Desks and sofa should look like they sit on the floor, not front-facing icons.',
      'Background: flat pure chroma green #00FF00 only, to be removed by post-processing.',
      'Style/medium: polished crisp pixel art, same palette and lighting as the Azure generated office background.',
      'Constraints: no text, no watermark, no shadows crossing cells, no full room background, no labels, no front-view catalog icons.'
    ].join('\n')
  },
  {
    file: 'assets/generated/phaser-agents-chroma.png',
    transparentFile: 'assets/generated/phaser-agents-transparent.png',
    size: '1024x1536',
    prompt: [
      'Use case: game assets.',
      'Asset type: strict chibi big-head agent character sprite sheet for a Phaser office RPG.',
      'Primary request: six AI agent employees as cute chibi big-head pixel art sprites: Codex coder, Hermes operations agent, Claude Code reviewer, Open Claw tool runner, secretary assistant, temporary portal agent.',
      'Character proportions: large expressive head about 55 to 60 percent of total character height, small body, short legs, readable face, office outfit, game mascot style. Characters should feel like big-head RPG sprites, not realistic adults.',
      'Composition/framing: exact 4 columns by 6 rows grid, each cell 256 by 256 pixels. Each row is one character. Columns are idle front, walk left foot, walk right foot, using device or phone. One centered full-body sprite per cell, feet near lower middle of the cell, equal padding.',
      'Perspective: same top-down three-quarter RPG perspective as the office, consistent scale across every frame and row, same lighting and pixel density.',
      'Background: flat pure chroma green #00FF00 only, to be removed by post-processing.',
      'Style/medium: crisp readable pixel art, bright tech office RPG, cute chibi mascot proportions.',
      'Constraints: no text, no watermark, no complex background, no overlapping characters, no frame borders, no realistic human proportions.'
    ].join('\n')
  }
];

if (!apiKey) {
  console.error('Missing AZURE_OPENAI_API_KEY. Set it in .env or your shell before running this script.');
  process.exit(1);
}

await mkdir('assets/generated', { recursive: true });

for (const asset of assets) {
  await generateWithRetry(asset);
  if (asset.transparentFile) removeChroma(asset.file, asset.transparentFile);
}

async function generateWithRetry(asset) {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await generate(asset);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      const delay = attempt * 15000;
      console.warn(`Retrying ${asset.file} after ${error.message}. Waiting ${delay / 1000}s.`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function generate(asset) {
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      prompt: asset.prompt,
      size: asset.size,
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

function removeChroma(input, output) {
  const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$inputPath = Join-Path (Get-Location) '${input.replaceAll("'", "''")}'
$outputPath = Join-Path (Get-Location) '${output.replaceAll("'", "''")}'
$src = [System.Drawing.Bitmap]::FromFile($inputPath)
$dest = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $src.Height; $y++) {
  for ($x = 0; $x -lt $src.Width; $x++) {
    $c = $src.GetPixel($x, $y)
    $isKey = ($c.G -gt 150 -and $c.R -lt 120 -and $c.B -lt 120 -and ($c.G - $c.R) -gt 70 -and ($c.G - $c.B) -gt 70)
    if ($isKey) {
      $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
    } else {
      $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
    }
  }
}
$src.Dispose()
$dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()
`;
  const encoded = Buffer.from(ps, 'utf16le').toString('base64');
  execFileSync('powershell', ['-NoProfile', '-EncodedCommand', encoded], { stdio: 'inherit' });
  console.log(`Saved ${output}`);
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
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}