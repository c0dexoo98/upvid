import type {
  CanvasTheme,
  CharacterConfig,
  MotionGraphicStyle,
  OutfitId,
  PropKeyword,
  SceneItem,
  StickmanEmotion,
  StickmanPose,
} from '../types/studio';
import {
  clampNumber,
  computeCameraTransform,
  easeOutBack,
  easeOutExpo,
  isRtlText,
  sanitizeSvgMarkup,
  splitWordTokens,
} from '../utils/studioLogic';

export interface ThemePalette {
  bgPrimary: string;
  bgSecondary: string;
  gridColor: string;
  textColor: string;
  subTextColor: string;
  stickmanStroke: string;
  headFill: string;
  cardSurface: string;
  comicInk: string;
}

export function getThemePalette(theme: CanvasTheme): ThemePalette {
  switch (theme) {
    case 'chalkboard':
      return {
        bgPrimary: '#13211B',
        bgSecondary: '#0C1712',
        gridColor: 'rgba(255, 255, 255, 0.05)',
        textColor: '#F8FAFC',
        subTextColor: '#CBD5E1',
        stickmanStroke: '#F8FAFC',
        headFill: '#F8FAFC',
        cardSurface: 'rgba(15, 23, 20, 0.82)',
        comicInk: 'rgba(255, 255, 255, 0.14)',
      };
    case 'sketchbook':
      return {
        bgPrimary: '#F7F4EC',
        bgSecondary: '#EAE4D6',
        gridColor: 'rgba(15, 23, 42, 0.07)',
        textColor: '#0F172A',
        subTextColor: '#334155',
        stickmanStroke: '#111827',
        headFill: '#FFFFFF',
        cardSurface: 'rgba(255, 255, 255, 0.90)',
        comicInk: 'rgba(15, 23, 42, 0.18)',
      };
    case 'blueprint':
      return {
        bgPrimary: '#0B1E3B',
        bgSecondary: '#071429',
        gridColor: 'rgba(125, 211, 252, 0.11)',
        textColor: '#F0F9FF',
        subTextColor: '#BAE6FD',
        stickmanStroke: '#F0F9FF',
        headFill: '#F8FAFC',
        cardSurface: 'rgba(7, 20, 41, 0.85)',
        comicInk: 'rgba(186, 230, 253, 0.16)',
      };
    case 'dark-studio':
    default:
      return {
        bgPrimary: '#11151F',
        bgSecondary: '#080A10',
        gridColor: 'rgba(255, 255, 255, 0.05)',
        textColor: '#F8FAFC',
        subTextColor: '#CBD5E1',
        stickmanStroke: '#F8FAFC',
        headFill: '#F4F4F5',
        cardSurface: 'rgba(15, 18, 25, 0.86)',
        comicInk: 'rgba(255, 255, 255, 0.10)',
      };
  }
}

const svgImageCache = new Map<string, HTMLImageElement>();

