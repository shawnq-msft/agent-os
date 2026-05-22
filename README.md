# Agent OS Office RPG

A static office-management RPG where the user plays the boss of an AI-agent office. Agents move between desks, task board, rest area, agent portal, voice/mail contact, and outsource service desk while tasks progress over time.

The current mockup demo maps randomized agent state into scene animation: each agent walks between office zones, shows a status badge, and emits a live thought bubble. Use **Systems -> Demo Beat** to force a new animated office state immediately.

## Run

Open `index.html` in a browser. No package install is required for the game itself.

## Generate Azure Foundry Image Assets

Set your Azure key in the shell, then run the generator. Do not commit the key.

```powershell
$env:AZURE_OPENAI_API_KEY = "<your-key>"
$env:AZURE_OPENAI_ENDPOINT = "https://realtime-test-eastus2.cognitiveservices.azure.com"
$env:DEPLOYMENT_NAME = "gpt-image-2"
$env:OPENAI_API_VERSION = "2025-04-01-preview"
node scripts/generate-image-assets.mjs
```

Generated files are saved under `assets/generated/` and can be swapped into the UI.

## Generate Demo Layer Assets

The playable demo currently uses Azure `gpt-image-2` for the main office background in `assets/generated/office-background.png`. The transparent furniture layers and fixed-grid sprite sheet are deterministic engineering mock assets for collision, routing, and animation testing; they are not Azure image generations. Regenerate those deterministic assets with:

```powershell
node scripts/generate-vector-assets.mjs
```

The older `scripts/extract-office-layers.mjs` script can crop layers from a generated raster background, but those crops are not transparent enough for the current interactive layer model.
