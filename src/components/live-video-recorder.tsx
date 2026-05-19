"use client";

import { useEffect, useRef, useState } from "react";

export type RecordedVideoClip = {
  id: string;
  blob: Blob;
  previewUrl: string;
  mimeType: string;
  fileName: string;
  recordedAt: number;
  durationMs: number;
};

type LiveVideoRecorderProps = {
  autoStart?: boolean;
  disabled?: boolean;
  isCircle?: boolean;
  maxClips?: number;
  maxDurationSeconds?: number;
  onClipsChange: (clips: RecordedVideoClip[]) => void;
};

function pickRecorderMimeType() {
  const candidates = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

  for (const candidate of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "";
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("mp4")) {
    return "mp4";
  }

  return "webm";
}

export function LiveVideoRecorder({
  autoStart = false,
  disabled = false,
  isCircle = false,
  maxClips = 1,
  maxDurationSeconds = 120,
  onClipsChange,
}: LiveVideoRecorderProps) {
  const [clips, setClips] = useState<RecordedVideoClip[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("video/webm");

  useEffect(() => {
    onClipsChange(clips);
  }, [clips, onClipsChange]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopCamera();
      for (const clip of clips) {
        URL.revokeObjectURL(clip.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }

    setIsCameraReady(false);
  }

  async function ensureCamera() {
    if (streamRef.current) {
      return streamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Камера недоступна в этом браузере. Открой Barboss в Safari на iPhone.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: isCircle ? "user" : "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    streamRef.current = stream;

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
      await liveVideoRef.current.play();
    }

    setIsCameraReady(true);
    return stream;
  }

  async function startRecording() {
    if (disabled || isRecording || clips.length >= maxClips) {
      return;
    }

    setError(null);

    try {
      const stream = await ensureCamera();
      const mimeType = pickRecorderMimeType();

      if (!mimeType) {
        throw new Error("Браузер не поддерживает запись видео.");
      }

      mimeTypeRef.current = mimeType;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const durationMs = Date.now() - startedAtRef.current;

        if (blob.size === 0) {
          setError("Видео не записалось. Попробуй еще раз.");
          return;
        }

        const clip: RecordedVideoClip = {
          id: crypto.randomUUID(),
          blob,
          previewUrl: URL.createObjectURL(blob),
          mimeType: mimeTypeRef.current,
          fileName: `live-proof-${Date.now()}.${extensionForMime(mimeTypeRef.current)}`,
          recordedAt: Date.now(),
          durationMs,
        };

        setClips((current) => [...current, clip]);
        stopTimer();
        setElapsedMs(0);
        setIsRecording(false);
        stopCamera();
      };

      recorder.start(1000);
      startedAtRef.current = Date.now();
      setIsRecording(true);
      setElapsedMs(0);

      stopTimer();
      timerRef.current = window.setInterval(() => {
        const nextElapsed = Date.now() - startedAtRef.current;
        setElapsedMs(nextElapsed);

        if (nextElapsed >= maxDurationSeconds * 1000) {
          stopRecording();
        }
      }, 200);
    } catch (cameraError) {
      const message =
        cameraError instanceof Error ? cameraError.message : "Не удалось включить камеру. Разреши доступ к камере и микрофону.";
      setError(message);
      stopCamera();
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") {
      return;
    }

    recorderRef.current.stop();
    recorderRef.current = null;
  }

  function removeClip(clipId: string) {
    setClips((current) => {
      const next = current.filter((clip) => {
        if (clip.id === clipId) {
          URL.revokeObjectURL(clip.previewUrl);
          return false;
        }

        return true;
      });
      return next;
    });
  }

  const canRecordMore = clips.length < maxClips;
  const seconds = Math.floor(elapsedMs / 1000);

  useEffect(() => {
    if (autoStart && !disabled && clips.length === 0 && !isRecording) {
      const timer = window.setTimeout(() => {
        void startRecording();
      }, 0);

      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <section className="space-y-3 rounded-[8px] border border-neutral-200 bg-white p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-800">Снять видео сейчас *</p>
        <p className="text-xs text-neutral-500">
          Галерея отключена — только запись с камеры. {maxClips > 1 ? `Нужно до ${maxClips} видео.` : "Нужно 1 видео."}
        </p>
      </div>

      {error ? <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div
        className={[
          "relative overflow-hidden bg-neutral-900",
          isCircle ? "mx-auto h-52 w-52 rounded-full border-4 border-emerald-700" : "aspect-video w-full rounded-[8px]",
        ].join(" ")}
      >
        <video
          autoPlay
          className={isCircle ? "h-full w-full object-cover" : "h-full w-full object-cover"}
          muted
          playsInline
          ref={liveVideoRef}
        />
        {!isCameraReady && !isRecording ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 px-4 text-center text-xs text-neutral-200">
            Нажми «Начать съемку», чтобы включить камеру
          </div>
        ) : null}
        {isRecording ? (
          <div className="absolute left-3 top-3 rounded-[6px] bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            REC {seconds}s
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!isRecording ? (
          <button
            className="h-11 rounded-[8px] bg-emerald-700 px-3 text-sm font-semibold text-white disabled:bg-emerald-300"
            disabled={disabled || !canRecordMore}
            onClick={startRecording}
            type="button"
          >
            {clips.length === 0 ? "Начать съемку" : "Снять еще"}
          </button>
        ) : (
          <button
            className="h-11 rounded-[8px] bg-red-700 px-3 text-sm font-semibold text-white"
            onClick={stopRecording}
            type="button"
          >
            Остановить
          </button>
        )}

        <button
          className="h-11 rounded-[8px] border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 disabled:text-neutral-400"
          disabled={disabled || isRecording}
          onClick={() => {
            stopRecording();
            stopCamera();
          }}
          type="button"
        >
          Выключить камеру
        </button>
      </div>

      {clips.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600">Записано: {clips.length}/{maxClips}</p>
          {clips.map((clip, index) => (
            <article className="rounded-[8px] border border-neutral-200 p-2" key={clip.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-neutral-700">
                  Видео {index + 1} · {(clip.durationMs / 1000).toFixed(1)}с
                </p>
                <button
                  className="text-xs font-medium text-red-700"
                  disabled={disabled || isRecording}
                  onClick={() => removeClip(clip.id)}
                  type="button"
                >
                  Удалить
                </button>
              </div>
              <video
                className={[
                  "mt-2 w-full bg-black",
                  isCircle ? "mx-auto h-40 w-40 rounded-full object-cover" : "max-h-48 rounded-[8px]",
                ].join(" ")}
                controls
                playsInline
                src={clip.previewUrl}
              />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