function getCachedSvgImage(rawSvg: string | undefined): HTMLImageElement | null {
  const safe = sanitizeSvgMarkup(rawSvg);
  if (!safe) return null;
  const cached = svgImageCache.get(safe);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(safe)}`;
  svgImageCache.set(safe, img);
  return null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ThemePalette,
  accentColor: string,
  time: number
) {
  const grad = ctx.createRadialGradient(
    width * 0.48,
    height * 0.45,
    width * 0.05,
    width * 0.5,
    height * 0.5,
    width * 0.85
  );
  grad.addColorStop(0, palette.bgPrimary);
  grad.addColorStop(1, palette.bgSecondary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle moving parallax grid
  const spacing = 48;
  const offsetX = (time * 18) % spacing;
  const offsetY = (time * 10) % spacing;

  ctx.strokeStyle = palette.gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -spacing + offsetX; x < width + spacing; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = -spacing + offsetY; y < height + spacing; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Sketchy comic perspective floor & distant street silhouettes (like reference comic panel)
  ctx.save();
  ctx.strokeStyle = palette.comicInk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width, height * 0.66);
  ctx.moveTo(0, height * 0.80);
  ctx.lineTo(width, height * 0.75);
  ctx.stroke();

  // Subtle comic architectural lines in upper left/back
  ctx.beginPath();
  ctx.moveTo(width * 0.07, height * 0.14);
  ctx.lineTo(width * 0.07, height * 0.71);
  ctx.moveTo(width * 0.16, height * 0.10);
  ctx.lineTo(width * 0.16, height * 0.70);
  ctx.stroke();

  // Tiny distant background stick silhouettes for comic depth
  const bgFigs = [
    { x: width * 0.11, y: height * 0.63, s: 0.42 },
    { x: width * 0.15, y: height * 0.635, s: 0.4 },
    { x: width * 0.90, y: height * 0.61, s: 0.36 },
  ];
  bgFigs.forEach((f) => {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.s, f.s);
    ctx.strokeStyle = palette.comicInk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -24, 10, 0, Math.PI * 2);
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 12);
    ctx.moveTo(-8, -6);
    ctx.lineTo(8, -6);
    ctx.moveTo(0, 12);
    ctx.lineTo(-6, 30);
    ctx.moveTo(0, 12);
    ctx.lineTo(6, 30);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();

  // Subtle studio radial spotlight behind main character
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(width * 0.32, height * 0.56, width * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawComicSpeedLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string,
  intensity: number,
  time: number
) {
  if (intensity <= 0.02) return;
  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = clampNumber(intensity * 0.32, 0, 0.4);
  ctx.lineWidth = 2.5;
  const rays = 28;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + time * 0.4;
    const innerR = width * (0.38 + ((i * 17) % 10) * 0.012);
    const outerR = width * 0.72;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMotionGraphicLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: MotionGraphicStyle,
  accentColor: string,
  outfitColor: string,
  palette: ThemePalette,
  localProgress: number,
  time: number
) {
  const enter = easeOutBack(clampNumber(localProgress / 0.35, 0, 1));
  ctx.save();

  switch (style) {
    case 'spotlight-ring': {
      const cx = width * 0.32;
      const cy = height * 0.55;
      const r = width * 0.20 * enter;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 12]);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.75);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.setLineDash([]);
      ctx.strokeStyle = outfitColor;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.14, -0.4, Math.PI * 1.15);
      ctx.stroke();
      break;
    }
    case 'chart-rise': {
      const baseX = width * 0.56;
      const baseY = height * 0.78;
      const barW = 32;
      const heights = [48, 80, 118, 164];
      heights.forEach((h, idx) => {
        const delay = idx * 0.08;
        const barProg = easeOutExpo(
          clampNumber((localProgress - delay) / 0.35, 0, 1)
        );
        const bh = h * barProg;
        const bx = baseX + idx * (barW + 16);
        ctx.fillStyle = idx === heights.length - 1 ? outfitColor : accentColor;
        ctx.globalAlpha = idx === heights.length - 1 ? 0.92 : 0.42;
        drawRoundedRect(ctx, bx, baseY - bh, barW, bh, 8);
        ctx.fill();
      });
      ctx.globalAlpha = 0.88;
      ctx.strokeStyle = palette.textColor;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseX - 8, baseY - 24);
      ctx.lineTo(baseX + 76, baseY - 96 * enter);
      ctx.lineTo(baseX + 165, baseY - 178 * enter);
      ctx.stroke();
      break;
    }
    case 'arrow-flow': {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const shift = ((time * 120 + i * 70) % 210) - 60;
        ctx.globalAlpha = 0.25 + i * 0.22;
        const ax = width * 0.51 + shift;
        const ay = height * (0.43 + i * 0.11);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + 70, ay);
        ctx.lineTo(ax + 54, ay - 14);
        ctx.moveTo(ax + 70, ay);
        ctx.lineTo(ax + 54, ay + 14);
        ctx.stroke();
      }
      break;
    }
    case 'lightning-pop': {
      drawComicSpeedLines(ctx, width, height, outfitColor, 1 - localProgress * 0.4, time);
      ctx.strokeStyle = outfitColor;
      ctx.lineWidth = 4;
      const bolts = [
        [0.14, 0.22],
        [0.88, 0.26],
        [0.84, 0.72],
      ];
      bolts.forEach(([rx, ry], idx) => {
        const pulse = 0.75 + 0.25 * Math.sin(time * 9 + idx * 2);
        ctx.save();
        ctx.translate(width * rx, height * ry);
        ctx.scale(enter * pulse, enter * pulse);
        ctx.beginPath();
        ctx.moveTo(8, -24);
        ctx.lineTo(-10, 2);
        ctx.lineTo(4, 2);
        ctx.lineTo(-8, 26);
        ctx.lineTo(14, -4);
        ctx.lineTo(0, -4);
        ctx.closePath();
        ctx.fillStyle = idx % 2 === 0 ? outfitColor : accentColor;
        ctx.fill();
        ctx.restore();
      });
      break;
    }
    case 'split-compare': {
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = accentColor;
      ctx.fillRect(width * 0.54, 0, width * 0.46, height);
      ctx.globalAlpha = 0.78;
      ctx.strokeStyle = outfitColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width * 0.54, height * 0.10);
      ctx.lineTo(width * 0.54, height * 0.88);
      ctx.stroke();
      break;
    }
    case 'kinetic-callout':
    default: {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = 0.6;
      const pad = 28;
      const len = 42 * enter;
      ctx.beginPath();
      ctx.moveTo(pad, pad + len);
      ctx.lineTo(pad, pad);
      ctx.lineTo(pad + len, pad);
      ctx.moveTo(width - pad, height - pad - len);
      ctx.lineTo(width - pad, height - pad);
      ctx.lineTo(width - pad - len, height - pad);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  symbol: string,
  accentColor: string,
  pop: number,
  time: number
) {
  if (!symbol || pop <= 0.05) return;
  ctx.save();
  const bob = Math.sin(time * 4.2) * 5;
  ctx.translate(x, y + bob);
  ctx.scale(pop, pop);

  // Trailing thought dots
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 3;
  [
    { dx: -44, dy: 46, r: 6 },
    { dx: -28, dy: 30, r: 10 },
  ].forEach((dot) => {
    ctx.beginPath();
    ctx.arc(dot.dx, dot.dy, dot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Cloud bubble: stroke outer silhouette first, then fill white inside so no internal lines cross
  const puffs = [
    { cx: 0, cy: 0, r: 34 },
    { cx: -26, cy: 4, r: 22 },
    { cx: 26, cy: 4, r: 22 },
    { cx: -14, cy: -20, r: 22 },
    { cx: 16, cy: -20, r: 22 },
  ];
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 6;
  puffs.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.fillStyle = '#FFFFFF';
  puffs.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = symbol === '!' || symbol === '؟' || symbol === '?' ? '#111827' : accentColor;
  ctx.font = '900 38px "Lalezar", "Rubik", "Vazirmatn", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 0, 0);
  ctx.restore();
}

function drawBuiltinProp(
  ctx: CanvasRenderingContext2D,
  prop: PropKeyword,
  x: number,
  y: number,
  scale: number,
  accentColor: string,
  outfitColor: string,
  palette: ThemePalette,
  time: number
) {
  if (prop === 'none') return;
  ctx.save();
  const bob = Math.sin(time * 3.4) * 8;
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);

  // Comic panel badge backing with ink border
  ctx.fillStyle = palette.cardSurface;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, -88, -88, 176, 176, 28);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, -84, -84, 168, 168, 24);
  ctx.stroke();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (prop) {
    case 'youtube': {
      ctx.fillStyle = '#EF4444';
      drawRoundedRect(ctx, -56, -38, 112, 76, 20);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-14, -20);
      ctx.lineTo(24, 0);
      ctx.lineTo(-14, 20);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'rocket': {
      ctx.rotate(-0.55);
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = outfitColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -56);
      ctx.quadraticCurveTo(32, -10, 22, 34);
      ctx.lineTo(-22, 34);
      ctx.quadraticCurveTo(-32, -10, 0, -56);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, -10, 11, 0, Math.PI * 2);
      ctx.fill();
      const flick = 1 + 0.25 * Math.sin(time * 24);
      ctx.fillStyle = outfitColor;
      ctx.beginPath();
      ctx.moveTo(-12, 36);
      ctx.lineTo(0, 36 + 26 * flick);
      ctx.lineTo(12, 36);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'clock': {
      ctx.strokeStyle = palette.textColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = outfitColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -28);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(time * 3) * 26, Math.sin(time * 3) * 26);
      ctx.stroke();
      break;
    }
    case 'brain': {
      ctx.fillStyle = accentColor;
      ctx.strokeStyle = palette.textColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-18, -6, 26, 0, Math.PI * 2);
      ctx.arc(18, -6, 26, 0, Math.PI * 2);
      ctx.arc(-14, 18, 22, 0, Math.PI * 2);
      ctx.arc(14, 18, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'money': {
      ctx.fillStyle = '#10B981';
      drawRoundedRect(ctx, -52, -32, 104, 64, 12);
      ctx.fill();
      ctx.strokeStyle = '#ECFDF5';
      ctx.lineWidth = 4;
      ctx.strokeRect(-42, -22, 84, 44);
      ctx.fillStyle = '#ECFDF5';
      ctx.font = 'bold 34px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 2);
      break;
    }
    case 'laptop': {
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = palette.textColor;
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, -44, -36, 88, 56, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accentColor;
      ctx.fillRect(-34, -26, 68, 36);
      ctx.fillStyle = palette.textColor;
      drawRoundedRect(ctx, -56, 22, 112, 12, 6);
      ctx.fill();
      break;
    }
    case 'trophy': {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.moveTo(-34, -38);
      ctx.lineTo(34, -38);
      ctx.lineTo(24, 12);
      ctx.lineTo(-24, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-8, 12, 16, 24);
      ctx.fillRect(-26, 36, 52, 12);
      break;
    }
    case 'warning': {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(48, 38);
      ctx.lineTo(-48, 38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-5, -18, 10, 30);
      ctx.beginPath();
      ctx.arc(0, 24, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lightbulb': {
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, -12, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      drawRoundedRect(ctx, -16, 22, 32, 20, 6);
      ctx.fill();
      break;
    }
    case 'chart':
    default: {
      ctx.fillStyle = outfitColor;
      ctx.fillRect(-42, 6, 18, 32);
      ctx.fillStyle = accentColor;
      ctx.fillRect(-10, -14, 18, 52);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(22, -38, 18, 76);
      break;
    }
  }

  ctx.restore();
}

function drawCartoonHand(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  angle: number,
  fill: string,
  ink: string
) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.6;

  // Palm
  ctx.beginPath();
  ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Expressive cartoon fingers (4 fingers like reference comic illustration)
  const fingers = [-0.55, -0.15, 0.25, 0.65];
  fingers.forEach((fa) => {
    ctx.save();
    ctx.rotate(fa);
    ctx.beginPath();
    ctx.ellipse(0, -11, 2.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawSneaker(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  flipX: number,
  color: string,
  ink: string
) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(flipX, 1);

  // Shoe upper
  ctx.fillStyle = color;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-14, -12);
  ctx.lineTo(12, -12);
  ctx.quadraticCurveTo(28, -4, 28, 8);
  ctx.lineTo(-18, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White toe cap & sole
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(20, 4, 8, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillRect(-18, 6, 46, 5);
  ctx.strokeRect(-18, 6, 46, 5);

  // Laces
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, -7);
  ctx.lineTo(9, -5);
  ctx.moveTo(5, -2);
  ctx.lineTo(12, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawStickmanCharacter(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    scale: number;
    character: CharacterConfig;
    outfit: OutfitId;
    pose: StickmanPose;
    emotion: StickmanEmotion;
    strokeColor: string;
    time: number;
    isTalking: boolean;
  }
) {
  const {
    x,
    y,
    scale,
    character,
    outfit,
    pose,
    emotion,
    strokeColor,
    time,
    isTalking,
  } = opts;

  const isHorror = character.styleMode === 'horror-mystery';
  const ink = '#0D1017';
  const limbStroke = strokeColor === '#F8FAFC' ? '#0D1017' : strokeColor;
  const handFill = isHorror ? '#CBD5E1' : '#0D1017';

  ctx.save();
  const bounce =
    pose === 'walking'
      ? Math.abs(Math.sin(time * 9)) * -12
      : pose === 'celebrating'
      ? Math.abs(Math.sin(time * 7)) * -16
      : Math.sin(time * 3.1) * 4;

  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);

  const inkWidth = clampNumber(character.lineThickness || 5, 3, 9);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Comic cross-hatched ground shadow (matching 1st reference image)
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let i = -48; i <= 48; i += 6) {
    const h = Math.sqrt(Math.max(0, 1 - (i / 52) * (i / 52))) * 10;
    ctx.beginPath();
    ctx.moveTo(i - 6, 152 - h * 0.4);
    ctx.lineTo(i + 8, 152 + h * 0.4);
    ctx.stroke();
  }
  ctx.restore();

  // Legs (inked black comic stick legs with outer white halo if dark bg)
  const walkSwing = pose === 'walking' ? Math.sin(time * 9) * 26 : 0;
  const drawLimb = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) => {
    if (strokeColor === '#F8FAFC') {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = inkWidth + 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#0D1017';
    ctx.lineWidth = inkWidth + 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
  };

  drawLimb(-15, 62, -24, 106, -28 - walkSwing, 142);
  drawLimb(15, 62, 24, 106, 28 + walkSwing, 142);

  // Detailed Comic Sneakers (matching 2nd reference image)
  drawSneaker(ctx, -32 - walkSwing, 144, -1, character.outfitColor, ink);
  drawSneaker(ctx, 32 + walkSwing, 144, 1, character.outfitColor, ink);

  // Arms & Expressive 4-fingered Cartoon Hands
  const shoulderY = -22;
  const hipY = 68;
  const gesture = Math.sin(time * 5.2) * 14;
  let leftHand: [number, number, number] = [-66, 28 + gesture * 0.4, -0.4];
  let rightHand: [number, number, number] = [68, 22 - gesture * 0.4, 0.4];

  switch (pose) {
    case 'pointing-up':
      leftHand = [-52, 34, -0.2];
      rightHand = [66, -68 + Math.sin(time * 6) * 8, 0.1];
      break;
    case 'presenting':
      leftHand = [-62, 22, -0.3];
      rightHand = [92, -16 + Math.sin(time * 5) * 10, 0.5];
      break;
    case 'celebrating':
      leftHand = [-70, -76 + Math.sin(time * 8) * 10, -0.4];
      rightHand = [70, -76 - Math.sin(time * 8) * 10, 0.4];
      break;
    case 'thinking':
      leftHand = [-52, 38, -0.2];
      rightHand = [72, -32 + Math.sin(time * 4) * 5, 0.25];
      break;
    case 'shocked':
      leftHand = [-56, -46, -0.3];
      rightHand = [56, -46, 0.3];
      break;
    case 'facepalm':
      leftHand = [-48, 34, -0.2];
      rightHand = [12, -74, -0.1];
      break;
    case 'idea':
      leftHand = [-50, 32, -0.2];
      rightHand = [58, -84, 0.1];
      break;
    case 'typing':
      leftHand = [-26, 28 + Math.sin(time * 22) * 6, 0.2];
      rightHand = [26, 28 + Math.cos(time * 22) * 6, -0.2];
      break;
    case 'chart-up':
      leftHand = [-56, 22, -0.2];
      rightHand = [80, -56, 0.35];
      break;
    case 'walking':
      leftHand = [-54 - walkSwing * 0.6, 26, -0.3];
      rightHand = [54 + walkSwing * 0.6, 26, 0.3];
      break;
  }

  // Draw curved ink arms
  drawLimb(-28, shoulderY + 10, (-28 + leftHand[0]) / 2 - 10, (shoulderY + leftHand[1]) / 2 + 12, leftHand[0], leftHand[1]);
  drawLimb(28, shoulderY + 10, (28 + rightHand[0]) / 2 + 10, (shoulderY + rightHand[1]) / 2 + 12, rightHand[0], rightHand[1]);

  drawCartoonHand(ctx, leftHand[0], leftHand[1], leftHand[2], handFill, isHorror ? ink : '#FFFFFF');
  drawCartoonHand(ctx, rightHand[0], rightHand[1], rightHand[2], handFill, isHorror ? ink : '#FFFFFF');

  // Detailed Layered Outfit Torso (matching hoodie folds, collar, pocket, drawstrings!)
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = ink;

  if (outfit === 'hoodie') {
    // Draped hood collar behind neck
    ctx.fillStyle = character.outfitColor;
    ctx.beginPath();
    ctx.ellipse(0, shoulderY + 2, 36, 16, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Main hoodie body with slight trapezoid taper & comic fold lines
    ctx.fillStyle = character.outfitColor;
    ctx.beginPath();
    ctx.moveTo(-34, shoulderY + 4);
    ctx.quadraticCurveTo(0, shoulderY - 4, 34, shoulderY + 4);
    ctx.lineTo(38, hipY + 4);
    ctx.quadraticCurveTo(0, hipY + 12, -38, hipY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sleeve cuffs at shoulders
    ctx.beginPath();
    ctx.moveTo(-34, shoulderY + 6);
    ctx.quadraticCurveTo(-44, shoulderY + 18, -32, shoulderY + 28);
    ctx.moveTo(34, shoulderY + 6);
    ctx.quadraticCurveTo(44, shoulderY + 18, 32, shoulderY + 28);
    ctx.stroke();

    // Inner comic shadow + kangaroo pocket
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.moveTo(-22, 24);
    ctx.lineTo(22, 24);
    ctx.lineTo(26, 56);
    ctx.lineTo(-26, 56);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Drawstrings with dark tips
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, shoulderY + 4);
    ctx.quadraticCurveTo(-12, shoulderY + 22, -9, shoulderY + 34);
    ctx.moveTo(10, shoulderY + 4);
    ctx.quadraticCurveTo(12, shoulderY + 22, 9, shoulderY + 34);
    ctx.stroke();
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-12, shoulderY + 33, 6, 7);
    ctx.fillRect(6, shoulderY + 33, 6, 7);

    // Tattered horror tears if horror-mystery mode
    if (isHorror) {
      ctx.fillStyle = '#450A0A';
      ctx.beginPath();
      ctx.moveTo(-18, hipY + 4);
      ctx.lineTo(-10, hipY - 12);
      ctx.lineTo(-2, hipY + 6);
      ctx.lineTo(8, hipY - 8);
      ctx.lineTo(18, hipY + 5);
      ctx.fill();
    }
  } else if (outfit === 'suit') {
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -34, shoulderY, 68, hipY - shoulderY + 8, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-15, shoulderY);
    ctx.lineTo(15, shoulderY);
    ctx.lineTo(0, shoulderY + 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = character.accentColor;
    ctx.beginPath();
    ctx.moveTo(-5, shoulderY + 4);
    ctx.lineTo(5, shoulderY + 4);
    ctx.lineTo(8, shoulderY + 44);
    ctx.lineTo(0, shoulderY + 56);
    ctx.lineTo(-8, shoulderY + 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'labcoat') {
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, -36, shoulderY, 72, hipY - shoulderY + 14, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = character.outfitColor;
    ctx.beginPath();
    ctx.moveTo(-13, shoulderY);
    ctx.lineTo(13, shoulderY);
    ctx.lineTo(0, shoulderY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeRect(10, 14, 17, 20);
  } else if (outfit === 'streetjacket') {
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -36, shoulderY, 72, hipY - shoulderY + 8, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = character.accentColor;
    ctx.fillRect(-34, shoulderY + 20, 68, 13);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, shoulderY + 2);
    ctx.lineTo(0, hipY + 6);
    ctx.stroke();
  } else if (outfit === 'detective') {
    ctx.fillStyle = '#C29B61';
    drawRoundedRect(ctx, -36, shoulderY, 72, hipY - shoulderY + 16, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#785A32';
    ctx.fillRect(-36, 26, 72, 10);
    ctx.fillStyle = character.accentColor;
    ctx.fillRect(-8, 24, 16, 14);
  } else {
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -30, shoulderY, 60, hipY - shoulderY + 6, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = character.accentColor;
    ctx.beginPath();
    ctx.arc(0, shoulderY + 32, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Oversized Expressive Comic Head (matching both reference images!)
  const headY = -78;
  const headR = 52;

  // Head base fill + subtle comic crescent shading
  ctx.fillStyle = isHorror ? '#D6D3D1' : '#FAFAFA';
  ctx.strokeStyle = ink;
  ctx.lineWidth = inkWidth + 0.5;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Soft ink shading crescent on bottom-left of head
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, headY, headR - 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = isHorror ? 'rgba(69,10,10,0.18)' : 'rgba(15,23,42,0.10)';
  ctx.beginPath();
  ctx.arc(-14, headY + 14, headR + 4, 0, Math.PI * 2);
  ctx.fill();

  if (isHorror) {
    // Comic cracks & dark zombie bruise patches (matching 2nd reference image)
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.ellipse(-26, headY - 26, 13, 9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, headY - 46);
    ctx.lineTo(10, headY - 28);
    ctx.lineTo(22, headY - 20);
    ctx.stroke();
  }
  ctx.restore();

  // Re-stroke head outline crisply
  ctx.strokeStyle = ink;
  ctx.lineWidth = inkWidth + 0.5;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.stroke();

  // HUGE Expressive Cartoony Eyes (matching reference images!)
  const blink = Math.sin(time * 2.1) > 0.96 ? 0.14 : 1;
  const eyeOffsetY = headY - 4;
  const leftEyeX = -19;
  const rightEyeX = 20;
  const eyeRadius = 17.5;

  // Eye sockets soft shadow
  ctx.fillStyle = isHorror ? 'rgba(69,10,10,0.32)' : 'rgba(15,23,42,0.14)';
  ctx.beginPath();
  ctx.ellipse(leftEyeX, eyeOffsetY + 2, eyeRadius + 3, (eyeRadius + 3) * blink, 0, 0, Math.PI * 2);
  ctx.ellipse(rightEyeX, eyeOffsetY + 2, eyeRadius + 2, (eyeRadius + 2) * blink, 0, 0, Math.PI * 2);
  ctx.fill();

  // White eyeballs with thick ink rim
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.ellipse(leftEyeX, eyeOffsetY, eyeRadius, eyeRadius * blink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(rightEyeX, eyeOffsetY, eyeRadius - 1, (eyeRadius - 1) * blink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils + crisp white catchlight (looking toward prop or viewer)
  if (blink > 0.3) {
    const lookX = pose === 'thinking' ? 4 : pose === 'presenting' ? 5 : 2;
    const lookY = pose === 'thinking' ? -4 : 0;
    ctx.fillStyle = '#090D16';
    const pupilR = isHorror ? 4 : 7.5;
    ctx.beginPath();
    ctx.arc(leftEyeX + lookX, eyeOffsetY + lookY, pupilR, 0, Math.PI * 2);
    ctx.arc(rightEyeX + lookX, eyeOffsetY + lookY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(leftEyeX + lookX + 2.5, eyeOffsetY + lookY - 2.5, 2.3, 0, Math.PI * 2);
    ctx.arc(rightEyeX + lookX + 2.5, eyeOffsetY + lookY - 2.5, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thick Expressive Comic Eyebrows
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (emotion === 'serious' || isHorror) {
    ctx.moveTo(-34, headY - 30);
    ctx.lineTo(-9, headY - 22);
    ctx.moveTo(35, headY - 30);
    ctx.lineTo(10, headY - 22);
  } else if (emotion === 'shocked' || emotion === 'curious') {
    ctx.moveTo(-34, headY - 32);
    ctx.quadraticCurveTo(-19, headY - 42, -7, headY - 30);
    ctx.moveTo(8, headY - 30);
    ctx.quadraticCurveTo(20, headY - 42, 35, headY - 32);
  } else {
    ctx.moveTo(-32, headY - 28);
    ctx.quadraticCurveTo(-19, headY - 36, -8, headY - 28);
    ctx.moveTo(9, headY - 28);
    ctx.quadraticCurveTo(20, headY - 36, 33, headY - 28);
  }
  ctx.stroke();

  // Lip-synced Expressive Comic Mouth
  const mouthOpen = isTalking ? 4 + Math.abs(Math.sin(time * 18)) * 9 : 0;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.5;

  if (emotion === 'shocked' || isHorror) {
    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.ellipse(0, headY + 26, 12, 10 + mouthOpen * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Teeth / tongue detail
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-7, headY + 17, 5, 4);
    ctx.fillRect(2, headY + 17, 5, 4);
  } else if (isTalking && mouthOpen > 4.5) {
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(0, headY + 24, 13, mouthOpen * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.ellipse(0, headY + 24 + mouthOpen * 0.4, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (emotion === 'happy' || emotion === 'excited') {
    ctx.beginPath();
    ctx.arc(0, headY + 18, 15, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (emotion === 'serious') {
    ctx.beginPath();
    ctx.moveTo(-13, headY + 26);
    ctx.lineTo(13, headY + 26);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-12, headY + 24);
    ctx.quadraticCurveTo(0, headY + 30, 12, headY + 23);
    ctx.stroke();
  }

  // Eyewear
  if (character.eyewear === 'glasses') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(leftEyeX - 18, eyeOffsetY - 16, 36, 32);
    ctx.strokeRect(rightEyeX - 17, eyeOffsetY - 16, 35, 32);
    ctx.beginPath();
    ctx.moveTo(leftEyeX + 18, eyeOffsetY - 2);
    ctx.lineTo(rightEyeX - 17, eyeOffsetY - 2);
    ctx.stroke();
  } else if (character.eyewear === 'sunglasses') {
    ctx.fillStyle = '#090D16';
    drawRoundedRect(ctx, leftEyeX - 19, eyeOffsetY - 15, 38, 28, 6);
    ctx.fill();
    drawRoundedRect(ctx, rightEyeX - 18, eyeOffsetY - 15, 37, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftEyeX + 19, eyeOffsetY - 4);
    ctx.lineTo(rightEyeX - 18, eyeOffsetY - 4);
    ctx.stroke();
  } else if (character.eyewear === 'monocle') {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeOffsetY, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightEyeX + 19, eyeOffsetY);
    ctx.lineTo(rightEyeX + 24, headY + 34);
    ctx.stroke();
  }

  // Headwear
  if (character.headwear === 'headphones') {
    ctx.strokeStyle = character.accentColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, headY - 4, headR + 5, Math.PI + 0.15, -0.15);
    ctx.stroke();
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, -headR - 11, headY - 18, 16, 34, 7);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, headR - 5, headY - 18, 16, 34, 7);
    ctx.fill();
    ctx.stroke();
  } else if (character.headwear === 'cap') {
    ctx.fillStyle = character.outfitColor;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, headY - 18, headR + 2, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-10, headY - 26, 70, 12);
    ctx.strokeRect(-10, headY - 26, 70, 12);
  } else if (character.headwear === 'crown') {
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-28, headY - 46);
    ctx.lineTo(-24, headY - 76);
    ctx.lineTo(-8, headY - 58);
    ctx.lineTo(0, headY - 82);
    ctx.lineTo(8, headY - 58);
    ctx.lineTo(24, headY - 76);
    ctx.lineTo(28, headY - 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (character.headwear === 'beanie') {
    ctx.fillStyle = character.accentColor;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, headY - 18, headR + 1, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, -headR - 2, headY - 28, headR * 2 + 4, 15, 7);
    ctx.fill();
    ctx.stroke();
  } else if (character.headwear === 'tophat') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(-52, headY - 46, 104, 10);
    drawRoundedRect(ctx, -32, headY - 94, 64, 50, 4);
    ctx.fill();
    ctx.fillStyle = character.outfitColor;
    ctx.fillRect(-32, headY - 54, 64, 8);
  }

  // Silence unused lint on limbStroke
  void limbStroke;
  ctx.restore();
}

function drawOutroSubscribeCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  localProgress: number,
  outfitColor: string,
  time: number
) {
  const pop = easeOutBack(clampNumber(localProgress / 0.35, 0, 1));
  if (pop <= 0.05) return;

  ctx.save();
  const cardX = width * 0.72;
  const cardY = height * 0.74;
  ctx.translate(cardX, cardY);
  ctx.scale(pop, pop);

  const pulse = 1 + Math.sin(time * 8) * 0.035;
  ctx.scale(pulse, pulse);

  ctx.fillStyle = '#DC2626';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, -135, -30, 270, 56, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Lalezar", "Rubik", "Vazirmatn", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIKE  ·  SUBSCRIBE  ▶', 0, 0);

  // Small next-video arrow badge
  ctx.fillStyle = outfitColor;
  ctx.beginPath();
  ctx.arc(135, -24, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 16px sans-serif';
  ctx.fillText('🔔', 135, -23);
  ctx.restore();
}

function drawKineticTypography(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneItem,
  palette: ThemePalette,
  accentColor: string,
  outfitColor: string,
  localProgress: number,
  isPlaying: boolean
) {
  const headline = scene.headline.trim();
  const narration = scene.narration.trim();

  if (headline) {
    const tokens = splitWordTokens(headline, scene.highlightWord);
    const rtl = isRtlText(headline);
    const fontSize = Math.round(width * 0.034);
    ctx.save();
    ctx.font = `800 ${fontSize}px "Lalezar", "Rubik", "Vazirmatn", "Bricolage Grotesque", sans-serif`;
    ctx.textBaseline = 'middle';

    const zoneLeft = width * 0.48;
    const zoneRight = width - 44;
    const maxLineW = zoneRight - zoneLeft;
    const boxY = height * 0.14;
    const spaceW = fontSize * 0.42;

    const getTokenWidth = (tok: (typeof tokens)[number]) =>
      ctx.measureText(tok.text).width + (tok.isHighlight ? 28 : 8);

    const lines: (typeof tokens)[] = [];
    let currentLine: typeof tokens = [];
    let currentW = 0;

    for (const tok of tokens) {
      const tw = getTokenWidth(tok);
      if (currentLine.length > 0 && currentW + spaceW + tw > maxLineW) {
        lines.push(currentLine);
        currentLine = [tok];
        currentW = tw;
      } else {
        currentLine.push(tok);
        currentW += (currentLine.length > 1 ? spaceW : 0) + tw;
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    lines.forEach((lineTokens, lineIdx) => {
      const lineY = boxY + lineIdx * (fontSize * 1.5);

      if (rtl) {
        let cursorRight = zoneRight;
        lineTokens.forEach((tok) => {
          const w = getTokenWidth(tok);
          const centerX = cursorRight - w / 2;
          const delay = tok.staggerIndex * 0.05;
          const pop = !isPlaying && localProgress < 0.02
            ? 1
            : easeOutBack(clampNumber((localProgress - delay) / 0.22, 0, 1));

          ctx.save();
          ctx.translate(centerX, lineY);
          ctx.scale(pop, pop);
          ctx.globalAlpha = clampNumber(pop, 0, 1);

          if (tok.isHighlight) {
            ctx.fillStyle = outfitColor;
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, -w / 2, -fontSize * 0.64, w, fontSize * 1.28, 12);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
          } else {
            ctx.fillStyle = palette.textColor;
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 8;
          }

          ctx.textAlign = 'center';
          ctx.fillText(tok.text, 0, 2);
          ctx.restore();

          cursorRight -= w + spaceW;
        });
      } else {
        let cursorLeft = zoneLeft;
        lineTokens.forEach((tok) => {
          const w = getTokenWidth(tok);
          const centerX = cursorLeft + w / 2;
          const delay = tok.staggerIndex * 0.05;
          const pop = !isPlaying && localProgress < 0.02
            ? 1
            : easeOutBack(clampNumber((localProgress - delay) / 0.22, 0, 1));

          ctx.save();
          ctx.translate(centerX, lineY);
          ctx.scale(pop, pop);
          ctx.globalAlpha = clampNumber(pop, 0, 1);

          if (tok.isHighlight) {
            ctx.fillStyle = outfitColor;
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, -w / 2, -fontSize * 0.64, w, fontSize * 1.28, 12);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
          } else {
            ctx.fillStyle = palette.textColor;
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 8;
          }

          ctx.textAlign = 'center';
          ctx.fillText(tok.text, 0, 2);
          ctx.restore();

          cursorLeft += w + spaceW;
        });
      }
    });

    ctx.restore();
  }

  // Clean YouTube Bottom Subtitle Bar
  if (narration) {
    const subFontSize = Math.round(width * 0.021);
    ctx.save();
    ctx.font = `700 ${subFontSize}px "Vazirmatn", "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxSubW = width * 0.84;
    const textW = Math.min(maxSubW, ctx.measureText(narration).width + 52);
    const barH = subFontSize * 2.15;
    const barY = height - barH - 22;

    ctx.fillStyle = 'rgba(8, 10, 16, 0.88)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, width / 2 - textW / 2, barY, textW, barH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(narration, width / 2, barY + barH / 2 + 1, maxSubW - 24);
    ctx.restore();
  }
}

