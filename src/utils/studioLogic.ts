import type {
  CameraMotion,
  CharacterConfig,
  MotionGraphicStyle,
  PropKeyword,
  SceneItem,
  StickmanEmotion,
  StickmanPose,
  TransitionType,
} from '../types/studio';

export const DEFAULT_CHARACTER: CharacterConfig = {
  name: 'Alex Stick',
  styleMode: 'comic-classic',
  outfit: 'hoodie',
  outfitColor: '#DC2626',
  accentColor: '#38BDF8',
  lineColor: '#111827',
  headwear: 'none',
  eyewear: 'none',
  lineThickness: 5,
  customNotes: 'Expressive comic-ink stickman with detailed hoodie, big eyes, sketchy street backdrop',
};

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe * 10) % 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function isRtlText(text: string): boolean {
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
}

export interface TimelineStats {
  sceneCount: number;
  totalDuration: number;
  averageCutSeconds: number;
  cutsPerMinute: number;
  readyCount: number;
  completionPercent: number;
}

export function computeTimelineStats(scenes: SceneItem[]): TimelineStats {
  if (scenes.length === 0) {
    return {
      sceneCount: 0,
      totalDuration: 0,
      averageCutSeconds: 0,
      cutsPerMinute: 0,
      readyCount: 0,
      completionPercent: 0,
    };
  }

  const totalDuration = Math.max(
    0,
    ...scenes.map((s) => Math.max(0, s.endTime))
  );
  const sumSceneDur = scenes.reduce(
    (acc, s) => acc + Math.max(0.4, s.endTime - s.startTime),
    0
  );
  const averageCutSeconds = sumSceneDur / scenes.length;
  const cutsPerMinute =
    totalDuration > 0 ? Math.round((scenes.length / totalDuration) * 60) : 0;
  const readyCount = scenes.filter((s) => s.status === 'ready').length;
  const totalProgress = scenes.reduce((acc, s) => acc + clampNumber(s.progress, 0, 100), 0);
  const completionPercent = Math.round(totalProgress / scenes.length);

  return {
    sceneCount: scenes.length,
    totalDuration,
    averageCutSeconds: Number(averageCutSeconds.toFixed(1)),
    cutsPerMinute,
    readyCount,
    completionPercent,
  };
}

export function normalizeSceneTimings(
  scenes: SceneItem[],
  targetDuration?: number
): SceneItem[] {
  if (scenes.length === 0) return [];
  const minSceneDuration = 0.8;

  const sorted = [...scenes].map((scene, idx) => ({
    ...scene,
    index: idx,
  }));

  let cursor = 0;
  const normalized: SceneItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const rawDuration = Math.max(minSceneDuration, s.endTime - s.startTime);
    const startTime = Number(cursor.toFixed(2));
    const endTime = Number((cursor + rawDuration).toFixed(2));
    normalized.push({
      ...s,
      index: i,
      startTime,
      endTime,
    });
    cursor = endTime;
  }

  if (targetDuration && targetDuration > minSceneDuration * sorted.length && cursor > 0) {
    const scale = targetDuration / cursor;
    let scaledCursor = 0;
    return normalized.map((s, idx) => {
      const dur = Math.max(minSceneDuration, (s.endTime - s.startTime) * scale);
      const startTime = Number(scaledCursor.toFixed(2));
      const endTime =
        idx === normalized.length - 1
          ? Number(targetDuration.toFixed(2))
          : Number((scaledCursor + dur).toFixed(2));
      scaledCursor = endTime;
      return {
        ...s,
        startTime,
        endTime,
      };
    });
  }

  return normalized;
}

export interface ActiveSceneMatch {
  scene: SceneItem | null;
  nextScene: SceneItem | null;
  localTime: number;
  localProgress: number;
  transitionProgress: number;
}

