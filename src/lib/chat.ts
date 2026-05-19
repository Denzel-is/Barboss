import type { ChatMessageType, Role } from "@/generated/prisma/client";
import { chatPreviewLabel } from "@/lib/chat-message-types";
import { getDb } from "@/lib/db";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { createAdminNotifications, createNotification } from "@/lib/notifications";
import {
  notifyAdminChatMessage,
  notifyParticipantChatMessage,
} from "@/lib/telegram";

export async function getParticipantsForChat() {
  return getDb().user.findMany({
    where: { role: "participant" },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
  });
}

export type SendChatMessageInput = {
  senderId: string;
  senderRole: Role;
  senderUsername: string;
  messageType: ChatMessageType;
  text?: string;
  fileUrl?: string | null;
  fileName?: string | null;
};

export async function sendChatMessage(input: SendChatMessageInput) {
  const text = input.text?.trim() ?? "";
  const fileUrl = input.fileUrl?.trim() || null;
  const fileName = input.fileName?.trim() || null;

  if (input.messageType === "text" && !text) {
    throw new Error("CHAT_TEXT_EMPTY");
  }

  if (input.messageType !== "text" && !fileUrl) {
    throw new Error("CHAT_FILE_REQUIRED");
  }

  const preview = chatPreviewLabel(input.messageType, text, fileName);

  const message = await getDb().chatMessage.create({
    data: {
      senderId: input.senderId,
      messageType: input.messageType,
      text,
      fileUrl,
      fileName,
    },
    include: {
      sender: {
        select: {
          username: true,
          role: true,
        },
      },
    },
  });

  if (input.senderRole === "participant") {
    await createAdminNotifications({
      title: "Новое сообщение в чате",
      message: `${input.senderUsername}: ${preview}`,
      type: NOTIFICATION_TYPES.chatMessage,
    });

    const admins = await getDb().user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    await notifyAdminChatMessage({
      username: input.senderUsername,
      body: preview,
      userId: input.senderId,
    });

    return { message, notifiedUserIds: admins.map((admin) => admin.id) };
  }

  const participants = await getParticipantsForChat();

  if (participants.length > 0) {
    await getDb().notification.createMany({
      data: participants.map((participant) => ({
        userId: participant.id,
        title: "Сообщение от админа",
        message: preview,
        type: NOTIFICATION_TYPES.chatMessage,
        isRead: false,
      })),
    });

    await notifyParticipantChatMessage({
      body: preview,
      userId: input.senderId,
    });
  }

  return { message, notifiedUserIds: participants.map((participant) => participant.id) };
}
