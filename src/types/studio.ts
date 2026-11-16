export type Language = 'fa' | 'en';

export type StudioStage = 'setup' | 'storyboard' | 'production';

export type CanvasTheme = 'dark-studio' | 'chalkboard' | 'sketchbook' | 'blueprint';

export type StickmanStyleMode =
  | 'comic-classic'
  | 'horror-mystery'
  | 'cyber-tech'
  | 'money-business';

export type OutfitId =
  | 'hoodie'
  | 'suit'
  | 'labcoat'
  | 'streetjacket'
  | 'detective'
  | 'tshirt';

export type HeadwearId =
  | 'none'
  | 'cap'
  | 'headphones'
  | 'crown'
  | 'beanie'
  | 'tophat';

export type EyewearId = 'none' | 'glasses' | 'sunglasses' | 'monocle';

export type StickmanPose =
  | 'presenting'
  | 'pointing-up'
  | 'thinking'
  | 'celebrating'
  | 'shocked'
  | 'typing'
  | 'walking'
  | 'idea'
  | 'facepalm'
  | 'chart-up';

export type StickmanEmotion =
  | 'happy'
  | 'curious'
  | 'excited'
  | 'serious'
  | 'shocked'
  | 'cool';

export type CameraMotion =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'dolly-punch'
  | 'shake'
  | 'static';

export type TransitionType =
  | 'whip-left'
  | 'zoom-burst'
  | 'flash-cut'
  | 'slide-up'
  | 'ink-wipe'
  | 'cut';

export type MotionGraphicStyle =
  | 'kinetic-callout'
  | 'chart-rise'
  | 'spotlight-ring'
  | 'arrow-flow'
  | 'split-compare'
  | 'lightning-pop';

export type PropKeyword =
  | 'rocket'
  | 'money'
  | 'brain'
  | 'laptop'
  | 'clock'
  | 'trophy'
  | 'warning'
  | 'youtube'
  | 'lightbulb'
  | 'chart'
  | 'none';

export type SceneRole = 'hook' | 'story' | 'mini-hook' | 'climax' | 'cta-outro';

export type SceneBuildStatus =
  | 'queued'
  | 'designing'
  | 'drawing'
  | 'animating'
  | 'ready'
  | 'error';

export interface CharacterConfig {
  name: string;
  styleMode: StickmanStyleMode;
  outfit: OutfitId;
  outfitColor: string;
  accentColor: string;
  lineColor: string;
  headwear: HeadwearId;
  eyewear: EyewearId;
  lineThickness: number;
  customNotes: string;
}

export interface SceneItem {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  narration: string;
  headline: string;
  highlightWord: string;
  thoughtBubble?: string;
  sceneRole?: SceneRole;
  pose: StickmanPose;
  emotion: StickmanEmotion;
  camera: CameraMotion;
  transition: TransitionType;
  motionGraphic: MotionGraphicStyle;
  propKeyword: PropKeyword;
  outfitOverride?: OutfitId;
  customSvgArtwork?: string;
  status: SceneBuildStatus;
  progress: number;
  buildStepLabel: string;
}

export interface ProjectState {
  title: string;
  audioUrl: string | null;
  audioBase64: string | null;
  audioMimeType: string;
  audioFileName: string;
  audioDuration: number;
  transcript: string;
  character: CharacterConfig;
  theme: CanvasTheme;
  scenes: SceneItem[];
}
