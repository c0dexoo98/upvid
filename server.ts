import 'dotenv/config';
import express from 'express';
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
      'GEMINI_API_KEY is not configured. Add it in Settings > Secrets to enable AI scriptwriting, TTS voiceover, and scene directing.'
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

function estimateWavDurationSeconds(wavBuf: Buffer): number {
  if (wavBuf.length < 44) return 15;
  const byteRate = wavBuf.readUInt32LE(28);
  if (!byteRate || byteRate <= 0) return 15;
  const dataBytes = Math.max(0, wavBuf.length - 44);
  return Math.max(4, Number((dataBytes / byteRate).toFixed(2)));
}

const SCENE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    startTime: { type: Type.NUMBER },
    endTime: { type: Type.NUMBER },
    narration: { type: Type.STRING },
    headline: { type: Type.STRING },
    highlightWord: { type: Type.STRING },
    thoughtBubble: { type: Type.STRING },
    sceneRole: {
      type: Type.STRING,
      enum: ['hook', 'story', 'mini-hook', 'climax', 'cta-outro'],
    },
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
    'thoughtBubble',
    'sceneRole',
    'pose',
    'emotion',
    'camera',
    'transition',
    'motionGraphic',
    'propKeyword',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'upvid-studio' });
  });

  // 1. Topic-only Auto-Pilot: writes viral YouTube script (Hook + Mini-Hooks + Like/Subscribe/Next-Video CTA) + TTS voiceover + Auto-Directed Scenes
  app.post('/api/generate-from-topic', async (req, res) => {
    try {
      const {
        topic = '',
        languageHint = 'fa',
        characterNotes = '',
        styleMode = 'comic-classic',
      } = req.body ?? {};

      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        res.status(400).json({ error: 'Video topic is required.' });
        return;
      }

      const ai = getGeminiClient();

      const scriptPrompt = `
You are an elite YouTube Retention Scriptwriter & Stickman Motion-Graphics Director.
Write an ultra-engaging, fast-paced YouTube Stickman video script about:
"${topic.trim()}"

Language: ${languageHint === 'fa' ? 'Persian (Farsi) — conversational, energetic, magnetic YouTube storytelling tone' : 'English — punchy, high-retention YouTube storytelling tone'}
Visual Style Mode: ${styleMode}
Character Notes: ${characterNotes || 'Expressive comic-ink stickman'}

Mandatory Structure (6 to 8 fast scenes, ~3 to 4 seconds each):
1. Scene 1 (sceneRole: "hook"): Explosive 0-3s curiosity hook that stops scrolling immediately.
2. Scenes 2-5 (mix of "story" and at least 2 "mini-hook" scenes): Escalating value, surprising twists, and mini-hooks (e.g. "اما صبر کن، تازه اولشه..." / "Wait, here is the crazy part...") so viewers stay glued until the end.
3. Scene N-1 (sceneRole: "climax"): Big payoff / revelation.
4. Final Scene (sceneRole: "cta-outro"): Warm, high-converting call-to-action urging viewers to Like, Subscribe, and watch the next video!

Return JSON with:
- fullScript: the complete spoken narration joined smoothly
- scenes: array of 6-8 fast-cut scenes with varied zooms (zoom-in, zoom-out, dolly-punch, shake), rapid transitions (whip-left, zoom-burst, flash-cut, slide-up, ink-wipe), 1-char thoughtBubble ('؟', '!', '⚡', '★', or ''), and punchy 2-5 word kinetic headlines + highlightWord.
`;

      const scriptResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: scriptPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullScript: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: SCENE_SCHEMA,
              },
            },
            required: ['fullScript', 'scenes'],
          },
        },
      });

      const parsed = JSON.parse((scriptResp.text ?? '{}').trim());
      const fullScript = String(parsed.fullScript || '').trim();
      const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];

      // Synthesize real spoken WAV voiceover via gemini-3.8-flash-lite-tts
      let audioBase64: string | null = null;
      let audioDuration = 0;
      let ttsWarning: string | null = null;

      if (fullScript) {
        try {
          const ttsResp = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: fullScript,
                    speechMetadata: {
                      style: 'Energetic, engaging YouTube stickman storyteller, clear pacing',
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' },
                },
              },
            },
          });

          const rawAudio =
            ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (rawAudio) {
            audioBase64 = rawAudio;
            audioDuration = estimateWavDurationSeconds(Buffer.from(rawAudio, 'base64'));
          }
        } catch (ttsErr) {
          ttsWarning =
            ttsErr instanceof Error
              ? ttsErr.message
              : 'TTS voiceover generation failed.';
        }
      }

      res.json({
        transcript: fullScript,
        scenes,
        audioBase64,
        audioMimeType: audioBase64 ? 'audio/wav' : null,
        audioDuration,
        ttsWarning,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate video from topic.';
      res.status(500).json({ error: message });
    }
  });

  // 2. Transcribe uploaded voiceover audio & auto-direct fast-paced YouTube stickman scenes
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
      const targetScenesCount = Math.max(4, Math.min(20, Math.round(effectiveDuration / 3.0)));

      const directorPrompt = `
You are an expert YouTube Stickman Video Director (comic-ink explainer style).
Given this audio transcript and total audio duration of ${effectiveDuration.toFixed(1)} seconds, automatically edit & break the video into ${targetScenesCount} high-retention fast cuts (2.5 to 4 seconds each).

Character Style Notes: ${characterNotes || 'Expressive comic-ink stickman narrator'}
Transcript: "${transcriptText || '(Instrumental track — generate visual story beats)'}"

Rules:
- First scene should be sceneRole: "hook", middle beats include "mini-hook" & "story", final scene "cta-outro".
- headline: punchy 2-5 word kinetic text; highlightWord: 1 accent word; thoughtBubble: '؟', '!', '⚡', '★', or ''.
- Vary zoom-in, zoom-out, dolly-punch, whip-left, zoom-burst, flash-cut, and motionGraphic dynamically across cuts.
- Ensure startTime and endTime cover 0 to ${effectiveDuration.toFixed(1)} seconds continuously.
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
                items: SCENE_SCHEMA,
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

  // 3. Concurrent per-scene comic-ink vector SVG illustration generation
  app.post('/api/generate-scene-visual', async (req, res) => {
    try {
      const {
        narration = '',
        headline = '',
        propKeyword = 'lightbulb',
        outfitColor = '#DC2626',
        accentColor = '#38BDF8',
        characterNotes = '',
        styleMode = 'comic-classic',
      } = req.body ?? {};

      const ai = getGeminiClient();

      const prompt = `
Create a bold, hand-inked comic-book style SVG prop/scene illustration (matching expressive stickman comic art with thick black ink strokes and cross-hatching) for this scene.
Style Mode: "${styleMode}"
Scene Headline: "${headline}"
Narration: "${narration}"
Prop Theme: "${propKeyword}"
Palette: primary "${outfitColor}", accent "${accentColor}", crisp ink "#111827", highlight "#F8FAFC".
Context: "${characterNotes}"

Requirements for svgMarkup:
- Standalone <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">...</svg>
- Thick 4-6px ink outlines, comic cross-hatch shading lines, dynamic explainer visual metaphor.
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
