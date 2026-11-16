# UpVid — Stickman YouTube Video Studio

An interactive AI-powered studio that transforms voiceover audio into fast-paced YouTube stickman explainer videos with customizable outfits, live concurrent scene rendering, kinetic typography, zoom-in/zoom-out camera rigs, motion graphics, and downloadable `.webm` video export.

## Features

- **Audio Input & AI Director**: Upload MP3/WAV/M4A/OGG/WEBM, record via microphone, or test with built-in sample voiceovers. Uses `@google/genai` (`gemini-3.5-transcribe` + `gemini-4-hydrogen`) for transcription and high-retention scene pacing.
- **Stickman Character Customizer**: Customize outfits (Hoodie, Suit & Tie, Lab Coat, Street Jacket, Trench Coat, T-Shirt), colors, headwear, eyewear, ink thickness, and canvas themes (Dark Studio, Chalkboard, Sketch Paper, Blueprint).
- **Stage-by-Stage Storyboard Editor**: Edit every scene's narration, kinetic headline, accent highlight word, duration, pose, emotion, camera motion (`zoom-in`, `zoom-out`, `dolly-punch`, `pan`, `shake`), fast transitions (`whip-left`, `zoom-burst`, `flash-cut`, `slide-up`, `ink-wipe`), motion graphics, props, and per-scene outfit overrides.
- **Concurrent Live Production & Export**: Watch scenes build concurrently in a live grid while previewing the 16:9 canvas timeline synced with audio and exporting a downloadable `.webm` video.

## Quick Start

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY in .env
npm run dev
```

Open `http://localhost:3000`.
