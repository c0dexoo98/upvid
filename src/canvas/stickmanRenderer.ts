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
  cardSurface: string;
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
        cardSurface: 'rgba(15, 23, 20, 0.78)',
      };
    case 'sketchbook':
      return {
        bgPrimary: '#F5F2EB',
        bgSecondary: '#EAE4D7',
        gridColor: 'rgba(15, 23, 42, 0.06)',
        textColor: '#0F172A',
        subTextColor: '#334155',
        stickmanStroke: '#111827',
        cardSurface: 'rgba(255, 255, 255, 0.85)',
      };
    case 'blueprint':
      return {
        bgPrimary: '#0B1E3B',
        bgSecondary: '#071429',
        gridColor: 'rgba(125, 211, 252, 0.11)',
        textColor: '#F0F9FF',
        subTextColor: '#BAE6FD',
        stickmanStroke: '#F0F9FF',
        cardSurface: 'rgba(7, 20, 41, 0.82)',
      };
    case 'dark-studio':
    default:
      return {
        bgPrimary: '#0F1219',
        bgSecondary: '#090B10',
        gridColor: 'rgba(255, 255, 255, 0.055)',
        textColor: '#F8FAFC',
        subTextColor: '#CBD5E1',
        stickmanStroke: '#F8FAFC',
        cardSurface: 'rgba(15, 18, 25, 0.84)',
      };
  }
}

