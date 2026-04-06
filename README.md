# 3D Timbre Space Visualizer

A sophisticated 3D audio visualizer built with **React**, **Three.js (React Three Fiber)**, and **Meyda**. This application maps real-time spectral features of audio (Centroid, Spread, Flux) to a 3D particle system, creating a dynamic "Timbre Space" visualization with sci-fi neon aesthetics.

## Features
- **Real-Time DSP**: Uses Meyda.js to extract specific descriptors (Centroid, Spread, Flux, RMS, MFCCs) 60 times per second.
- **3D Particle Cloud**: Renders a history trail of 500+ particles using InstancedMesh for high performance.
- **Timbre Mapping**:
  - **X-Axis**: Spectral Centroid (Brightness)
  - **Y-Axis**: Spectral Spread (Bandwidth)
  - **Z-Axis**: Spectral Flux (Rate of change)
- **Visual Polish**: UnrealBloomPass for neon glow effects and dynamic coloring.
- **Interactive UI**: Upload your own files or run the built-in test audio.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A modern browser with WebGL and Web Audio API support (Chrome, Firefox, Edge)

## Quick Start

<!-- one-command-install -->
> **One-command install** — clone, configure, and run in a single step:
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/jasperan/3d-audio/main/install.sh | bash
> ```
>
> <details><summary>Advanced options</summary>
>
> Override install location:
> ```bash
> PROJECT_DIR=/opt/myapp curl -fsSL https://raw.githubusercontent.com/jasperan/3d-audio/main/install.sh | bash
> ```
>
> Or install manually:
> ```bash
> git clone https://github.com/jasperan/3d-audio.git
> cd 3d-audio
> # See below for setup instructions
> ```
> </details>


1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.
4. Click **LOAD TEST** to play the included demo, or upload your own MP3.

## Appendix: System Test Results

Automated testing was performed to verify the end-to-end functionality of the system.

### Test Protocol
- **Environment**: Linux, Chrome (Headless/Automated)
- **Audio Source**: `ana_vaporeto_queen_v5.mp3` (aliased as `/test.mp3`)
- **Action**:
  1. Navigate to application root.
  2. Trigger "LOAD TEST" button.
  3. Wait 10 seconds for audio buffer to fill and WebGL context to stabilize.
  4. Capture full window screenshot.

### Outputs
- **Visual Confirmation**: The active rendering state shows a central "snake" trail of audio feature history, grid/axes helpers for spatial reference, and a UI overlay for loaded state.
- **Console Logs**: Confirmed `AudioContext` running and `Meyda` analysis callback firing.

### Performance
- **Frame Rate**: Consistent 60fps on tested hardware.
- **Particle Count**: 500 active history instances.