export interface RenderFrameParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scene: SceneItem;
  character: CharacterConfig;
  theme: CanvasTheme;
  localProgress: number;
  transitionProgress: number;
  localTime: number;
  globalTime: number;
  isPlaying: boolean;
}

export function renderStickmanSceneFrame(params: RenderFrameParams) {
  const {
    ctx,
    width,
    height,
    scene,
    character,
    theme,
    localProgress,
    transitionProgress,
    localTime,
    globalTime,
    isPlaying,
  } = params;

  const palette = getThemePalette(theme);
  const effectiveTransitionProgress =
    !isPlaying && localProgress < 0.02 ? 1 : transitionProgress;
  const cam = computeCameraTransform(
    scene.camera,
    localProgress,
    scene.transition,
    effectiveTransitionProgress,
    localTime
  );

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Camera Rig Transform (Zoom-in / Zoom-out / Whip Pan / Shake)
  ctx.translate(width / 2 + cam.translateX, height / 2 + cam.translateY);
  ctx.rotate(cam.rotationRad);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-width / 2, -height / 2);

  // 1. Background & Sketchy Comic Perspective
  drawBackground(ctx, width, height, palette, character.accentColor, globalTime);

  // 2. Motion Graphics Layer & Action Speed Lines
  drawMotionGraphicLayer(
    ctx,
    width,
    height,
    scene.motionGraphic,
    character.accentColor,
    character.outfitColor,
    palette,
    localProgress,
    globalTime
  );
  if (effectiveTransitionProgress < 1) {
    drawComicSpeedLines(ctx, width, height, character.accentColor, 1 - effectiveTransitionProgress, globalTime);
  }

  // 3. Prop / Custom Gemini Vector SVG Illustration
  const propPop = !isPlaying && localProgress < 0.02
    ? 1
    : easeOutBack(clampNumber(localProgress / 0.28, 0, 1));
  const svgImg = getCachedSvgImage(scene.customSvgArtwork);
  const propX = width * 0.72;
  const propY = scene.sceneRole === 'cta-outro' ? height * 0.45 : height * 0.57;
  const propScale = (width / 1280) * propPop;

  if (svgImg) {
    ctx.save();
    const bob = Math.sin(globalTime * 3.1) * 7;
    ctx.translate(propX, propY + bob);
    ctx.scale(propScale, propScale);
    ctx.fillStyle = palette.cardSurface;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, -110, -110, 220, 220, 28);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(svgImg, -92, -92, 184, 184);
    ctx.restore();
  } else {
    drawBuiltinProp(
      ctx,
      scene.propKeyword,
      propX,
      propY,
      propScale * 1.12,
      character.accentColor,
      character.outfitColor,
      palette,
      globalTime
    );
  }

  // 4. Expressive Comic-Style Stickman Character
  const charScale = (width / 1280) * 1.18;
  drawStickmanCharacter(ctx, {
    x: width * 0.30,
    y: height * 0.495,
    scale: charScale,
    character,
    outfit: scene.outfitOverride ?? character.outfit,
    pose: scene.pose,
    emotion: scene.emotion,
    strokeColor: palette.stickmanStroke,
    time: globalTime,
    isTalking: isPlaying || localTime > 0,
  });

  // 5. Floating Comic Thought Bubble next to character head
  if (scene.thoughtBubble) {
    const bubblePop = !isPlaying && localProgress < 0.02
      ? 1
      : easeOutBack(clampNumber((localProgress - 0.08) / 0.25, 0, 1));
    drawThoughtBubble(
      ctx,
      width * 0.42,
      height * 0.265,
      scene.thoughtBubble,
      character.outfitColor,
      bubblePop * (width / 1280),
      globalTime
    );
  }

  ctx.restore();

  // 6. Crisp Screen-Space Kinetic Typography & Subtitles
  drawKineticTypography(
    ctx,
    width,
    height,
    scene,
    palette,
    character.accentColor,
    character.outfitColor,
    localProgress,
    isPlaying
  );

  // 7. Animated Subscribe / Like End-Card on Final CTA Outro
  if (scene.sceneRole === 'cta-outro') {
    const ctaProgress =
      !isPlaying && localProgress < 0.02
        ? 1
        : clampNumber((localProgress - 0.20) / 0.75, 0, 1);
    drawOutroSubscribeCard(
      ctx,
      width,
      height,
      ctaProgress,
      character.outfitColor,
      globalTime
    );
  }

  // 8. Subtle Cinematic Vignette
  ctx.save();
  const vig = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.35,
    width * 0.5,
    height * 0.5,
    width * 0.72
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 9. Fast Transition Overlay (Flash Cut / Ink Wipe)
  if (cam.flashOpacity > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${cam.flashOpacity})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (scene.transition === 'ink-wipe' && effectiveTransitionProgress < 1) {
    ctx.save();
    const wipeW = width * (1 - easeOutExpo(effectiveTransitionProgress));
    ctx.fillStyle = character.outfitColor;
    ctx.fillRect(0, 0, wipeW, height);
    ctx.restore();
  }
}