// Cache sanitized SVG markup -> HTMLImageElement for instant 60fps Canvas drawing
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
    width * 0.5,
    height * 0.42,
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

  // Subtle studio radial glow behind character
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(width * 0.34, height * 0.56, width * 0.22, 0, Math.PI * 2);
  ctx.fill();
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
      const cx = width * 0.34;
      const cy = height * 0.54;
      const r = width * 0.19 * enter;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.setLineDash([18, 12]);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.setLineDash([]);
      ctx.strokeStyle = outfitColor;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.15, -0.4, Math.PI * 1.1);
      ctx.stroke();
      break;
    }
    case 'chart-rise': {
      const baseX = width * 0.57;
      const baseY = height * 0.78;
      const barW = 30;
      const heights = [48, 80, 118, 164];
      heights.forEach((h, idx) => {
        const delay = idx * 0.08;
        const barProg = easeOutExpo(
          clampNumber((localProgress - delay) / 0.35, 0, 1)
        );
        const bh = h * barProg;
        const bx = baseX + idx * (barW + 16);
        ctx.fillStyle = idx === heights.length - 1 ? outfitColor : accentColor;
        ctx.globalAlpha = idx === heights.length - 1 ? 0.92 : 0.38;
        drawRoundedRect(ctx, bx, baseY - bh, barW, bh, 8);
        ctx.fill();
      });
      // Rising trend arrow safely below headline zone
      ctx.globalAlpha = 0.85;
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
        const ax = width * 0.52 + shift;
        const ay = height * (0.42 + i * 0.11);
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
      ctx.strokeStyle = outfitColor;
      ctx.lineWidth = 4;
      const bolts = [
        [0.16, 0.22],
        [0.86, 0.26],
        [0.82, 0.72],
      ];
      bolts.forEach(([rx, ry], idx) => {
        const pulse = 0.7 + 0.3 * Math.sin(time * 8 + idx * 2);
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
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = outfitColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width * 0.54, height * 0.12);
      ctx.lineTo(width * 0.54, height * 0.88);
      ctx.stroke();
      break;
    }
    case 'kinetic-callout':
    default: {
      // Corner motion brackets & sweeping arc
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.55;
      const pad = 34;
      const len = 36 * enter;
      // Top-left bracket
      ctx.beginPath();
      ctx.moveTo(pad, pad + len);
      ctx.lineTo(pad, pad);
      ctx.lineTo(pad + len, pad);
      // Bottom-right bracket
      ctx.moveTo(width - pad, height - pad - len);
      ctx.lineTo(width - pad, height - pad);
      ctx.lineTo(width - pad - len, height - pad);
      ctx.stroke();
      break;
    }
  }

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

  // Soft badge backing
  ctx.fillStyle = palette.cardSurface;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, -88, -88, 176, 176, 32);
  ctx.fill();
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
      // Flame
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

  ctx.save();
  const bounce =
    pose === 'walking'
      ? Math.abs(Math.sin(time * 9)) * -14
      : pose === 'celebrating'
      ? Math.abs(Math.sin(time * 7)) * -18
      : Math.sin(time * 3.2) * 4;

  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);

  const inkWidth = clampNumber(character.lineThickness || 5, 3, 9);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ground shadow
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(0, 148 - bounce * 0.4, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Legs
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = inkWidth + 1;
  const walkSwing = pose === 'walking' ? Math.sin(time * 9) * 26 : 0;

  // Left leg
  ctx.beginPath();
  ctx.moveTo(-14, 62);
  ctx.lineTo(-26 - walkSwing * 0.5, 108);
  ctx.lineTo(-30 - walkSwing, 144);
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(14, 62);
  ctx.lineTo(26 + walkSwing * 0.5, 108);
  ctx.lineTo(30 + walkSwing, 144);
  ctx.stroke();

  // Sneakers / shoes
  ctx.fillStyle = character.outfitColor;
  ctx.beginPath();
  ctx.ellipse(-34 - walkSwing, 146, 14, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(34 + walkSwing, 146, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso + Outfit
  const shoulderY = -24;
  const hipY = 64;

  // Back arm / Front arm calculation based on pose
  const gesture = Math.sin(time * 5.2) * 14;
  let leftHand: [number, number] = [-66, 26 + gesture * 0.4];
  let rightHand: [number, number] = [66, 26 - gesture * 0.4];

  switch (pose) {
    case 'pointing-up':
      leftHand = [-50, 34];
      rightHand = [64, -68 + Math.sin(time * 6) * 8];
      break;
    case 'presenting':
      leftHand = [-64, 18];
      rightHand = [94, -18 + Math.sin(time * 5) * 10];
      break;
    case 'celebrating':
      leftHand = [-68, -74 + Math.sin(time * 8) * 10];
      rightHand = [68, -74 - Math.sin(time * 8) * 10];
      break;
    case 'thinking':
      leftHand = [-44, 38];
      rightHand = [24, -44];
      break;
    case 'shocked':
      leftHand = [-52, -48];
      rightHand = [52, -48];
      break;
    case 'facepalm':
      leftHand = [-44, 34];
      rightHand = [10, -76];
      break;
    case 'idea':
      leftHand = [-46, 32];
      rightHand = [54, -84];
      break;
    case 'typing':
      leftHand = [-26, 28 + Math.sin(time * 22) * 6];
      rightHand = [26, 28 + Math.cos(time * 22) * 6];
      break;
    case 'chart-up':
      leftHand = [-56, 22];
      rightHand = [78, -56];
      break;
    case 'walking':
      leftHand = [-52 - walkSwing * 0.6, 26];
      rightHand = [52 + walkSwing * 0.6, 26];
      break;
  }

  // Draw Arms first (behind jacket torso edges cleanly)
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = inkWidth;
  ctx.beginPath();
  ctx.moveTo(-26, shoulderY + 6);
  ctx.quadraticCurveTo((-26 + leftHand[0]) / 2 - 12, (shoulderY + leftHand[1]) / 2 + 12, leftHand[0], leftHand[1]);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(26, shoulderY + 6);
  ctx.quadraticCurveTo((26 + rightHand[0]) / 2 + 12, (shoulderY + rightHand[1]) / 2 + 12, rightHand[0], rightHand[1]);
  ctx.stroke();

  // Draw hands
  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  ctx.arc(leftHand[0], leftHand[1], 7, 0, Math.PI * 2);
  ctx.arc(rightHand[0], rightHand[1], 7, 0, Math.PI * 2);
  ctx.fill();

  // Draw Outfit Torso
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = strokeColor;

  if (outfit === 'hoodie') {
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -32, shoulderY, 64, hipY - shoulderY + 6, 16);
    ctx.fill();
    ctx.stroke();
    // Hoodie pocket & drawstrings
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    drawRoundedRect(ctx, -20, 26, 40, 28, 8);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-9, shoulderY + 6);
    ctx.lineTo(-9, shoulderY + 30);
    ctx.moveTo(9, shoulderY + 6);
    ctx.lineTo(9, shoulderY + 30);
    ctx.stroke();
  } else if (outfit === 'suit') {
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -32, shoulderY, 64, hipY - shoulderY + 6, 12);
    ctx.fill();
    ctx.stroke();
    // White shirt V + crisp tie
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-14, shoulderY);
    ctx.lineTo(14, shoulderY);
    ctx.lineTo(0, shoulderY + 34);
    ctx.closePath();
    ctx.fill();
    // Tie
    ctx.fillStyle = character.accentColor;
    ctx.beginPath();
    ctx.moveTo(-5, shoulderY + 4);
    ctx.lineTo(5, shoulderY + 4);
    ctx.lineTo(8, shoulderY + 42);
    ctx.lineTo(0, shoulderY + 54);
    ctx.lineTo(-8, shoulderY + 42);
    ctx.closePath();
    ctx.fill();
  } else if (outfit === 'labcoat') {
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, -34, shoulderY, 68, hipY - shoulderY + 14, 12);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();
    // Inner colored shirt
    ctx.fillStyle = character.outfitColor;
    ctx.beginPath();
    ctx.moveTo(-12, shoulderY);
    ctx.lineTo(12, shoulderY);
    ctx.lineTo(0, shoulderY + 38);
    ctx.closePath();
    ctx.fill();
    // Pocket & pen
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 12, 16, 18);
    ctx.strokeStyle = character.accentColor;
    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.lineTo(16, 4);
    ctx.stroke();
  } else if (outfit === 'streetjacket') {
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -34, shoulderY, 68, hipY - shoulderY + 6, 14);
    ctx.fill();
    ctx.stroke();
    // Bold racing stripe + zipper
    ctx.fillStyle = character.accentColor;
    ctx.fillRect(-32, shoulderY + 18, 64, 12);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, shoulderY + 2);
    ctx.lineTo(0, hipY + 4);
    ctx.stroke();
  } else if (outfit === 'detective') {
    ctx.fillStyle = '#C29B61';
    drawRoundedRect(ctx, -34, shoulderY, 68, hipY - shoulderY + 16, 10);
    ctx.fill();
    ctx.stroke();
    // Trench collar & belt
    ctx.fillStyle = '#785A32';
    ctx.fillRect(-34, 24, 68, 9);
    ctx.fillStyle = character.accentColor;
    ctx.fillRect(-7, 22, 14, 13);
  } else {
    // T-shirt
    ctx.fillStyle = character.outfitColor;
    drawRoundedRect(ctx, -28, shoulderY, 56, hipY - shoulderY + 4, 12);
    ctx.fill();
    ctx.stroke();
    // Chest emblem
    ctx.fillStyle = character.accentColor;
    ctx.beginPath();
    ctx.arc(0, shoulderY + 30, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Head
  const headY = -74;
  const headR = 44;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = strokeColor === '#F8FAFC' ? '#0F172A' : strokeColor;
  ctx.lineWidth = inkWidth;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Expressive Eyes & Eyebrows
  const blink = Math.sin(time * 2.1) > 0.96 ? 0.15 : 1;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(-14, headY - 6, 4.5, 6 * blink, 0, 0, Math.PI * 2);
  ctx.ellipse(14, headY - 6, 4.5, 6 * blink, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows based on emotion
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  if (emotion === 'serious') {
    ctx.moveTo(-24, headY - 22);
    ctx.lineTo(-7, headY - 16);
    ctx.moveTo(24, headY - 22);
    ctx.lineTo(7, headY - 16);
  } else if (emotion === 'shocked' || emotion === 'curious') {
    ctx.moveTo(-24, headY - 22);
    ctx.quadraticCurveTo(-14, headY - 30, -6, headY - 22);
    ctx.moveTo(6, headY - 22);
    ctx.quadraticCurveTo(14, headY - 30, 24, headY - 22);
  } else {
    ctx.moveTo(-22, headY - 20);
    ctx.lineTo(-8, headY - 22);
    ctx.moveTo(8, headY - 22);
    ctx.lineTo(22, headY - 20);
  }
  ctx.stroke();

  // Lip-synced Mouth
  const mouthOpen = isTalking ? 4 + Math.abs(Math.sin(time * 18)) * 9 : 0;
  ctx.strokeStyle = '#0F172A';
  ctx.fillStyle = '#EF4444';
  ctx.lineWidth = 3;

  if (emotion === 'shocked') {
    ctx.beginPath();
    ctx.ellipse(0, headY + 18, 9, 11 + mouthOpen * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
  } else if (isTalking && mouthOpen > 4.5) {
    ctx.beginPath();
    ctx.ellipse(0, headY + 16, 12, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
  } else if (emotion === 'happy' || emotion === 'excited') {
    ctx.beginPath();
    ctx.arc(0, headY + 10, 14, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (emotion === 'serious') {
    ctx.beginPath();
    ctx.moveTo(-12, headY + 18);
    ctx.lineTo(12, headY + 18);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-11, headY + 16);
    ctx.quadraticCurveTo(0, headY + 23, 12, headY + 15);
    ctx.stroke();
  }

  // Eyewear
  if (character.eyewear === 'glasses') {
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.strokeRect(-28, headY - 15, 22, 16);
    ctx.strokeRect(6, headY - 15, 22, 16);
    ctx.beginPath();
    ctx.moveTo(-6, headY - 8);
    ctx.lineTo(6, headY - 8);
    ctx.stroke();
  } else if (character.eyewear === 'sunglasses') {
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, -31, headY - 16, 26, 18, 4);
    ctx.fill();
    drawRoundedRect(ctx, 5, headY - 16, 26, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, headY - 9);
    ctx.lineTo(5, headY - 9);
    ctx.stroke();
  } else if (character.eyewear === 'monocle') {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(14, headY - 6, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(26, headY - 4);
    ctx.lineTo(30, headY + 28);
    ctx.stroke();
  }

  // Headwear
  if (character.headwear === 'headphones') {
    ctx.strokeStyle = character.accentColor;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, headY - 4, headR + 4, Math.PI + 0.15, -0.15);
    ctx.stroke();
    ctx.fillStyle = '#1E293B';
    drawRoundedRect(ctx, -headR - 10, headY - 18, 14, 30, 6);
    ctx.fill();
    drawRoundedRect(ctx, headR - 4, headY - 18, 14, 30, 6);
    ctx.fill();
  } else if (character.headwear === 'cap') {
    ctx.fillStyle = character.outfitColor;
    ctx.beginPath();
    ctx.arc(0, headY - 14, headR + 2, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-10, headY - 22, 62, 10);
  } else if (character.headwear === 'crown') {
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-26, headY - 38);
    ctx.lineTo(-22, headY - 66);
    ctx.lineTo(-8, headY - 50);
    ctx.lineTo(0, headY - 72);
    ctx.lineTo(8, headY - 50);
    ctx.lineTo(22, headY - 66);
    ctx.lineTo(26, headY - 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (character.headwear === 'beanie') {
    ctx.fillStyle = character.accentColor;
    ctx.beginPath();
    ctx.arc(0, headY - 14, headR + 1, Math.PI, 0);
    ctx.fill();
    drawRoundedRect(ctx, -headR - 2, headY - 24, headR * 2 + 4, 14, 7);
    ctx.fill();
  } else if (character.headwear === 'tophat') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(-46, headY - 38, 92, 9);
    drawRoundedRect(ctx, -28, headY - 82, 56, 46, 4);
    ctx.fill();
    ctx.fillStyle = character.outfitColor;
    ctx.fillRect(-28, headY - 46, 56, 8);
  }

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
  localProgress: number
) {
  const headline = scene.headline.trim();
  const narration = scene.narration.trim();

  // 1. Bold Kinetic Headline (cleanly positioned in upper-right safe zone)
  if (headline) {
    const tokens = splitWordTokens(headline, scene.highlightWord);
    const rtl = isRtlText(headline);
    const fontSize = Math.round(width * 0.032);
    ctx.save();
    ctx.font = `800 ${fontSize}px "Vazirmatn", "Bricolage Grotesque", sans-serif`;
    ctx.textBaseline = 'middle';

    const zoneLeft = width * 0.48;
    const zoneRight = width - 44;
    const maxLineW = zoneRight - zoneLeft;
    const boxY = height * 0.14;
    const spaceW = fontSize * 0.42;

    const getTokenWidth = (tok: (typeof tokens)[number]) =>
      ctx.measureText(tok.text).width + (tok.isHighlight ? 26 : 6);

    // Wrap tokens cleanly into lines
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
      const lineY = boxY + lineIdx * (fontSize * 1.55);

      if (rtl) {
        // Draw right-to-left starting cleanly from zoneRight
        let cursorRight = zoneRight;
        lineTokens.forEach((tok) => {
          const w = getTokenWidth(tok);
          const centerX = cursorRight - w / 2;
          const delay = tok.staggerIndex * 0.055;
          const pop = easeOutBack(clampNumber((localProgress - delay) / 0.24, 0, 1));

          ctx.save();
          ctx.translate(centerX, lineY);
          ctx.scale(pop, pop);
          ctx.globalAlpha = clampNumber(pop, 0, 1);

          if (tok.isHighlight) {
            ctx.fillStyle = outfitColor;
            drawRoundedRect(ctx, -w / 2, -fontSize * 0.64, w, fontSize * 1.28, 11);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
          } else {
            ctx.fillStyle = palette.textColor;
          }

          ctx.textAlign = 'center';
          ctx.fillText(tok.text, 0, 2);
          ctx.restore();

          cursorRight -= w + spaceW;
        });
      } else {
        // Draw left-to-right starting cleanly from zoneLeft
        let cursorLeft = zoneLeft;
        lineTokens.forEach((tok) => {
          const w = getTokenWidth(tok);
          const centerX = cursorLeft + w / 2;
          const delay = tok.staggerIndex * 0.055;
          const pop = easeOutBack(clampNumber((localProgress - delay) / 0.24, 0, 1));

          ctx.save();
          ctx.translate(centerX, lineY);
          ctx.scale(pop, pop);
          ctx.globalAlpha = clampNumber(pop, 0, 1);

          if (tok.isHighlight) {
            ctx.fillStyle = outfitColor;
            drawRoundedRect(ctx, -w / 2, -fontSize * 0.64, w, fontSize * 1.28, 11);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
          } else {
            ctx.fillStyle = palette.textColor;
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

  // 2. Clean YouTube Bottom Subtitle Pill/Bar
  if (narration) {
    const subFontSize = Math.round(width * 0.021);
    ctx.save();
    ctx.font = `600 ${subFontSize}px "Vazirmatn", "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxSubW = width * 0.82;
    const textW = Math.min(maxSubW, ctx.measureText(narration).width + 48);
    const barH = subFontSize * 2.15;
    const barY = height - barH - 24;

    ctx.fillStyle = 'rgba(8, 10, 16, 0.86)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
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
  const cam = computeCameraTransform(
    scene.camera,
    localProgress,
    scene.transition,
    transitionProgress,
    localTime
  );

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Camera Rig Transform (Zoom-in / Zoom-out / Whip Pan / Shake)
  ctx.translate(width / 2 + cam.translateX, height / 2 + cam.translateY);
  ctx.rotate(cam.rotationRad);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-width / 2, -height / 2);

  // 1. Background & Grid
  drawBackground(ctx, width, height, palette, character.accentColor, globalTime);

  // 2. Motion Graphics Layer
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

  // 3. Prop / Custom Gemini Vector SVG Illustration (cleanly positioned below headline)
  const propPop = easeOutBack(clampNumber(localProgress / 0.28, 0, 1));
  const svgImg = getCachedSvgImage(scene.customSvgArtwork);
  const propX = width * 0.72;
  const propY = height * 0.60;
  const propScale = (width / 1280) * propPop;

  if (svgImg) {
    ctx.save();
    const bob = Math.sin(globalTime * 3.1) * 7;
    ctx.translate(propX, propY + bob);
    ctx.scale(propScale, propScale);
    ctx.fillStyle = palette.cardSurface;
    ctx.strokeStyle = character.accentColor;
    ctx.lineWidth = 3;
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
      propScale * 1.15,
      character.accentColor,
      character.outfitColor,
      palette,
      globalTime
    );
  }

  // 4. Expressive Stickman Character with Custom Outfit
  const charScale = (width / 1280) * 1.38;
  drawStickmanCharacter(ctx, {
    x: width * 0.31,
    y: height * 0.56,
    scale: charScale,
    character,
    outfit: scene.outfitOverride ?? character.outfit,
    pose: scene.pose,
    emotion: scene.emotion,
    strokeColor: palette.stickmanStroke,
    time: globalTime,
    isTalking: isPlaying || localTime > 0,
  });

  ctx.restore();

  // 5. Crisp Screen-Space Kinetic Typography & Subtitles
  drawKineticTypography(
    ctx,
    width,
    height,
    scene,
    palette,
    character.accentColor,
    character.outfitColor,
    localProgress
  );

  // 6. Fast Transition Overlay (Flash Cut / Ink Wipe)
  if (cam.flashOpacity > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${cam.flashOpacity})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (scene.transition === 'ink-wipe' && transitionProgress < 1) {
    ctx.save();
    const wipeW = width * (1 - easeOutExpo(transitionProgress));
    ctx.fillStyle = character.outfitColor;
    ctx.fillRect(0, 0, wipeW, height);
    ctx.restore();
  }
}
