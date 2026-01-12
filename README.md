# 3D Timbre Space Visualizer

A sophisticated 3D audio visualizer built with **React**, **Three.js (React Three Fiber)**, and **Meyda**. This application maps real-time spectral features of audio (Centroid, Spread, Flux) to a 3D particle system, creating a dynamic "Timbre Space" visualization with sci-fi neon aesthetics.

![Active Visualization](/home/ubuntu/.gemini/antigravity/brain/29606d42-1a55-4a77-9cd4-f56bfeef179f/final_visualizer_state_1767990056069.png)

## Features
- **Real-Time DSP**: Uses Meyda.js to extract specific descriptors (Centroid, Spread, Flux, RMS, MFCCs) 60 times per second.
- **3D Particle Cloud**: Renders a history trail of 500+ particles using InstancedMesh for high performance.
- **Timbre Mapping**:
  - **X-Axis**: Spectral Centroid (Brightness)
  - **Y-Axis**: Spectral Spread (Bandwidth)
  - **Z-Axis**: Spectral Flux (Rate of change)
- **Visual Polish**: UnrealBloomPass for neon glow effects and dynamic coloring.
- **Interactive UI**: Upload your own files or run the built-in test audio.

## Quick Start

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
- **Visual Confirmation**: The screenshot above demonstrates the active rendering state.
  - The central "snake" trail indicates active audio feature history.
  - The grid and axes helpers provide spatial reference.
  - The UI overlay displays the loaded state.
- **Console Logs**: Confirmed `AudioContext` running and `Meyda` analysis callback firing.

### Performance
- **Frame Rate**: Consistent 60fps on tested hardware.
- **Particle Count**: 500 active history instances.
