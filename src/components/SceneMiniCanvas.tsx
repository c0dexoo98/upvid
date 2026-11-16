import { useEffect, useRef } from 'react';
import type { CanvasTheme, CharacterConfig, SceneItem } from '../types/studio';
import { renderStickmanSceneFrame } from '../canvas/stickmanRenderer';

interface SceneMiniCanvasProps {
  scene: SceneItem;
  character: CharacterConfig;
  theme: CanvasTheme;
  animate?: boolean;
  className?: string;
}

export function SceneMiniCanvas({
  scene,
  character,
  theme,
  animate = false,
  className = '',
}: SceneMiniCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!animate) {
      renderStickmanSceneFrame({
        ctx,
        width: canvas.width,
        height: canvas.height,
        scene,
        character,
        theme,
        localProgress: 0.55,
        transitionProgress: 1,
        localTime: 1.2,
        globalTime: scene.index * 1.7 + 1.2,
        isPlaying: false,
      });
      return;
    }

    let rafId = 0;
    const start = performance.now();
    const dur = Math.max(1.2, scene.endTime - scene.startTime);

    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const localTime = elapsed % dur;
      const localProgress = localTime / dur;
      const transitionProgress = localTime < 0.25 ? localTime / 0.25 : 1;

      renderStickmanSceneFrame({
        ctx,
        width: canvas.width,
        height: canvas.height,
        scene,
        character,
        theme,
        localProgress,
        transitionProgress,
        localTime,
        globalTime: elapsed,
        isPlaying: true,
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scene, character, theme, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className={`w-full aspect-video rounded-lg bg-[#0B0D12] object-cover ${className}`}
    />
  );
}
