function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

/**
 * Generates a clean 13-second rhythmic studio WAV track in-browser
 * so users can test full video playback and WebM audio+video export immediately.
 */
export function createSampleStudioAudio(durationSeconds = 13): {
  blob: Blob;
  url: string;
  base64: string;
  mimeType: string;
  duration: number;
} {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Subtle lo-fi YouTube background marimba/synth pulse + scene transition whoosh accents
  const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 392.0];
  const sceneCuts = [0, 3.0, 6.2, 9.5];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(t * 2);
    const beatLocal = (t * 2) % 1;
    const freq = notes[beatIndex % notes.length];

    const pluckEnv = Math.exp(-beatLocal * 6.5);
    const pad = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.08;
    const pluck =
      (Math.sin(2 * Math.PI * freq * t) +
        0.35 * Math.sin(2 * Math.PI * freq * 2 * t)) *
      pluckEnv *
      0.16;

    // Subtle cut chime on scene transitions
    let cutSfx = 0;
    for (const cutTime of sceneCuts) {
      const dt = t - cutTime;
      if (dt >= 0 && dt < 0.18) {
        const sfxEnv = Math.exp(-dt * 24);
        cutSfx += Math.sin(2 * Math.PI * (640 + dt * 1600) * dt) * sfxEnv * 0.18;
      }
    }

    const fadeOut = t > durationSeconds - 0.6 ? Math.max(0, (durationSeconds - t) / 0.6) : 1;
    const sample = Math.max(-0.95, Math.min(0.95, (pad + pluck + cutSfx) * fadeOut));
    view.setInt16(44 + i * 2, Math.floor(sample * 32767), true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const base64 = arrayBufferToBase64(buffer);

  return {
    blob,
    url,
    base64,
    mimeType: 'audio/wav',
    duration: durationSeconds,
  };
}
