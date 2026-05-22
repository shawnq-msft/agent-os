# Agent OS Office RPG

A static office-management RPG where the user plays the boss of an AI-agent office. Agents move between desks, task board, rest area, agent portal, voice/mail contact, and outsource service desk while tasks progress over time.

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
