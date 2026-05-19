import { isCircleChatVideo, type ChatMessageDto } from "@/lib/chat-message-types";

type ChatMessageContentProps = {
  message: Pick<ChatMessageDto, "messageType" | "text" | "fileUrl" | "fileName">;
};

export function ChatMessageContent({ message }: ChatMessageContentProps) {
  const caption = message.text.trim();
  const mediaFrame = "overflow-hidden rounded-[14px] border border-white/10 bg-black/40 shadow-lg";

  if (message.messageType === "text") {
    return <p className="whitespace-pre-wrap break-words">{message.text}</p>;
  }

  if (!message.fileUrl) {
    return <p className="text-sm opacity-70">Вложение недоступно</p>;
  }

  if (message.messageType === "photo") {
    return (
      <figure className="space-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={message.fileName ?? "Фото"}
          className={`${mediaFrame} max-h-64 w-full object-cover`}
          src={message.fileUrl}
        />
        {caption ? <figcaption className="whitespace-pre-wrap break-words text-sm">{caption}</figcaption> : null}
      </figure>
    );
  }

  if (message.messageType === "video") {
    const circle = isCircleChatVideo(message.fileName);

    if (circle) {
      return (
        <figure className="flex flex-col items-center gap-1">
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-[3px] border-emerald-300/35 bg-neutral-900 shadow-md">
            <video className="h-full w-full object-cover" controls playsInline preload="metadata" src={message.fileUrl} />
          </div>
          {caption ? <figcaption className="max-w-[10rem] text-center text-xs whitespace-pre-wrap">{caption}</figcaption> : null}
        </figure>
      );
    }

    return (
      <figure className="space-y-1">
        <video className={`${mediaFrame} max-h-64 w-full bg-black`} controls playsInline preload="metadata" src={message.fileUrl} />
        {caption ? <figcaption className="whitespace-pre-wrap break-words text-sm">{caption}</figcaption> : null}
      </figure>
    );
  }

  if (message.messageType === "voice") {
    return (
      <figure className="space-y-2">
        <div className="rounded-full border border-white/10 bg-white/10 px-2 py-2">
          <audio className="w-full min-w-[12rem] accent-emerald-600" controls preload="metadata" src={message.fileUrl} />
        </div>
        {caption ? <figcaption className="whitespace-pre-wrap break-words text-sm">{caption}</figcaption> : null}
      </figure>
    );
  }

  return null;
}