export function findActiveSceneAtTime(
  scenes: SceneItem[],
  currentTime: number
): ActiveSceneMatch {
  if (scenes.length === 0) {
    return {
      scene: null,
      nextScene: null,
      localTime: 0,
      localProgress: 0,
      transitionProgress: 0,
    };
  }

  const safeTime = Math.max(0, currentTime);
  let idx = scenes.findIndex(
    (s) => safeTime >= s.startTime && safeTime < s.endTime
  );
  if (idx === -1) {
    idx = safeTime >= scenes[scenes.length - 1].endTime ? scenes.length - 1 : 0;
  }

  const scene = scenes[idx];
  const nextScene = idx + 1 < scenes.length ? scenes[idx + 1] : null;
  const duration = Math.max(0.25, scene.endTime - scene.startTime);
  const localTime = clampNumber(safeTime - scene.startTime, 0, duration);
  const localProgress = clampNumber(localTime / duration, 0, 1);

  const transitionWindow = Math.min(0.28, duration * 0.25);
  const transitionProgress =
    localTime < transitionWindow
      ? clampNumber(localTime / transitionWindow, 0, 1)
      : 1;

  return {
    scene,
    nextScene,
    localTime,
    localProgress,
    transitionProgress,
  };
}

export function easeOutExpo(t: number): number {
  const x = clampNumber(t, 0, 1);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeInOutCubic(t: number): number {
  const x = clampNumber(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const x = clampNumber(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export interface CameraTransform {
  scale: number;
  translateX: number;
  translateY: number;
  rotationRad: number;
  flashOpacity: number;
  wipeProgress: number;
}

export function computeCameraTransform(
  camera: CameraMotion,
  localProgress: number,
  transition: TransitionType,
  transitionProgress: number,
  localTimeSeconds: number
): CameraTransform {
  const p = clampNumber(localProgress, 0, 1);
  const tp = easeOutExpo(clampNumber(transitionProgress, 0, 1));

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let rotationRad = 0;
  let flashOpacity = 0;
  const wipeProgress = tp;

  switch (camera) {
    case 'zoom-in':
      scale = 1 + 0.18 * easeInOutCubic(p);
      translateY = -12 * p;
      break;
    case 'zoom-out':
      scale = 1.22 - 0.2 * easeOutExpo(p);
      translateY = 8 * (1 - p);
      break;
    case 'pan-left':
      scale = 1.09;
      translateX = 36 - 72 * easeInOutCubic(p);
      break;
    case 'pan-right':
      scale = 1.09;
      translateX = -36 + 72 * easeInOutCubic(p);
      break;
    case 'dolly-punch':
      scale = p < 0.2 ? 1.28 - 0.22 * easeOutBack(p / 0.2) : 1.06 + 0.08 * p;
      break;
    case 'shake': {
      scale = 1.08;
      const decay = Math.max(0.15, 1 - p * 0.7);
      translateX = Math.sin(localTimeSeconds * 38) * 14 * decay;
      translateY = Math.cos(localTimeSeconds * 44) * 9 * decay;
      rotationRad = Math.sin(localTimeSeconds * 30) * 0.018 * decay;
      break;
    }
    case 'static':
    default:
      scale = 1.01 + 0.02 * Math.sin(p * Math.PI);
      break;
  }

  if (tp < 1) {
    const inv = 1 - tp;
    switch (transition) {
      case 'whip-left':
        translateX += inv * 460;
        rotationRad += inv * -0.04;
        break;
      case 'zoom-burst':
        scale *= 1 + inv * 0.26;
        flashOpacity = inv * 0.28;
        break;
      case 'flash-cut':
        flashOpacity = inv * 0.75;
        scale *= 1 + inv * 0.1;
        break;
      case 'slide-up':
        translateY += inv * 260;
        break;
      case 'ink-wipe':
        scale *= 0.92 + 0.08 * tp;
        break;
      case 'cut':
      default:
        break;
    }
  }

  return {
    scale,
    translateX,
    translateY,
    rotationRad,
    flashOpacity,
    wipeProgress,
  };
}

export interface KineticToken {
  text: string;
  isHighlight: boolean;
  staggerIndex: number;
}

export function splitWordTokens(
  headline: string,
  highlightWord: string
): KineticToken[] {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  const needle = highlightWord.trim().toLowerCase();

  return words.map((word, index) => {
    const cleaned = word.replace(/[.,!?;:"'«»()،؟]/g, '').toLowerCase();
    const isHighlight =
      needle.length > 0 &&
      (cleaned === needle ||
        cleaned.includes(needle) ||
        needle.includes(cleaned));
    return {
      text: word,
      isHighlight,
      staggerIndex: index,
    };
  });
}

export function sanitizeSvgMarkup(rawSvg: string | undefined): string | null {
  if (!rawSvg || typeof rawSvg !== 'string') return null;
  const trimmed = rawSvg.trim();
  if (!trimmed.startsWith('<svg')) return null;
  const cleaned = trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
  return cleaned;
}

export function createSampleYouTubeScenes(language: 'fa' | 'en'): SceneItem[] {
  if (language === 'fa') {
    return [
      {
        id: 'scene-1',
        index: 0,
        startTime: 0,
        endTime: 3.0,
        narration: 'چرا ۹۰ درصد کانال‌های یوتیوب قبل از ۱۰۰۰ سابسکرایب متوقف میشن؟',
        headline: 'راز شکست ۹۰٪ کانال‌ها',
        highlightWord: '۹۰٪',
        thoughtBubble: '؟',
        sceneRole: 'hook',
        pose: 'thinking',
        emotion: 'curious',
        camera: 'dolly-punch',
        transition: 'zoom-burst',
        motionGraphic: 'lightning-pop',
        propKeyword: 'youtube',
        status: 'ready',
        progress: 100,
        buildStepLabel: 'آماده',
      },
      {
        id: 'scene-2',
        index: 1,
        startTime: 3.0,
        endTime: 6.2,
        narration: 'صبر کن! مشکل الگوریتم نیست؛ راز اصلی توی ۳ ثانیه اول قایم شده!',
        headline: 'قانون طلایی ۳ ثانیه',
        highlightWord: '۳',
        thoughtBubble: '!',
        sceneRole: 'mini-hook',
        pose: 'pointing-up',
        emotion: 'serious',
        camera: 'zoom-in',
        transition: 'whip-left',
        motionGraphic: 'spotlight-ring',
        propKeyword: 'clock',
        status: 'ready',
        progress: 100,
        buildStepLabel: 'آماده',
      },
      {
        id: 'scene-3',
        index: 2,
        startTime: 6.2,
        endTime: 9.6,
        narration: 'وقتی هر ۳ ثانیه زوم و موشن‌گرافیک کمیک میاد، مغز بیننده تا آخر قفل میشه!',
        headline: 'موشن گرافیک و ریتم سریع',
        highlightWord: 'موشن',
        thoughtBubble: '⚡',
        sceneRole: 'story',
        pose: 'presenting',
        emotion: 'excited',
        camera: 'zoom-out',
        transition: 'flash-cut',
        motionGraphic: 'chart-rise',
        propKeyword: 'brain',
        status: 'ready',
        progress: 100,
        buildStepLabel: 'آماده',
      },
      {
        id: 'scene-4',
        index: 3,
        startTime: 9.6,
        endTime: 13.0,
        narration: 'اگه این سبک رو دوست داشتی لایک و سابسکرایب یادت نره و ویدیوی بعدی رو ببین!',
        headline: 'لایک، سابسکرایب و ویدیوی بعدی',
        highlightWord: 'سابسکرایب',
        thoughtBubble: '★',
        sceneRole: 'cta-outro',
        pose: 'celebrating',
        emotion: 'happy',
        camera: 'pan-right',
        transition: 'slide-up',
        motionGraphic: 'arrow-flow',
        propKeyword: 'rocket',
        status: 'ready',
        progress: 100,
        buildStepLabel: 'آماده',
      },
    ];
  }

  return [
    {
      id: 'scene-1',
      index: 0,
      startTime: 0,
      endTime: 3.0,
      narration: 'Why do 90 percent of YouTube channels quit before hitting 1,000 subscribers?',
      headline: 'Why 90% Channels Quit',
      highlightWord: '90%',
      thoughtBubble: '?',
      sceneRole: 'hook',
      pose: 'thinking',
      emotion: 'curious',
      camera: 'dolly-punch',
      transition: 'zoom-burst',
      motionGraphic: 'lightning-pop',
      propKeyword: 'youtube',
      status: 'ready',
      progress: 100,
      buildStepLabel: 'Ready',
    },
    {
      id: 'scene-2',
      index: 1,
      startTime: 3.0,
      endTime: 6.2,
      narration: 'Wait—it is never the algorithm. The real secret hides in the first 3 seconds!',
      headline: 'The 3 Second Secret',
      highlightWord: '3',
      thoughtBubble: '!',
      sceneRole: 'mini-hook',
      pose: 'pointing-up',
      emotion: 'serious',
      camera: 'zoom-in',
      transition: 'whip-left',
      motionGraphic: 'spotlight-ring',
      propKeyword: 'clock',
      status: 'ready',
      progress: 100,
      buildStepLabel: 'Ready',
    },
    {
      id: 'scene-3',
      index: 2,
      startTime: 6.2,
      endTime: 9.6,
      narration: 'Rapid comic cuts, zoom punches, and bold motion graphics lock viewer retention!',
      headline: 'Pro Comic Motion FX',
      highlightWord: 'Motion',
      thoughtBubble: '⚡',
      sceneRole: 'story',
      pose: 'presenting',
      emotion: 'excited',
      camera: 'zoom-out',
      transition: 'flash-cut',
      motionGraphic: 'chart-rise',
      propKeyword: 'brain',
      status: 'ready',
      progress: 100,
      buildStepLabel: 'Ready',
    },
    {
      id: 'scene-4',
      index: 3,
      startTime: 9.6,
      endTime: 13.0,
      narration: 'Smash Like, Subscribe right now, and click the next video waiting for you!',
      headline: 'Like, Subscribe & Watch Next',
      highlightWord: 'Subscribe',
      thoughtBubble: '★',
      sceneRole: 'cta-outro',
      pose: 'celebrating',
      emotion: 'happy',
      camera: 'pan-right',
      transition: 'slide-up',
      motionGraphic: 'arrow-flow',
      propKeyword: 'rocket',
      status: 'ready',
      progress: 100,
      buildStepLabel: 'Ready',
    },
  ];
}

export const POSE_OPTIONS: StickmanPose[] = [
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
];

export const EMOTION_OPTIONS: StickmanEmotion[] = [
  'happy',
  'curious',
  'excited',
  'serious',
  'shocked',
  'cool',
];

export const CAMERA_OPTIONS: CameraMotion[] = [
  'zoom-in',
  'zoom-out',
  'dolly-punch',
  'pan-left',
  'pan-right',
  'shake',
  'static',
];

export const TRANSITION_OPTIONS: TransitionType[] = [
  'whip-left',
  'zoom-burst',
  'flash-cut',
  'slide-up',
  'ink-wipe',
  'cut',
];

export const MOTION_GRAPHIC_OPTIONS: MotionGraphicStyle[] = [
  'kinetic-callout',
  'chart-rise',
  'spotlight-ring',
  'arrow-flow',
  'split-compare',
  'lightning-pop',
];

export const PROP_OPTIONS: PropKeyword[] = [
  'rocket',
  'youtube',
  'chart',
  'brain',
  'money',
  'laptop',
  'clock',
  'trophy',
  'lightbulb',
  'warning',
  'none',
];
