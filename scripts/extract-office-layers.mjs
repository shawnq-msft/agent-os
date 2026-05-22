import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const manifestPath = 'assets/layers/manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const outDir = dirname(manifestPath);

await mkdir(outDir, { recursive: true });

const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$manifest = Get-Content -Raw '${manifestPath.replaceAll("'", "''")}' | ConvertFrom-Json
$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $manifest.source))
$scale = $src.Width / [double]$manifest.stage.width
$cropY = [double]$manifest.stage.sourceCropY
foreach ($layer in $manifest.layers) {
  $sx = [Math]::Max(0, [Math]::Round([double]$layer.x * $scale))
  $sy = [Math]::Max(0, [Math]::Round(([double]$layer.y + $cropY) * $scale))
  $sw = [Math]::Min($src.Width - $sx, [Math]::Round([double]$layer.w * $scale))
  $sh = [Math]::Min($src.Height - $sy, [Math]::Round([double]$layer.h * $scale))
  $dest = New-Object System.Drawing.Bitmap $sw, $sh
  $graphics = [System.Drawing.Graphics]::FromImage($dest)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.DrawImage($src, (New-Object System.Drawing.Rectangle 0,0,$sw,$sh), (New-Object System.Drawing.Rectangle $sx,$sy,$sw,$sh), [System.Drawing.GraphicsUnit]::Pixel)
  $out = Join-Path '${outDir.replaceAll("'", "''")}' ($layer.id + '.png')
  $dest.Save((Join-Path (Get-Location) $out), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $dest.Dispose()
}
$src.Dispose()
`;

const encoded = Buffer.from(ps, 'utf16le').toString('base64');
execFileSync('powershell', ['-NoProfile', '-EncodedCommand', encoded], { stdio: 'inherit' });
await writeFile(join(outDir, '.generated'), `Generated from ${manifest.source}\n`);
console.log(`Extracted ${manifest.layers.length} office layers into ${outDir}`);