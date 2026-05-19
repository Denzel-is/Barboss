import type { ChatMessageType } from "@/generated/prisma/client";
import type { ChatMessageDto } from "@/lib/chat-message-types";
import { getDb } from "@/lib/db";

const senderSelect = {
  username: true,
  role: true,
} as const;

export function serializeChatMessage(message: {
  id: string;
  senderId: string;
  messageType: ChatMessageType;
  text: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: Date;
  sender: { username: string; role: string };
}): ChatMessageDto {
  return {
    id: message.id,
    senderId: message.senderId,
    messageType: message.messageType,
    text: message.text,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    createdAt: message.createdAt.toISOString(),
    sender: message.sender,
  };
}

export async function listChatMessages(options?: { after?: Date; limit?: number }) {
  const limit = options?.limit ?? 200;

  const messages = await getDb().chatMessage.findMany({
    where: options?.after
      ? {
          createdAt: {
            gt: options.after,
          },
        }
      : undefined,
    include: {
      sender: {
        select: senderSelect,
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return messages.map(serializeChatMessage);
}
