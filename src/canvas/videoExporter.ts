import type { CanvasTheme, CharacterConfig, SceneItem } from '../types/studio';
import { computeTimelineStats, findActiveSceneAtTime } from '../utils/studioLogic';
import { renderStickmanSceneFrame } from './stickmanRenderer';

export interface ExportVideoOptions {
  scenes: SceneItem[];
  character: CharacterConfig;
  theme: CanvasTheme;
  audioUrl: string | null;
  onProgress: (percent: number) => void;
}

export interface ExportVideoResult {
  blob: Blob;
  url: string;
  mimeType: string;
  fileName: string;
}

function selectSupportedVideoMimeType(hasAudio: boolean): string {
  const candidates = hasAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/webm';
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function exportStickmanVideoWebm(
  options: ExportVideoOptions
): Promise<ExportVideoResult> {
  const { scenes, character, theme, audioUrl, onProgress } = options;
  const stats = computeTimelineStats(scenes);
  const totalDuration = Math.max(1.5, stats.totalDuration);

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for video export.');
  }

  // Draw frame 0 immediately so captureStream has an initial frame
  const initialMatch = findActiveSceneAtTime(scenes, 0);
  if (initialMatch.scene) {
    renderStickmanSceneFrame({
      ctx,
      width: canvas.width,
      height: canvas.height,
      scene: initialMatch.scene,
      character,
      theme,
      localProgress: initialMatch.localProgress,
      transitionProgress: initialMatch.transitionProgress,
      localTime: initialMatch.localTime,
      globalTime: 0,
      isPlaying: true,
    });
  }

  const canvasStream = canvas.captureStream(30);
  let audioCtx: AudioContext | null = null;
  let audioSource: AudioBufferSourceNode | null = null;
  let combinedStream: MediaStream = canvasStream;
  let hasAudioTrack = false;

  if (audioUrl) {
    try {
      const response = await fetch(audioUrl);
      const arrayBuf = await response.arrayBuffer();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await withTimeout(audioCtx.resume(), 500);
      }
      if (audioCtx.state === 'running') {
        const decodedBuffer = await withTimeout(
          audioCtx.decodeAudioData(arrayBuf.slice(0)),
          1500
        );
        if (decodedBuffer) {
          const dest = audioCtx.createMediaStreamDestination();
          audioSource = audioCtx.createBufferSource();
          audioSource.buffer = decodedBuffer;
          audioSource.connect(dest);
          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
          hasAudioTrack = true;
        }
      }
    } catch {
      combinedStream = canvasStream;
      hasAudioTrack = false;
    }
  }

  const mimeType = selectSupportedVideoMimeType(hasAudioTrack);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 4_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = () => {
      reject(new Error('MediaRecorder failed while encoding video.'));
    };
  });

  onProgress(2);
  recorder.start(200);
  if (audioSource && hasAudioTrack) {
    audioSource.start(0);
  }

  const startMs = performance.now();

  await new Promise<void>((resolve) => {
    const intervalId = window.setInterval(() => {
      const elapsedSec = (performance.now() - startMs) / 1000;
      const clampedTime = Math.min(totalDuration, elapsedSec);

      const match = findActiveSceneAtTime(scenes, clampedTime);
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
          globalTime: clampedTime,
          isPlaying: true,
        });
      }

      const pct = Math.min(99, Math.max(2, Math.round((clampedTime / totalDuration) * 100)));
      onProgress(pct);

      if (elapsedSec >= totalDuration) {
        window.clearInterval(intervalId);
        resolve();
      }
    }, 33);
  });

  if (recorder.state !== 'inactive') {
    recorder.stop();
  }
  if (audioSource) {
    try {
      audioSource.stop();
    } catch {
      // already stopped
    }
  }
  if (audioCtx) {
    await withTimeout(audioCtx.close(), 400).catch(() => {});
  }

  const blob = await recordingFinished;
  onProgress(100);
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    mimeType,
    fileName: `upvid-stickman-${Date.now()}.webm`,
  };
}
