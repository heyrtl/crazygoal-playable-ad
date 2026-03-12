# Crazy Goal Playable Ad

## Overview
Crazy Goal is a high-performance 3D soccer playable ad designed for extreme mobile compatibility and engagement. This project follows the **"Everything is Code"** philosophy, ensuring a sub-60KB single-file deployment perfect for major ad networks.

## Engineering Philosophy
- **Everything is Code**: No external assets, no CDNs, and no separate libraries. Everything is bundled into a single, offline-capable `index.html`.
- **Hybrid Rendering**: Combines the raw performance of a `<canvas>` loop for game entities with the ease of **Preact** for UI overlays.
- **Zero GC Stutters**: Utilizes Object Pooling for high-frequency entities to prevent frame-rate drops on mobile devices.
- **Extreme Optimization**: Aggressive code mangling via Terser and asset inlining via Vite.

## Tech Stack
- **Engine**: Three.js (Core 3D Rendering)
- **UI**: Preact (Lightweight React alternative)
- **Styling**: Tailwind CSS v4
- **Build**: Vite + `vite-plugin-singlefile` + Terser

## Development

### Prerequisites
- Node.js

### Local Setup
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to play.

### Build for Production
To generate the optimized ad:
```bash
npm run build
```
The build artifact will be located in a timestamped folder under `dist/` (e.g., `dist/2026-03-12T13-40-00-000Z/index.html`).

## Ad Network Compliance
This ad is designed to be compatible with:
- Unity Ad Tester
- AppLovin
- IronSource
- Facebook (using `FbPlayableAd` hooks)
- Google (using `ExitApi` hooks)

The final output is guaranteed to be a single HTML file with all CSS, JS, and media inlined.
