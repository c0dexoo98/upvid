import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit3,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { CanvasTheme, CharacterConfig, Language, SceneItem } from '../types/studio';
import { COPY } from '../utils/i18n';
import {
  computeTimelineStats,
  findActiveSceneAtTime,
  formatTimecode,
} from '../utils/studioLogic';
import { renderStickmanSceneFrame } from '../canvas/stickmanRenderer';
import { SceneMiniCanvas } from './SceneMiniCanvas';

interface LiveProductionStageProps {
  language: Language;
  scenes: SceneItem[];
  character: CharacterConfig;
  theme: CanvasTheme;
  audioUrl: string | null;
  isBuildingAll: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportedVideoUrl: string | null;
  exportedFileName: string;
  exportError: string | null;
  onStartConcurrentBuild: () => void;
  onExportVideo: () => void;
  onJumpToEdit: () => void;
}

export function LiveProductionStage({
  language,
  scenes,
  character,
  theme,
  audioUrl,
  isBuildingAll,
  isExporting,
  exportProgress,
  exportedVideoUrl,
  exportedFileName,
  exportError,
  onStartConcurrentBuild,
  onExportVideo,
  onJumpToEdit,
}: LiveProductionStageProps) {
  const t = COPY[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const stats = computeTimelineStats(scenes);
  const totalDuration = Math.max(1, stats.totalDuration);

  // Playback loop syncing Canvas 60fps with Audio or fallback clock
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const drawLoop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;

      let activeTime = currentTime;
      const audioEl = audioRef.current;

      if (isPlaying) {
        if (audioEl && audioUrl && !audioEl.paused && Number.isFinite(audioEl.currentTime)) {
          activeTime = audioEl.currentTime;
        } else {
          activeTime = currentTime + dt;
        }

        if (activeTime >= totalDuration) {
          activeTime = 0;
          setIsPlaying(false);
          if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
          }
        }
        setCurrentTime(activeTime);
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const match = findActiveSceneAtTime(scenes, activeTime);
        if (match.scene) {
          renderStickmanSceneFrame({
            ctx,
            width: canvas.width,
            height: canvas.height,
            scene: match.scene,
            character,
            theme,
            localProgress: match.localProgress,
            transitionProgress: match.transitionProgress,
            localTime: match.localTime,
            globalTime: activeTime,
            isPlaying,
          });
        }
      }

      if (isPlaying) {
        rafId = requestAnimationFrame(drawLoop);
      }
    };

    if (isPlaying) {
      lastTs = performance.now();
      rafId = requestAnimationFrame(drawLoop);
    } else {
      // Draw static frame at currentTime
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const match = findActiveSceneAtTime(scenes, currentTime);
        if (match.scene) {
          renderStickmanSceneFrame({
            ctx,
            width: canvas.width,
            height: canvas.height,
            scene: match.scene,
            character,
            theme,
            localProgress: match.localProgress,
            transitionProgress: match.transitionProgress,
            localTime: match.localTime,
            globalTime: currentTime,
            isPlaying: false,
          });
        }
      }
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, currentTime, scenes, character, theme, totalDuration, audioUrl]);

  const togglePlay = () => {
    const audioEl = audioRef.current;
    if (isPlaying) {
      setIsPlaying(false);
      if (audioEl) audioEl.pause();
      return;
    }
    if (audioEl && audioUrl) {
      audioEl.currentTime = currentTime;
      audioEl.play().catch(() => {
        // Autoplay restriction fallback: canvas clock continues
      });
    }
    setIsPlaying(true);
  };

  const restartPlayback = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (!isPlaying) {
      setIsPlaying(true);
      if (audioRef.current && audioUrl) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const scrubTo = (nextTime: number) => {
    setCurrentTime(nextTime);
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const activeMatch = findActiveSceneAtTime(scenes, currentTime);

  return (
    <div className="flex flex-col gap-6">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />}

      {/* Header & Concurrent Progress Summary */}
      <div className="rounded-xl border border-white/10 bg-[#13161F] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{t.liveProductionTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.liveProductionSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono-tabular text-slate-300 flex items-center gap-3">
            <span>
              {t.progressLabel}:{' '}
              <strong className="text-orange-400">{stats.completionPercent}%</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {stats.readyCount}/{stats.sceneCount}
            </span>
          </div>

          <button
            type="button"
            onClick={onStartConcurrentBuild}
            disabled={isBuildingAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E29] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isBuildingAll ? 'animate-spin text-orange-400' : ''}`}
              aria-hidden="true"
            />
            <span>{isBuildingAll ? t.buildingConcurrent : t.buildAllConcurrent}</span>
          </button>

          <button
            type="button"
            onClick={onJumpToEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E29] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{language === 'fa' ? 'ویرایش صحنه‌ها' : 'Edit Scenes'}</span>
          </button>
        </div>
      </div>

      {/* Main 16:9 Cinema Studio Player + Export Controls */}
      <div className="rounded-xl border border-white/10 bg-[#13161F] p-5 flex flex-col gap-4">
        <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#050609] aspect-video">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            data-testid="studio-video-canvas"
            data-playing={isPlaying ? 'true' : 'false'}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Timeline Scrubber with Scene Cut Markers */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
            <span dir="ltr">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </span>
            {activeMatch.scene && (
              <span dir="ltr" className="text-slate-200">
                #{activeMatch.scene.index + 1} · {activeMatch.scene.camera} ·{' '}
                {activeMatch.scene.transition}
              </span>
            )}
          </div>

          <input
            type="range"
            aria-label="Video Timeline Scrubber"
            min={0}
            max={totalDuration}
            step={0.05}
            value={currentTime}
            onChange={(e) => scrubTo(Number(e.target.value))}
            dir="ltr"
            className="w-full accent-orange-500 cursor-pointer"
          />

          {/* Scene Jump Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {scenes.map((sc, idx) => {
              const isCurrent = activeMatch.scene?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => scrubTo(sc.startTime)}
                  dir="ltr"
                  className={`rounded-md px-2.5 py-1 text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-orange-500 text-slate-950 font-semibold'
                      : 'bg-[#0B0D12] text-slate-300 border border-white/10 hover:border-white/25'
                  }`}
                >
                  #{idx + 1} ({formatTimecode(sc.startTime)})
                </button>
              );
            })}
          </div>
        </div>

        {/* Transport & Export Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isPlaying ? t.pauseVideo : t.playVideo}</span>
            </button>

            <button
              type="button"
              onClick={restartPlayback}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E29] px-3.5 py-2 text-sm font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{t.restartVideo}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExportVideo}
              disabled={isExporting || scenes.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-orange-400 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {isExporting
                  ? `${t.exportingProgress} ${exportProgress}%`
                  : t.exportVideoBtn}
              </span>
            </button>

            {exportedVideoUrl && !isExporting && (
              <a
                href={exportedVideoUrl}
                download={exportedFileName}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>{t.downloadReadyBtn}</span>
              </a>
            )}
          </div>
        </div>

        {exportError && (
          <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {exportError}
          </p>
        )}
      </div>

      {/* Concurrent Live Scene Production Grid */}
      <section className="rounded-xl border border-white/10 bg-[#13161F] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white">{t.concurrentGridTitle}</h3>
          <span className="text-xs font-mono-tabular text-slate-400">
            {stats.readyCount} / {stats.sceneCount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenes.map((scene, idx) => {
            const isWorking =
              scene.status === 'designing' ||
              scene.status === 'drawing' ||
              scene.status === 'animating';
            return (
              <div
                key={scene.id}
                data-testid={`concurrent-card-${idx}`}
                className="rounded-lg border border-white/10 bg-[#0B0D12] p-3 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular">
                  <span className="font-semibold text-white">#{idx + 1}</span>
                  <span
                    className={
                      scene.status === 'ready'
                        ? 'text-emerald-400'
                        : isWorking
                        ? 'text-orange-400'
                        : 'text-slate-400'
                    }
                  >
                    {scene.buildStepLabel} · {scene.progress}%
                  </span>
                </div>

                <SceneMiniCanvas
                  scene={scene}
                  character={character}
                  theme={theme}
                  animate={isWorking || activeMatch.scene?.id === scene.id}
                />

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    style={{ width: `${scene.progress}%` }}
                    className={`h-full transition-all duration-300 ${
                      scene.status === 'ready' ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                  />
                </div>

                <p className="text-xs font-medium text-slate-200 truncate">
                  {scene.headline}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {scene.camera} / {scene.transition}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
