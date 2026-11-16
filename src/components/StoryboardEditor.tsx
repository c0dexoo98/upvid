import {
  ArrowDown,
  ArrowUp,
  Copy,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type {
  CameraMotion,
  CanvasTheme,
  CharacterConfig,
  Language,
  MotionGraphicStyle,
  OutfitId,
  PropKeyword,
  SceneItem,
  StickmanEmotion,
  StickmanPose,
  TransitionType,
} from '../types/studio';
import { COPY } from '../utils/i18n';
import {
  CAMERA_OPTIONS,
  EMOTION_OPTIONS,
  MOTION_GRAPHIC_OPTIONS,
  POSE_OPTIONS,
  PROP_OPTIONS,
  TRANSITION_OPTIONS,
  computeTimelineStats,
  formatTimecode,
} from '../utils/studioLogic';
import { SceneMiniCanvas } from './SceneMiniCanvas';

interface StoryboardEditorProps {
  language: Language;
  transcript: string;
  scenes: SceneItem[];
  character: CharacterConfig;
  theme: CanvasTheme;
  isBuildingAll: boolean;
  onChangeTranscript: (text: string) => void;
  onUpdateScene: (sceneId: string, patch: Partial<SceneItem>) => void;
  onUpdateSceneDuration: (sceneId: string, durationSec: number) => void;
  onAddScene: () => void;
  onDuplicateScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onMoveScene: (sceneId: string, direction: -1 | 1) => void;
  onRegenerateSceneVisual: (sceneId: string) => void;
  onBuildAllConcurrent: () => void;
}

const OUTFIT_OVERRIDE_OPTIONS: { value: '' | OutfitId; labelFa: string; labelEn: string }[] = [
  { value: '', labelFa: 'لباس اصلی کاراکتر', labelEn: 'Use Main Outfit' },
  { value: 'hoodie', labelFa: 'هودی اسپرت', labelEn: 'Hoodie' },
  { value: 'suit', labelFa: 'کت و شلوار', labelEn: 'Suit & Tie' },
  { value: 'labcoat', labelFa: 'روپوش آزمایشگاهی', labelEn: 'Lab Coat' },
  { value: 'streetjacket', labelFa: 'کاپشن استریت‌ور', labelEn: 'Street Jacket' },
  { value: 'detective', labelFa: 'بارانی کارآگاهی', labelEn: 'Trench Coat' },
  { value: 'tshirt', labelFa: 'تیشرت', labelEn: 'T-Shirt' },
];

export function StoryboardEditor({
  language,
  transcript,
  scenes,
  character,
  theme,
  isBuildingAll,
  onChangeTranscript,
  onUpdateScene,
  onUpdateSceneDuration,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene,
  onRegenerateSceneVisual,
  onBuildAllConcurrent,
}: StoryboardEditorProps) {
  const t = COPY[language];
  const stats = computeTimelineStats(scenes);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Editor Summary & Actions */}
      <div className="rounded-xl border border-white/10 bg-[#13161F] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{t.storyboardTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.storyboardSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-tabular px-2">
            <span>
              {t.scenesLabel}: <strong className="text-white">{stats.sceneCount}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t.totalDurationLabel}:{' '}
              <strong className="text-white">{formatTimecode(stats.totalDuration)}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t.cutsPerMin}: <strong className="text-orange-400">{stats.cutsPerMinute}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onAddScene}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#1A1E29] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.addScene}</span>
          </button>

          <button
            type="button"
            onClick={onBuildAllConcurrent}
            disabled={isBuildingAll || scenes.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-orange-400 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>{isBuildingAll ? t.buildingConcurrent : t.buildAllConcurrent}</span>
          </button>
        </div>
      </div>

      {/* Editable Transcript */}
      <div className="rounded-xl border border-white/10 bg-[#13161F] p-5">
        <label
          htmlFor="full-transcript-textarea"
          className="block text-xs font-semibold text-slate-300 mb-2"
        >
          {t.editTranscript}
        </label>
        <textarea
          id="full-transcript-textarea"
          rows={2}
          value={transcript}
          onChange={(e) => onChangeTranscript(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#0B0D12] px-3.5 py-2.5 text-sm text-slate-100 focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Editable Scene Cards */}
      <div className="flex flex-col gap-4">
        {scenes.map((scene, idx) => {
          const duration = Number(Math.max(0.8, scene.endTime - scene.startTime).toFixed(1));
          return (
            <article
              key={scene.id}
              data-testid={`storyboard-scene-${idx}`}
              className="rounded-xl border border-white/10 bg-[#13161F] p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
            >
              {/* Live Scene Preview Thumbnail */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span dir="ltr" className="font-semibold text-white">
                    #{idx + 1} · {formatTimecode(scene.startTime)} – {formatTimecode(scene.endTime)}
                  </span>
                  <span className="text-orange-400">
                    {scene.sceneRole ? `${scene.sceneRole} · ` : ''}
                    {scene.buildStepLabel}
                  </span>
                </div>

                <SceneMiniCanvas
                  scene={scene}
                  character={character}
                  theme={theme}
                  animate={false}
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Regenerate visual for scene ${idx + 1}`}
                    onClick={() => onRegenerateSceneVisual(scene.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0D12] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-orange-500/50 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.regenerateArt}</span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Move scene ${idx + 1} up`}
                    disabled={idx === 0}
                    onClick={() => onMoveScene(scene.id, -1)}
                    className="rounded-lg border border-white/10 bg-[#0B0D12] p-1.5 text-slate-300 hover:text-white disabled:opacity-35"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Move scene ${idx + 1} down`}
                    disabled={idx === scenes.length - 1}
                    onClick={() => onMoveScene(scene.id, 1)}
                    className="rounded-lg border border-white/10 bg-[#0B0D12] p-1.5 text-slate-300 hover:text-white disabled:opacity-35"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Duplicate scene ${idx + 1}`}
                    onClick={() => onDuplicateScene(scene.id)}
                    className="rounded-lg border border-white/10 bg-[#0B0D12] p-1.5 text-slate-300 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-label={`${t.deleteScene} ${idx + 1}`}
                    disabled={scenes.length <= 1}
                    onClick={() => onDeleteScene(scene.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20 disabled:opacity-35"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Editable Controls */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 md:col-span-3">
                  <label
                    htmlFor={`narration-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.narrationLabel}
                  </label>
                  <input
                    id={`narration-${scene.id}`}
                    type="text"
                    value={scene.narration}
                    onChange={(e) =>
                      onUpdateScene(scene.id, { narration: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`headline-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.headlineLabel}
                  </label>
                  <input
                    id={`headline-${scene.id}`}
                    type="text"
                    value={scene.headline}
                    onChange={(e) =>
                      onUpdateScene(scene.id, { headline: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`highlight-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.highlightWordLabel}
                  </label>
                  <input
                    id={`highlight-${scene.id}`}
                    type="text"
                    value={scene.highlightWord}
                    onChange={(e) =>
                      onUpdateScene(scene.id, { highlightWord: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`duration-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.durationLabel}
                  </label>
                  <input
                    id={`duration-${scene.id}`}
                    type="number"
                    min={0.8}
                    max={25}
                    step={0.2}
                    value={duration}
                    onChange={(e) =>
                      onUpdateSceneDuration(scene.id, Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs font-mono-tabular text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`pose-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.poseLabel}
                  </label>
                  <select
                    id={`pose-${scene.id}`}
                    value={scene.pose}
                    onChange={(e) =>
                      onUpdateScene(scene.id, { pose: e.target.value as StickmanPose })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {POSE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`emotion-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.emotionLabel}
                  </label>
                  <select
                    id={`emotion-${scene.id}`}
                    value={scene.emotion}
                    onChange={(e) =>
                      onUpdateScene(scene.id, {
                        emotion: e.target.value as StickmanEmotion,
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {EMOTION_OPTIONS.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`camera-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.cameraLabel}
                  </label>
                  <select
                    id={`camera-${scene.id}`}
                    value={scene.camera}
                    onChange={(e) =>
                      onUpdateScene(scene.id, {
                        camera: e.target.value as CameraMotion,
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {CAMERA_OPTIONS.map((cam) => (
                      <option key={cam} value={cam}>
                        {cam}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`transition-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.transitionLabel}
                  </label>
                  <select
                    id={`transition-${scene.id}`}
                    value={scene.transition}
                    onChange={(e) =>
                      onUpdateScene(scene.id, {
                        transition: e.target.value as TransitionType,
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {TRANSITION_OPTIONS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`motion-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.motionGraphicLabel}
                  </label>
                  <select
                    id={`motion-${scene.id}`}
                    value={scene.motionGraphic}
                    onChange={(e) =>
                      onUpdateScene(scene.id, {
                        motionGraphic: e.target.value as MotionGraphicStyle,
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {MOTION_GRAPHIC_OPTIONS.map((mg) => (
                      <option key={mg} value={mg}>
                        {mg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`prop-${scene.id}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    {t.propLabel}
                  </label>
                  <select
                    id={`prop-${scene.id}`}
                    value={scene.propKeyword}
                    onChange={(e) =>
                      onUpdateScene(scene.id, {
                        propKeyword: e.target.value as PropKeyword,
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    {PROP_OPTIONS.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor={`outfit-override-${scene.id}`}
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      {t.outfitOverrideLabel}
                    </label>
                    <select
                      id={`outfit-override-${scene.id}`}
                      value={scene.outfitOverride ?? ''}
                      onChange={(e) =>
                        onUpdateScene(scene.id, {
                          outfitOverride: e.target.value
                            ? (e.target.value as OutfitId)
                            : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-2.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    >
                      {OUTFIT_OVERRIDE_OPTIONS.map((opt) => (
                        <option key={opt.value || 'inherit'} value={opt.value}>
                          {language === 'fa' ? opt.labelFa : opt.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`thought-${scene.id}`}
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      {t.thoughtBubbleLabel}
                    </label>
                    <input
                      id={`thought-${scene.id}`}
                      type="text"
                      maxLength={4}
                      value={scene.thoughtBubble ?? ''}
                      onChange={(e) =>
                        onUpdateScene(scene.id, { thoughtBubble: e.target.value })
                      }
                      placeholder="؟ / ! / ⚡ / ★"
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
