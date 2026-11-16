import { useCallback, useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import type {
  CanvasTheme,
  CharacterConfig,
  Language,
  SceneItem,
  StudioStage,
} from './types/studio';
import { COPY } from './utils/i18n';
import {
  DEFAULT_CHARACTER,
  createSampleYouTubeScenes,
  normalizeSceneTimings,
} from './utils/studioLogic';
import { createSampleStudioAudio } from './utils/sampleAudio';
import { exportStickmanVideoWebm } from './canvas/videoExporter';
import { Header } from './components/Header';
import { AudioInputPanel } from './components/AudioInputPanel';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { StoryboardEditor } from './components/StoryboardEditor';
import { LiveProductionStage } from './components/LiveProductionStage';

export default function App() {
  const [language, setLanguage] = useState<Language>('fa');
  const [activeStage, setActiveStage] = useState<StudioStage>('setup');

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/wav');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioDuration, setAudioDuration] = useState<number>(13);

  const [transcript, setTranscript] = useState<string>(
    'چرا ۹۰ درصد کانال‌های یوتیوب توی ۶ ماه اول متوقف میشن؟ مشکل از الگوریتم نیست؛ مشکل ریتم تدوین و هوک ۳ ثانیه اوله!'
  );
  const [character, setCharacter] = useState<CharacterConfig>(DEFAULT_CHARACTER);
  const [theme, setTheme] = useState<CanvasTheme>('dark-studio');
  const [scenes, setScenes] = useState<SceneItem[]>(() =>
    createSampleYouTubeScenes('fa')
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isBuildingAll, setIsBuildingAll] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedFileName, setExportedFileName] = useState<string>('upvid-stickman.webm');
  const [exportError, setExportError] = useState<string | null>(null);

  const t = COPY[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  // Support ?autostart=1 jumping straight to production preview with sample audio
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const sample = createSampleStudioAudio(13);
      setAudioUrl(sample.url);
      setAudioBase64(sample.base64);
      setAudioMimeType(sample.mimeType);
      setAudioFileName('upvid-sample-fa.wav');
      setAudioDuration(sample.duration);
      setActiveStage('production');
    }
  }, []);

  const handleLoadSample = useCallback(
    (sampleLang: 'fa' | 'en') => {
      const sampleAudio = createSampleStudioAudio(13);
      setAudioUrl(sampleAudio.url);
      setAudioBase64(sampleAudio.base64);
      setAudioMimeType(sampleAudio.mimeType);
      setAudioFileName(
        sampleLang === 'fa' ? 'sample-youtube-hook-fa.wav' : 'sample-youtube-hook-en.wav'
      );
      setAudioDuration(sampleAudio.duration);
      const sampleScenes = createSampleYouTubeScenes(sampleLang);
      setScenes(sampleScenes);
      setTranscript(sampleScenes.map((s) => s.narration).join(' '));
      setAnalyzeError(null);
      setBuildError(null);
    },
    []
  );

  const handleAnalyzeAudio = async () => {
    if (!audioBase64) {
      setAnalyzeError(t.noAudioWarning);
      return;
    }
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const resp = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMimeType,
          durationSeconds: audioDuration,
          characterNotes: `${character.outfit} (${character.outfitColor}), ${character.headwear}, ${character.customNotes}`,
          languageHint: language,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Audio analysis failed.');
      }

      if (typeof data.transcript === 'string' && data.transcript.trim()) {
        setTranscript(data.transcript.trim());
      }

      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        const mapped: SceneItem[] = data.scenes.map(
          (raw: Partial<SceneItem>, idx: number) => ({
            id: `scene-${Date.now()}-${idx}`,
            index: idx,
            startTime: Number(raw.startTime ?? idx * 3),
            endTime: Number(raw.endTime ?? (idx + 1) * 3),
            narration: raw.narration || '',
            headline: raw.headline || `Scene ${idx + 1}`,
            highlightWord: raw.highlightWord || '',
            pose: raw.pose || 'presenting',
            emotion: raw.emotion || 'happy',
            camera: raw.camera || 'zoom-in',
            transition: raw.transition || 'whip-left',
            motionGraphic: raw.motionGraphic || 'kinetic-callout',
            propKeyword: raw.propKeyword || 'lightbulb',
            status: 'queued',
            progress: 15,
            buildStepLabel: language === 'fa' ? 'در صف ساخت' : 'Queued',
          })
        );
        setScenes(normalizeSceneTimings(mapped, audioDuration));
        setActiveStage('storyboard');
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Audio analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buildSingleSceneVisual = useCallback(
    async (scene: SceneItem) => {
      const updateThis = (patch: Partial<SceneItem>) => {
        setScenes((prev) =>
          prev.map((item) => (item.id === scene.id ? { ...item, ...patch } : item))
        );
      };

      updateThis({
        status: 'designing',
        progress: 30,
        buildStepLabel: language === 'fa' ? 'کارگردانی صحنه' : 'Designing',
      });

      try {
        updateThis({
          status: 'drawing',
          progress: 65,
          buildStepLabel: language === 'fa' ? 'ترسیم تصویر' : 'Drawing Art',
        });

        const resp = await fetch('/api/generate-scene-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            narration: scene.narration,
            headline: scene.headline,
            propKeyword: scene.propKeyword,
            outfitColor: character.outfitColor,
            accentColor: character.accentColor,
            characterNotes: character.customNotes,
          }),
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Scene art generation failed.');
        }

        updateThis({
          status: 'animating',
          progress: 88,
          customSvgArtwork: data.svgMarkup || scene.customSvgArtwork,
          buildStepLabel: language === 'fa' ? 'اعمال موشن‌گرافیک' : 'Animating',
        });

        await new Promise((r) => setTimeout(r, 180));

        updateThis({
          status: 'ready',
          progress: 100,
          buildStepLabel: language === 'fa' ? 'آماده' : 'Ready',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        setBuildError(msg);
        updateThis({
          status: 'error',
          progress: 100,
          buildStepLabel: language === 'fa' ? 'خطا' : 'Error',
        });
      }
    },
    [character, language]
  );

  // Concurrent production queue: builds up to 3 scenes simultaneously in parallel
  const handleBuildAllConcurrent = useCallback(async () => {
    if (scenes.length === 0) return;
    setActiveStage('production');
    setIsBuildingAll(true);
    setBuildError(null);

    const snapshot = [...scenes];
    setScenes((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'queued',
        progress: 10,
        buildStepLabel: language === 'fa' ? 'در صف ساخت' : 'Queued',
      }))
    );

    const concurrency = 3;
    let cursor = 0;

    const worker = async () => {
      while (cursor < snapshot.length) {
        const currentIdx = cursor++;
        await buildSingleSceneVisual(snapshot[currentIdx]);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, snapshot.length) }, () => worker())
    );
    setIsBuildingAll(false);
  }, [scenes, language, buildSingleSceneVisual]);

  const handleUpdateScene = (sceneId: string, patch: Partial<SceneItem>) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, ...patch } : s))
    );
  };

  const handleUpdateSceneDuration = (sceneId: string, durationSec: number) => {
    const safeDur = Math.max(0.8, Math.min(30, durationSec || 1));
    setScenes((prev) => {
      const updated = prev.map((s) =>
        s.id === sceneId ? { ...s, endTime: s.startTime + safeDur } : s
      );
      return normalizeSceneTimings(updated);
    });
  };

  const handleAddScene = () => {
    setScenes((prev) => {
      const lastEnd = prev.length > 0 ? prev[prev.length - 1].endTime : 0;
      const next: SceneItem = {
        id: `scene-${Date.now()}`,
        index: prev.length,
        startTime: lastEnd,
        endTime: lastEnd + 3.0,
        narration:
          language === 'fa'
            ? 'نکته کلیدی بعدی که مخاطب را شگفت‌زده می‌کند!'
            : 'The next key insight that hooks your viewer!',
        headline: language === 'fa' ? 'نکته کلیدی بعدی' : 'Next Big Insight',
        highlightWord: language === 'fa' ? 'کلیدی' : 'Insight',
        pose: 'pointing-up',
        emotion: 'excited',
        camera: 'zoom-in',
        transition: 'whip-left',
        motionGraphic: 'spotlight-ring',
        propKeyword: 'lightbulb',
        status: 'ready',
        progress: 100,
        buildStepLabel: language === 'fa' ? 'آماده' : 'Ready',
      };
      return normalizeSceneTimings([...prev, next]);
    });
  };

  const handleDuplicateScene = (sceneId: string) => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === sceneId);
      if (idx === -1) return prev;
      const target = prev[idx];
      const dur = Math.max(0.8, target.endTime - target.startTime);
      const clone: SceneItem = {
        ...target,
        id: `scene-${Date.now()}`,
        startTime: target.endTime,
        endTime: target.endTime + dur,
      };
      const next = [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
      return normalizeSceneTimings(next);
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes((prev) => {
      if (prev.length <= 1) return prev;
      return normalizeSceneTimings(prev.filter((s) => s.id !== sceneId));
    });
  };

  const handleMoveScene = (sceneId: string, direction: -1 | 1) => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === sceneId);
      const targetIdx = idx + direction;
      if (idx === -1 || targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return normalizeSceneTimings(copy);
    });
  };

  const handleExportVideo = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const result = await exportStickmanVideoWebm({
        scenes,
        character,
        theme,
        audioUrl,
        onProgress: setExportProgress,
      });
      setExportedVideoUrl(result.url);
      setExportedFileName(result.fileName);

      // Automatically trigger browser download
      const anchor = document.createElement('a');
      anchor.href = result.url;
      anchor.download = result.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Failed to render downloadable video.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleHeaderPrimary = () => {
    if (activeStage === 'production') {
      void handleExportVideo();
    } else {
      void handleBuildAllConcurrent();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 flex flex-col">
      <Header
        language={language}
        activeStage={activeStage}
        onSelectStage={setActiveStage}
        onPrimaryAction={handleHeaderPrimary}
        isExporting={isExporting}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 flex flex-col gap-6">
        {/* Studio Intro Strip & Language Switcher */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t.heroTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'))}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#13161F] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-orange-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Globe className="h-4 w-4 text-orange-400" aria-hidden="true" />
            <span>{language === 'fa' ? 'English UI' : 'نسخه فارسی'}</span>
          </button>
        </div>

        {buildError && (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
          >
            {buildError}
          </div>
        )}

        {/* Stage 1: Audio Upload & Stickman Character Outfit Studio */}
        {activeStage === 'setup' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-5">
              <AudioInputPanel
                language={language}
                audioUrl={audioUrl}
                audioFileName={audioFileName}
                audioDuration={audioDuration}
                isAnalyzing={isAnalyzing}
                analyzeError={analyzeError}
                onAudioLoaded={({ url, base64, mimeType, fileName, duration }) => {
                  setAudioUrl(url);
                  setAudioBase64(base64);
                  setAudioMimeType(mimeType);
                  setAudioFileName(fileName);
                  setAudioDuration(duration);
                  setAnalyzeError(null);
                  setScenes((prev) => normalizeSceneTimings(prev, duration));
                }}
                onLoadSample={handleLoadSample}
                onAnalyzeAudio={() => void handleAnalyzeAudio()}
                onGoToStoryboard={() => setActiveStage('storyboard')}
              />
            </div>

            <div className="xl:col-span-7">
              <CharacterCustomizer
                language={language}
                character={character}
                theme={theme}
                onChangeCharacter={setCharacter}
                onChangeTheme={setTheme}
              />
            </div>
          </div>
        )}

        {/* Stage 2: Editable Scene-by-Scene Storyboard */}
        {activeStage === 'storyboard' && (
          <StoryboardEditor
            language={language}
            transcript={transcript}
            scenes={scenes}
            character={character}
            theme={theme}
            isBuildingAll={isBuildingAll}
            onChangeTranscript={setTranscript}
            onUpdateScene={handleUpdateScene}
            onUpdateSceneDuration={handleUpdateSceneDuration}
            onAddScene={handleAddScene}
            onDuplicateScene={handleDuplicateScene}
            onDeleteScene={handleDeleteScene}
            onMoveScene={handleMoveScene}
            onRegenerateSceneVisual={(sceneId) => {
              const found = scenes.find((s) => s.id === sceneId);
              if (found) void buildSingleSceneVisual(found);
            }}
            onBuildAllConcurrent={() => void handleBuildAllConcurrent()}
          />
        )}

        {/* Stage 3: Live Concurrent Scene Build + 16:9 Cinema Player + Downloadable Export */}
        {activeStage === 'production' && (
          <LiveProductionStage
            language={language}
            scenes={scenes}
            character={character}
            theme={theme}
            audioUrl={audioUrl}
            isBuildingAll={isBuildingAll}
            isExporting={isExporting}
            exportProgress={exportProgress}
            exportedVideoUrl={exportedVideoUrl}
            exportedFileName={exportedFileName}
            exportError={exportError}
            onStartConcurrentBuild={() => void handleBuildAllConcurrent()}
            onExportVideo={() => void handleExportVideo()}
            onJumpToEdit={() => setActiveStage('storyboard')}
          />
        )}
      </main>
    </div>
  );
}
