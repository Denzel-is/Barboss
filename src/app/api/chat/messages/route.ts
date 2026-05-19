import { NextResponse } from "next/server";

import type { ChatMessageType } from "@/generated/prisma/client";
import { sendChatMessage } from "@/lib/chat";
import { listChatMessages, serializeChatMessage } from "@/lib/chat-messages";
import { writeAuthLog } from "@/lib/logs";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const MESSAGE_TYPES = new Set<ChatMessageType>(["text", "photo", "video", "voice"]);

function parseMessageType(value: unknown): ChatMessageType | null {
  return typeof value === "string" && MESSAGE_TYPES.has(value as ChatMessageType)
    ? (value as ChatMessageType)
    : null;
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Нужна авторизация." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const afterParam = searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;

  if (afterParam && after && Number.isNaN(after.getTime())) {
    return NextResponse.json({ error: "Некорректный параметр after." }, { status: 400 });
  }

  const messages = await listChatMessages({ after });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Нужна авторизация." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      messageType?: unknown;
      text?: unknown;
      fileUrl?: unknown;
      fileName?: unknown;
    };

    const messageType = parseMessageType(payload.messageType);

    if (!messageType) {
      return NextResponse.json({ error: "Некорректный тип сообщения." }, { status: 400 });
    }

    const text = typeof payload.text === "string" ? payload.text : "";
    const fileUrl = typeof payload.fileUrl === "string" ? payload.fileUrl : null;
    const fileName = typeof payload.fileName === "string" ? payload.fileName : null;

    if (messageType === "text" && !text.trim()) {
      return NextResponse.json({ error: "Введи текст сообщения." }, { status: 400 });
    }

    if (messageType !== "text" && !fileUrl?.trim()) {
      return NextResponse.json({ error: "Файл не загружен." }, { status: 400 });
    }

    const { message } = await sendChatMessage({
      senderId: session.userId,
      senderRole: session.role,
      senderUsername: session.username,
      messageType,
      text,
      fileUrl,
      fileName,
    });

    return NextResponse.json({ message: serializeChatMessage(message) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown chat error";

    await writeAuthLog({
      action: "chat_send_failed",
      message: `${session.username}: ${message}`,
      userId: session.userId,
    });

    if (message === "CHAT_TEXT_EMPTY" || message === "CHAT_FILE_REQUIRED") {
      return NextResponse.json({ error: "Сообщение пустое." }, { status: 400 });
    }

    return NextResponse.json({ error: "Не удалось отправить сообщение." }, { status: 500 });
  }
}
