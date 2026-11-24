# Cha Studio — Audio Visualizer (prototype)

Cha Studio is a runnable browser-based audio visualizer editor. This is an original implementation inspired by common audio-visualizer workflows, not a copy of Specterr.

## Features
- Upload and preview local audio (browser-supported audio formats)
- Live audio analysis using Web Audio
- Visualizer styles: Spectrum, Mirror, Wave, Particles, Circular
- Density, amplitude, vertical position, and animated background motion controls
- Reactive ambient glow, color selection, and preset swatches
- Editable song title and artist, with text color, scale, and position
- Canvas aspect ratios: 16:9, 9:16, 1:1, 4:5
- Canvas export targets: 720p and 1080p
- Record preview + audio into a WebM video (MediaRecorder)
- Save/load editable settings as JSON
- Autosave settings in the browser's local storage

## Run locally

Requires Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## Run modes
- Development: `npm run dev`
- Start (network accessible): `npm start`
- Production bundle: `npm run build`
- Preview production bundle: `npm run preview` (after build)

## Export limitations
WebM recording depends on browser support for Canvas capture and MediaRecorder. MP4 export is not implemented yet. Project JSON stores editor settings only, not the uploaded song file; reload your audio after opening a project. This prototype has no full timeline editor.

## Browser notes
A modern Chromium-based browser is recommended. Audio must be loaded before playback or video export.
