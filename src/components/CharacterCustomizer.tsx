import { useEffect, useRef, useState } from 'react';
import { Palette, Shirt, Glasses, Sparkles } from 'lucide-react';
import type {
  CanvasTheme,
  CharacterConfig,
  EyewearId,
  HeadwearId,
  Language,
  OutfitId,
  StickmanPose,
} from '../types/studio';
import { COPY } from '../utils/i18n';
import { POSE_OPTIONS } from '../utils/studioLogic';
import { drawStickmanCharacter, getThemePalette } from '../canvas/stickmanRenderer';

interface CharacterCustomizerProps {
  language: Language;
  character: CharacterConfig;
  theme: CanvasTheme;
  onChangeCharacter: (next: CharacterConfig) => void;
  onChangeTheme: (theme: CanvasTheme) => void;
}

const OUTFITS: { id: OutfitId; fa: string; en: string }[] = [
  { id: 'hoodie', fa: 'هودی اسپرت', en: 'Hoodie' },
  { id: 'suit', fa: 'کت و شلوار + کراوات', en: 'Suit & Tie' },
  { id: 'labcoat', fa: 'روپوش آزمایشگاهی', en: 'Lab Coat' },
  { id: 'streetjacket', fa: 'کاپشن استریت‌ور', en: 'Street Jacket' },
  { id: 'detective', fa: 'بارانی کارآگاهی', en: 'Trench Coat' },
  { id: 'tshirt', fa: 'تیشرت ساده', en: 'T-Shirt' },
];

const HEADWEAR: { id: HeadwearId; fa: string; en: string }[] = [
  { id: 'none', fa: 'بدون کلاه', en: 'None' },
  { id: 'headphones', fa: 'هدفون استودیویی', en: 'Headphones' },
  { id: 'cap', fa: 'کلاه کپ', en: 'Baseball Cap' },
  { id: 'beanie', fa: 'کلاه بافت', en: 'Beanie' },
  { id: 'crown', fa: 'تاج طلایی', en: 'Crown' },
  { id: 'tophat', fa: 'کلاه سیلندر', en: 'Top Hat' },
];

const EYEWEAR: { id: EyewearId; fa: string; en: string }[] = [
  { id: 'none', fa: 'بدون عینک', en: 'None' },
  { id: 'glasses', fa: 'عینک طبی', en: 'Glasses' },
  { id: 'sunglasses', fa: 'عینک آفتابی', en: 'Sunglasses' },
  { id: 'monocle', fa: 'تک‌عینک', en: 'Monocle' },
];

const THEMES: { id: CanvasTheme; fa: string; en: string; swatch: string }[] = [
  { id: 'dark-studio', fa: 'استودیو تیره', en: 'Dark Studio', swatch: '#0F1219' },
  { id: 'chalkboard', fa: 'تخته‌سیاه آموزشی', en: 'Chalkboard', swatch: '#13211B' },
  { id: 'sketchbook', fa: 'کاغذ طراحی سفید', en: 'Sketch Paper', swatch: '#F5F2EB' },
  { id: 'blueprint', fa: 'نقشه مهندسی آبی', en: 'Blueprint', swatch: '#0B1E3B' },
];

const OUTFIT_COLORS = [
  '#F97316',
  '#38BDF8',
  '#EF4444',
  '#10B981',
  '#A855F7',
  '#FACC15',
  '#1E293B',
];

const ACCENT_COLORS = ['#38BDF8', '#F97316', '#10B981', '#F43F5E', '#FACC15'];

