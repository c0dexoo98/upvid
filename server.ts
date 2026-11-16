import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add it in Settings > Secrets to enable AI transcription and scene directing.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'upvid-studio' });
  });

  // 1. Transcribe uploaded voiceover audio & direct fast-paced YouTube stickman scenes
  app.post('/api/analyze-audio', async (req, res) => {
    try {
      const {
        audioBase64,
        mimeType = 'audio/wav',
        durationSeconds = 15,
        characterNotes = '',
        languageHint = 'auto',
      } = req.body ?? {};

      if (!audioBase64 || typeof audioBase64 !== 'string') {
        res.status(400).json({ error: 'Audio payload (audioBase64) is required.' });
        return;
      }

      const ai = getGeminiClient();

      // Step 1: Transcribe the audio cleanly with gemini-3.5-transcribe
      let transcriptText = '';
      try {
        const transcribeResp = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text:
                  languageHint === 'fa'
                    ? 'Transcribe this audio accurately in Persian (or the spoken language). Return only the transcript text.'
                    : 'Transcribe this audio accurately. Return only the spoken transcript text.',
              },
            ],
          },
        });
        transcriptText = (transcribeResp.text ?? '').trim();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(502).json({
          error: `Audio transcription failed: ${msg}`,
        });
        return;
      }

      const effectiveDuration = Math.max(4, Number(durationSeconds) || 15);
      const targetScenesCount = Math.max(3, Math.min(18, Math.round(effectiveDuration / 3.2)));

      // Step 2: Direct fast-paced YouTube stickman scenes with gemini-4-hydrogen
      const directorPrompt = `
You are an expert YouTube Stickman Video Director (in the style of fast-paced viral stickman explainer channels).
Given this audio transcript and total audio duration of ${effectiveDuration.toFixed(1)} seconds, break the video into ${targetScenesCount} high-retention scenes (about 2.5 to 4.5 seconds per cut).

Character Style Notes: ${characterNotes || 'Expressive YouTube stickman narrator'}
Transcript: "${transcriptText || '(Instrumental / non-verbal audio track — create an engaging visual hook storyboard matching the duration)'}"

Rules:
- Keep scene narration concise (the exact spoken phrase for that cut, in the same language as the transcript, or engaging Persian/English hook lines if transcript is empty).
- headline: short punchy 2-5 word kinetic title for on-screen motion graphics.
- highlightWord: 1 word from headline to highlight with an accent badge.
- Vary pose, emotion, camera (zoom-in, zoom-out, dolly-punch, pan-left, pan-right, shake), transition (whip-left, zoom-burst, flash-cut, slide-up, ink-wipe), and motionGraphic so edits feel fast and dynamic.
- Ensure startTime and endTime cover 0 to ${effectiveDuration.toFixed(1)} seconds continuously without gaps.
`;

      const sceneResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: directorPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    narration: { type: Type.STRING },
                    headline: { type: Type.STRING },
                    highlightWord: { type: Type.STRING },
                    pose: {
                      type: Type.STRING,
                      enum: [
                        'presenting',
                        'pointing-up',
                        'thinking',
                        'celebrating',
                        'shocked',
                        'typing',
                        'walking',
                        'idea',
                        'facepalm',
                        'chart-up',
                      ],
                    },
                    emotion: {
                      type: Type.STRING,
                      enum: ['happy', 'curious', 'excited', 'serious', 'shocked', 'cool'],
                    },
                    camera: {
                      type: Type.STRING,
                      enum: ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'dolly-punch', 'shake', 'static'],
                    },
                    transition: {
                      type: Type.STRING,
                      enum: ['whip-left', 'zoom-burst', 'flash-cut', 'slide-up', 'ink-wipe', 'cut'],
                    },
                    motionGraphic: {
                      type: Type.STRING,
                      enum: [
                        'kinetic-callout',
                        'chart-rise',
                        'spotlight-ring',
                        'arrow-flow',
                        'split-compare',
                        'lightning-pop',
                      ],
                    },
                    propKeyword: {
                      type: Type.STRING,
                      enum: [
                        'rocket',
                        'money',
                        'brain',
                        'laptop',
                        'clock',
                        'trophy',
                        'warning',
                        'youtube',
                        'lightbulb',
                        'chart',
                        'none',
                      ],
                    },
                  },
                  required: [
                    'startTime',
                    'endTime',
                    'narration',
                    'headline',
                    'highlightWord',
                    'pose',
                    'emotion',
                    'camera',
                    'transition',
                    'motionGraphic',
                    'propKeyword',
                  ],
                },
              },
            },
            required: ['transcript', 'scenes'],
          },
        },
      });

      const parsed = JSON.parse((sceneResponse.text ?? '{}').trim());
      res.json({
        transcript: parsed.transcript || transcriptText,
        scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze audio.';
      res.status(500).json({ error: message });
    }
  });

  // 2. Concurrent per-scene vector SVG illustration & motion refinement
  app.post('/api/generate-scene-visual', async (req, res) => {
    try {
      const {
        narration = '',
        headline = '',
        propKeyword = 'lightbulb',
        outfitColor = '#F97316',
        accentColor = '#38BDF8',
        characterNotes = '',
      } = req.body ?? {};

      const ai = getGeminiClient();

      const prompt = `
Create a clean, bold, flat-vector YouTube stickman explainer prop/diagram SVG illustration for this scene.
Scene Headline: "${headline}"
Narration: "${narration}"
Suggested Prop Theme: "${propKeyword}"
Color Palette: primary accent "${outfitColor}", secondary "${accentColor}", crisp white "#F8FAFC" and slate "#1E293B".
Character Style Context: "${characterNotes}"

Requirements for svgMarkup:
- Must be a valid standalone <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">...</svg>
- Bold 4px strokes, clean geometric shapes, dynamic explainer style (like charts, gadgets, icons, arrows, symbols).
- NO <script>, NO <foreignObject>, NO external URLs, NO <text> longer than 4 chars.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              svgMarkup: { type: Type.STRING },
              visualSummary: { type: Type.STRING },
            },
            required: ['svgMarkup', 'visualSummary'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        svgMarkup: parsed.svgMarkup || '',
        visualSummary: parsed.visualSummary || '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate scene visual.';
      res.status(500).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UpVid Stickman Studio running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start UpVid Studio server:', err);
  process.exit(1);
});
