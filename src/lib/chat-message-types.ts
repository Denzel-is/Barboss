import type { ChatMessageType } from "@/generated/prisma/client";

export type ChatMessageDto = {
  id: string;
  senderId: string;
  messageType: ChatMessageType;
  text: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  sender: {
    username: string;
    role: string;
  };
};

export function isCircleChatVideo(fileName: string | null | undefined) {
  if (!fileName) {
    return false;
  }

  return fileName.toLowerCase().includes("кружоч");
}

export function chatPreviewLabel(messageType: ChatMessageType, text: string, fileName?: string | null) {
  const caption = text.trim();

  switch (messageType) {
    case "photo":
      return caption ? `📷 ${caption}` : "📷 Фото";
    case "video":
      if (isCircleChatVideo(fileName)) {
        return caption ? `⭕ ${caption}` : "⭕ Видео-кружочек";
      }

      return caption ? `🎥 ${caption}` : "🎥 Видео";
    case "voice":
      return caption ? `🎤 ${caption}` : "🎤 Голосовое";
    default:
      return caption || "Сообщение";
  }
}