export function CharacterCustomizer({
  language,
  character,
  theme,
  onChangeCharacter,
  onChangeTheme,
}: CharacterCustomizerProps) {
  const t = COPY[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewPose, setPreviewPose] = useState<StickmanPose>('presenting');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const loop = () => {
      const elapsed = (performance.now() - start) / 1000;
      const palette = getThemePalette(theme);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle background matching selected theme
      ctx.fillStyle = palette.bgPrimary;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = palette.gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      drawStickmanCharacter(ctx, {
        x: canvas.width / 2,
        y: canvas.height * 0.56,
        scale: 0.95,
        character,
        outfit: character.outfit,
        pose: previewPose,
        emotion: 'happy',
        strokeColor: palette.stickmanStroke,
        time: elapsed,
        isTalking: true,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [character, theme, previewPose]);

  return (
    <section className="rounded-xl border border-white/10 bg-[#13161F] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Shirt className="h-5 w-5 text-orange-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-white">{t.characterPanelTitle}</h2>
        </div>
        <select
          aria-label={t.poseLabel}
          value={previewPose}
          onChange={(e) => setPreviewPose(e.target.value as StickmanPose)}
          className="rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-orange-500 focus:outline-none"
        >
          {POSE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Live Animated Stickman Canvas Preview */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0B0D12] aspect-square flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={360}
              height={360}
              data-testid="character-preview-canvas"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="line-thickness-range"
              className="text-xs text-slate-300 whitespace-nowrap"
            >
              {t.lineWeightLabel}
            </label>
            <input
              id="line-thickness-range"
              type="range"
              min={3}
              max={8}
              step={1}
              value={character.lineThickness}
              onChange={(e) =>
                onChangeCharacter({
                  ...character,
                  lineThickness: Number(e.target.value),
                })
              }
              className="w-full accent-orange-500"
            />
            <span className="text-xs font-mono-tabular text-slate-400">
              {character.lineThickness}px
            </span>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Outfit Selector */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              {t.outfitLabel}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OUTFITS.map((o) => {
                const active = character.outfit === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() =>
                      onChangeCharacter({ ...character, outfit: o.id })
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-medium text-start transition-colors whitespace-nowrap truncate ${
                      active
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-white/10 bg-[#0B0D12] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {language === 'fa' ? o.fa : o.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outfit & Motion Accent Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Palette className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
                {t.outfitColorLabel}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {OUTFIT_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Outfit color ${hex}`}
                    onClick={() =>
                      onChangeCharacter({ ...character, outfitColor: hex })
                    }
                    style={{ backgroundColor: hex }}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      character.outfitColor === hex
                        ? 'border-white scale-110'
                        : 'border-white/20 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                {t.accentColorLabel}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Accent color ${hex}`}
                    onClick={() =>
                      onChangeCharacter({ ...character, accentColor: hex })
                    }
                    style={{ backgroundColor: hex }}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      character.accentColor === hex
                        ? 'border-white scale-110'
                        : 'border-white/20 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Headwear & Eyewear */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="headwear-select"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                {t.headwearLabel}
              </label>
              <select
                id="headwear-select"
                value={character.headwear}
                onChange={(e) =>
                  onChangeCharacter({
                    ...character,
                    headwear: e.target.value as HeadwearId,
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                {HEADWEAR.map((h) => (
                  <option key={h.id} value={h.id}>
                    {language === 'fa' ? h.fa : h.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="eyewear-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5"
              >
                <Glasses className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {t.eyewearLabel}
              </label>
              <select
                id="eyewear-select"
                value={character.eyewear}
                onChange={(e) =>
                  onChangeCharacter({
                    ...character,
                    eyewear: e.target.value as EyewearId,
                  })
                }
                className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                {EYEWEAR.map((ew) => (
                  <option key={ew.id} value={ew.id}>
                    {language === 'fa' ? ew.fa : ew.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Canvas Theme */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              {t.themeLabel}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((th) => {
                const active = theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onChangeTheme(th.id)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-white/10 bg-[#0B0D12] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: th.swatch }}
                      className="h-3.5 w-3.5 rounded border border-white/25 shrink-0"
                    />
                    <span className="truncate">
                      {language === 'fa' ? th.fa : th.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <label
              htmlFor="custom-style-notes"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              {t.customNotesLabel}
            </label>
            <textarea
              id="custom-style-notes"
              rows={2}
              value={character.customNotes}
              onChange={(e) =>
                onChangeCharacter({ ...character, customNotes: e.target.value })
              }
              placeholder={t.customNotesPlaceholder}
              className="w-full rounded-lg border border-white/15 bg-[#0B0D12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
