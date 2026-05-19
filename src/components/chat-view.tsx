"use client";

import { Camera, Image as ImageIcon, Mic, Paperclip, Send, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatMessageContent } from "@/components/chat-message-content";
import { LiveVideoRecorder, type RecordedVideoClip } from "@/components/live-video-recorder";
import type { ChatMessageDto } from "@/lib/chat-message-types";
import type { ChatMessageType } from "@/generated/prisma/client";

const POLL_INTERVAL_MS = 4000;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type ChatViewProps = {
  currentUserId: string;
  currentUsername: string;
  currentUserRole: string;
  initialMessages: ChatMessageDto[];
};

type LocalMessage = ChatMessageDto & {
  clientId?: string;
  pending?: boolean;
  failed?: boolean;
  errorText?: string;
};

function messageKey(message: LocalMessage) {
  return message.clientId ?? message.id;
}

function mergeMessages(existing: LocalMessage[], incoming: ChatMessageDto[]) {
  const next = [...existing];

  for (const message of incoming) {
    if (next.some((item) => item.id === message.id)) {
      continue;
    }

    const pendingIndex = next.findIndex((item) => item.pending && item.senderId === message.senderId);

    if (pendingIndex >= 0) {
      next[pendingIndex] = {
        ...message,
        clientId: next[pendingIndex].clientId,
        pending: false,
        failed: false,
      };
      continue;
    }

    next.push(message);
  }

  return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function latestTimestamp(messages: LocalMessage[]) {
  if (messages.length === 0) {
    return null;
  }

  return messages[messages.length - 1]?.createdAt ?? null;
}

export function ChatView({ currentUserId, currentUsername, currentUserRole, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [circleOpen, setCircleOpen] = useState(false);
  const [circleAutoStart, setCircleAutoStart] = useState(false);
  const [circleClips, setCircleClips] = useState<RecordedVideoClip[]>([]);
  const [quickCaptureMode, setQuickCaptureMode] = useState<"camera" | "voice">("camera");
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = listRef.current;

    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length, scrollToBottom]);

  const poll = useCallback(async () => {
    const after = latestTimestamp(messagesRef.current);

    if (!after) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/messages?after=${encodeURIComponent(after)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { messages: ChatMessageDto[] };

      if (payload.messages.length > 0) {
        setMessages((current) => mergeMessages(current, payload.messages));
      }
    } catch {
      // polling is best-effort
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [poll]);

  const groupedMessages = useMemo(() => messages, [messages]);

  async function uploadChatFile(file: File) {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/chat/upload", {
      method: "POST",
      body,
    });

    const payload = (await response.json()) as { fileUrl?: string; fileName?: string; error?: string };

    if (!response.ok || !payload.fileUrl) {
      throw new Error(payload.error ?? "Не удалось загрузить файл.");
    }

    return {
      fileUrl: payload.fileUrl,
      fileName: payload.fileName ?? file.name,
    };
  }

  async function postMessage(input: {
    messageType: ChatMessageType;
    text: string;
    fileUrl?: string | null;
    fileName?: string | null;
    clientId: string;
  }) {
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageType: input.messageType,
        text: input.text,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
      }),
    });

    const payload = (await response.json()) as { message?: ChatMessageDto; error?: string };

    if (!response.ok || !payload.message) {
      throw new Error(payload.error ?? "Не удалось отправить сообщение.");
    }

    setMessages((current) =>
      current.map((message) =>
        message.clientId === input.clientId
          ? { ...payload.message!, clientId: input.clientId, pending: false, failed: false }
          : message,
      ),
    );
  }

  function markFailed(clientId: string, errorText: string) {
    setMessages((current) =>
      current.map((message) =>
        message.clientId === clientId ? { ...message, pending: false, failed: true, errorText } : message,
      ),
    );
    setGlobalError(errorText);
  }

  function addOptimisticMessage(input: {
    clientId: string;
    messageType: ChatMessageType;
    text: string;
    fileUrl?: string | null;
    fileName?: string | null;
  }) {
    const optimistic: LocalMessage = {
      id: input.clientId,
      clientId: input.clientId,
      senderId: currentUserId,
      messageType: input.messageType,
      text: input.text,
      fileUrl: input.fileUrl ?? null,
      fileName: input.fileName ?? null,
      createdAt: new Date().toISOString(),
      sender: { username: currentUsername, role: currentUserRole },
      pending: true,
    };

    setMessages((current) => [...current, optimistic]);
    setGlobalError(null);
  }

  async function sendPayload(input: {
    messageType: ChatMessageType;
    text: string;
    file?: File | null;
    fileUrl?: string | null;
    fileName?: string | null;
  }) {
    const clientId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSending(true);
    setAttachOpen(false);
    setCircleOpen(false);

    addOptimisticMessage({
      clientId,
      messageType: input.messageType,
      text: input.text,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
    });

    try {
      let fileUrl = input.fileUrl ?? null;
      let fileName = input.fileName ?? null;

      if (input.file) {
        const uploaded = await uploadChatFile(input.file);
        fileUrl = uploaded.fileUrl;
        fileName = uploaded.fileName;

        setMessages((current) =>
          current.map((message) =>
            message.clientId === clientId ? { ...message, fileUrl, fileName } : message,
          ),
        );
      }

      await postMessage({
        clientId,
        messageType: input.messageType,
        text: input.text,
        fileUrl,
        fileName,
      });

      setText("");
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Ошибка отправки";
      markFailed(clientId, errorText);
    } finally {
      setSending(false);
      setCircleClips([]);
    }
  }

  async function handleSendText(event: React.FormEvent) {
    event.preventDefault();

    const value = text.trim();

    if (!value || sending) {
      return;
    }

    await sendPayload({ messageType: "text", text: value });
  }

  async function handleFilePick(file: File, messageType: ChatMessageType) {
    if (sending) {
      return;
    }

    const caption = text.trim();
    await sendPayload({ messageType, text: caption, file });
  }

  async function sendCircleClip() {
    const clip = circleClips[0];

    if (!clip || sending) {
      return;
    }

    const file = new File([clip.blob], `кружочек-${Date.now()}.${clip.mimeType.includes("mp4") ? "mp4" : "webm"}`, {
      type: clip.mimeType,
    });

    await sendPayload({ messageType: "video", text: text.trim(), file });
  }

  async function startVoiceRecording() {
    if (sending || recordingVoice) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      voiceRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecordingVoice(false);

        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || "audio/webm" });

        if (blob.size === 0) {
          return;
        }

        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        await handleFilePick(file, "voice");
      };

      recorder.start();
      setRecordingVoice(true);
      setAttachOpen(false);
    } catch {
      setGlobalError("Не удалось получить доступ к микрофону.");
    }
  }

  function stopVoiceRecording() {
    const recorder = voiceRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  function openCircleRecorder(autoStart = false) {
    setAttachOpen(false);
    setCircleAutoStart(autoStart);
    setCircleOpen(true);
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleQuickCapturePressStart() {
    longPressTriggeredRef.current = false;

    if (quickCaptureMode === "voice") {
      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        void startVoiceRecording();
        longPressTimerRef.current = null;
      }, 260);
      return;
    }

    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      openCircleRecorder(true);
      longPressTimerRef.current = null;
    }, 320);
  }

  function handleQuickCapturePressEnd() {
    if (quickCaptureMode === "voice") {
      clearLongPressTimer();
      stopVoiceRecording();
      return;
    }

    clearLongPressTimer();
  }

  function handleQuickCaptureClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    setQuickCaptureMode((mode) => (mode === "camera" ? "voice" : "camera"));
  }

  return (
    <div className="chat-shell -mx-4 -my-4 -mb-8 flex flex-col overflow-hidden">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base font-semibold text-neutral-900">Чат</h2>
        <p className="text-xs text-neutral-500">Сообщения сохраняются без удаления</p>
      </div>

      {globalError ? (
        <p className="mx-4 mt-2 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{globalError}</p>
      ) : null}

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3" ref={listRef}>
        {groupedMessages.length === 0 ? (
          <div className="premium-empty rounded-[8px] px-4 py-8 text-center text-sm text-neutral-500">
            Нет сообщений. Напиши первым.
          </div>
        ) : (
          groupedMessages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const failed = message.failed;

            return (
              <article
                className={["flex", isMine ? "justify-end" : "justify-start"].join(" ")}
                key={messageKey(message)}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    isMine
                      ? "rounded-br-md bg-emerald-700 text-white"
                      : "rounded-bl-md border border-neutral-200 bg-neutral-100 text-neutral-900",
                    failed ? "ring-2 ring-red-400" : "",
                    message.pending ? "opacity-80" : "",
                  ].join(" ")}
                >
                  {!isMine ? (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                      @{message.sender.username}
                    </p>
                  ) : null}

                  <ChatMessageContent message={message} />

                  <p className={["mt-1 text-[10px]", isMine ? "text-emerald-100" : "text-neutral-500"].join(" ")}>
                    {dateFormatter.format(new Date(message.createdAt))}
                    {message.pending ? " · отправка…" : null}
                    {failed ? ` · ${message.errorText ?? "ошибка"}` : null}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>

      {circleOpen ? (
        <section className="border-t border-neutral-200 bg-neutral-50 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Видео-кружочек</p>
            <button
              className="rounded-full p-1 text-neutral-600"
              onClick={() => {
                setCircleOpen(false);
                setCircleAutoStart(false);
                setCircleClips([]);
              }}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <LiveVideoRecorder
            autoStart={circleAutoStart}
            isCircle
            maxClips={1}
            maxDurationSeconds={60}
            onClipsChange={setCircleClips}
          />
          <button
            className="mt-3 h-10 w-full rounded-[8px] bg-emerald-700 text-sm font-semibold text-white disabled:opacity-50"
            disabled={circleClips.length === 0 || sending}
            onClick={() => void sendCircleClip()}
            type="button"
          >
            Отправить кружочек
          </button>
        </section>
      ) : null}

      {attachOpen ? (
        <section className="grid grid-cols-4 gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-2">
          <button
            className="flex flex-col items-center gap-1 rounded-[8px] p-2 text-xs text-neutral-700 hover:bg-white"
            onClick={() => photoInputRef.current?.click()}
            type="button"
          >
            <ImageIcon className="h-5 w-5" />
            Фото
          </button>
          <button
            className="flex flex-col items-center gap-1 rounded-[8px] p-2 text-xs text-neutral-700 hover:bg-white"
            onClick={() => videoInputRef.current?.click()}
            type="button"
          >
            <Video className="h-5 w-5" />
            Видео
          </button>
          <button
            className="flex flex-col items-center gap-1 rounded-[8px] p-2 text-xs text-neutral-700 hover:bg-white"
            onClick={() => openCircleRecorder(false)}
            type="button"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current text-[9px] font-bold">
              ○
            </span>
            Кружок
          </button>
          <button
            className="flex flex-col items-center gap-1 rounded-[8px] p-2 text-xs text-neutral-700 hover:bg-white"
            onMouseDown={() => void startVoiceRecording()}
            onMouseLeave={stopVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            onTouchStart={() => void startVoiceRecording()}
            type="button"
          >
            <Mic className={["h-5 w-5", recordingVoice ? "text-red-600" : ""].join(" ")} />
            {recordingVoice ? "Запись…" : "Голос"}
          </button>
        </section>
      ) : null}

      <form
        className="chat-composer shrink-0 border-t border-neutral-200 bg-white px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => void handleSendText(event)}
      >
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              void handleFilePick(file, "photo");
            }
          }}
          ref={photoInputRef}
          type="file"
        />
        <input
          accept="video/*"
          capture="user"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              void handleFilePick(file, "video");
            }
          }}
          ref={videoInputRef}
          type="file"
        />

        <div className="flex items-end gap-2">
          <button
            aria-label="Вложение"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-700"
            onClick={() => setAttachOpen((value) => !value)}
            type="button"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (text.trim() && !sending) {
                  void sendPayload({ messageType: "text", text: text.trim() });
                }
              }
            }}
            placeholder="Сообщение…"
            rows={1}
            value={text}
          />

          <button
            aria-label={quickCaptureMode === "camera" ? "Кружочек" : "Голосовое сообщение"}
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-700",
              recordingVoice || circleOpen ? "media-circle-recording text-red-700" : "",
            ].join(" ")}
            onClick={handleQuickCaptureClick}
            onPointerCancel={handleQuickCapturePressEnd}
            onPointerDown={handleQuickCapturePressStart}
            onPointerLeave={handleQuickCapturePressEnd}
            onPointerUp={handleQuickCapturePressEnd}
            type="button"
          >
            {quickCaptureMode === "camera" ? <Camera className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            aria-label="Отправить"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white disabled:opacity-50"
            disabled={sending || !text.trim()}
            type="submit"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
