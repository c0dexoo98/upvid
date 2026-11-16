import { useRef, useState } from 'react';
import {
  AudioLines,
  Mic,
  Square,
  Upload,
  Wand2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { Language } from '../types/studio';
import { COPY } from '../utils/i18n';
import { formatTimecode } from '../utils/studioLogic';

interface AudioInputPanelProps {
  language: Language;
  audioUrl: string | null;
  audioFileName: string;
  audioDuration: number;
  isAnalyzing: boolean;
  analyzeError: string | null;
  onAudioLoaded: (payload: {
    url: string;
    base64: string;
    mimeType: string;
    fileName: string;
    duration: number;
  }) => void;
  onLoadSample: (sampleLang: 'fa' | 'en') => void;
  onAnalyzeAudio: () => void;
  onGoToStoryboard: () => void;
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio file.'));
    reader.readAsDataURL(blob);
  });
}

function probeAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 14;
      resolve(dur);
    };
    audio.onerror = () => resolve(14);
    audio.src = url;
  });
}

export function AudioInputPanel({
  language,
  audioUrl,
  audioFileName,
  audioDuration,
  isAnalyzing,
  analyzeError,
  onAudioLoaded,
  onLoadSample,
  onAnalyzeAudio,
  onGoToStoryboard,
}: AudioInputPanelProps) {
  const t = COPY[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const handleFileProcess = async (file: File) => {
    setMicError(null);
    const url = URL.createObjectURL(file);
    const [base64, duration] = await Promise.all([
      readBlobAsBase64(file),
      probeAudioDuration(url),
    ]);
    onAudioLoaded({
      url,
      base64,
      mimeType: file.type || 'audio/mpeg',
      fileName: file.name,
      duration,
    });
  };

  const toggleRecording = async () => {
    setMicError(null);
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const [base64, duration] = await Promise.all([
          readBlobAsBase64(blob),
          probeAudioDuration(url),
        ]);
        onAudioLoaded({
          url,
          base64,
          mimeType,
          fileName: `mic-recording-${Date.now()}.webm`,
          duration,
        });
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError(
        language === 'fa'
          ? 'دسترسی به میکروفون امکان‌پذیر نیست. فایل صوتی آپلود کنید یا از صدای نمونه استفاده کنید.'
          : 'Microphone access unavailable. Please upload an audio file or load a sample track.'
      );
    }
  };

  const ForwardArrow = language === 'fa' ? ArrowLeft : ArrowRight;

  return (
    <section className="rounded-xl border border-white/10 bg-[#13161F] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <AudioLines className="h-5 w-5 text-orange-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-white">{t.audioPanelTitle}</h2>
        </div>
        {audioDuration > 0 && (
          <span className="text-xs font-mono-tabular text-slate-400">
            {formatTimecode(audioDuration)}
          </span>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFileProcess(file);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-orange-400 bg-orange-500/10'
            : 'border-white/15 bg-[#0B0D12]/70 hover:border-white/25'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          aria-label={t.dropAudioTitle}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileProcess(file);
          }}
        />
        <Upload className="mx-auto h-8 w-8 text-orange-400 mb-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-white mb-1">{t.dropAudioTitle}</p>
        <p className="text-xs text-slate-400 mb-4">{t.dropAudioHint}</p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{language === 'fa' ? 'انتخاب فایل صوتی' : 'Choose Audio File'}</span>
          </button>

          <button
            type="button"
            onClick={() => void toggleRecording()}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            {isRecording ? (
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isRecording ? t.stopMic : t.recordMic}</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
        <span className="text-xs text-slate-400">
          {language === 'fa' ? 'یا تست سریع با صدای آماده:' : 'Or quick-test with a studio sample:'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onLoadSample('fa')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1A1E29] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-orange-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
            <span>{t.loadSampleFa}</span>
          </button>
          <button
            type="button"
            onClick={() => onLoadSample('en')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1A1E29] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>{t.loadSampleEn}</span>
          </button>
        </div>
      </div>

      {/* Loaded Audio Preview */}
      {audioUrl && (
        <div className="rounded-lg border border-white/10 bg-[#0B0D12] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-200 truncate">{audioFileName}</span>
            <span className="font-mono-tabular text-orange-400 shrink-0">
              {formatTimecode(audioDuration)}
            </span>
          </div>
          <audio controls src={audioUrl} className="w-full h-9" />
        </div>
      )}

      {micError && (
        <p role="alert" className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {micError}
        </p>
      )}

      {analyzeError && (
        <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {analyzeError}
        </p>
      )}

      {/* Primary Analyze & Proceed Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onAnalyzeAudio}
          disabled={isAnalyzing}
          className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-orange-400 disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          <span>{isAnalyzing ? t.analyzingAudio : t.analyzeWithAi}</span>
        </button>

        <button
          type="button"
          onClick={onGoToStoryboard}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#1A1E29] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          <span>{t.goToStoryboard}</span>
          <ForwardArrow className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
