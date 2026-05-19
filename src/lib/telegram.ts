import { writeAuthLog } from "@/lib/logs";
import { formatReward } from "@/lib/format";

function getDisplayName(username: string) {
  return username === "rayakrutaya2006" ? "Raya" : username;
}

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

function getAdminChatId() {
  return process.env.ADMIN_TELEGRAM_CHAT_ID?.trim() ?? "";
}

function getParticipantChatId() {
  return process.env.PARTICIPANT_TELEGRAM_CHAT_ID?.trim() ?? "";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

type TelegramSendResult = "sent" | "skipped" | "failed";

async function sendTelegramMessage(
  chatId: string,
  text: string,
  context?: { userId?: string; action?: string },
): Promise<TelegramSendResult> {
  const token = getBotToken();
  const normalizedChatId = chatId.trim();

  if (!token || !normalizedChatId) {
    return "skipped";
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        chat_id: normalizedChatId,
        text: text.slice(0, 4096),
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      let description = body;

      try {
        const parsed = JSON.parse(body) as { description?: string };
        description = parsed.description ?? body;
      } catch {
        // keep raw body
      }

      await writeAuthLog({
        action: context?.action ?? "telegram_failed",
        message: `chat_id=${normalizedChatId} HTTP ${response.status}: ${description}`.slice(0, 500),
        userId: context?.userId,
      });

      return "failed";
    }

    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Telegram error";
    await writeAuthLog({
      action: context?.action ?? "telegram_failed",
      message: `chat_id=${normalizedChatId}: ${message}`,
      userId: context?.userId,
    });
    return "failed";
  }
}

export function isTelegramConfigured() {
  return Boolean(getBotToken() && (getAdminChatId() || getParticipantChatId()));
}

export async function notifyAdminNewSubmission(input: {
  username: string;
  taskTitle: string;
  userId?: string;
}) {
  await sendTelegramMessage(
    getAdminChatId(),
    [
      "Новое выполнение в Barboss:",
      `Пользователь: ${getDisplayName(input.username)}`,
      `Задание: ${input.taskTitle}`,
      `Дата: ${formatDate(new Date())}`,
    ].join("\n"),
    { userId: input.userId, action: "telegram_admin_submission" },
  );
}

export async function notifyAdminNewPurchase(input: {
  username: string;
  itemTitle: string;
  price: number;
  purchasedAt: Date;
  userId?: string;
}) {
  await sendTelegramMessage(
    getAdminChatId(),
    [
      "Новая покупка в Barboss:",
      `Пользователь: ${getDisplayName(input.username)}`,
      `Товар: ${input.itemTitle}`,
      `Цена: ${priceLabel(input.price)}`,
      `Дата: ${formatDate(input.purchasedAt)}`,
    ].join("\n"),
    { userId: input.userId, action: "telegram_admin_purchase" },
  );
}

export async function notifyAdminSiteError(input: { message: string; userId?: string }) {
  await sendTelegramMessage(
    getAdminChatId(),
    ["Ошибка на сайте Barboss:", input.message, `Дата: ${formatDate(new Date())}`].join("\n"),
    { userId: input.userId, action: "telegram_admin_error" },
  );
}

export async function notifyAdminChatMessage(input: {
  username: string;
  body: string;
  userId?: string;
}) {
  await sendTelegramMessage(
    getAdminChatId(),
    [
      "Новое сообщение в чате Barboss:",
      `От: ${getDisplayName(input.username)}`,
      input.body,
      `Дата: ${formatDate(new Date())}`,
    ].join("\n"),
    { userId: input.userId, action: "telegram_admin_chat" },
  );
}

export async function notifyParticipantTaskApproved(input: {
  taskTitle: string;
  reward: number;
  userId?: string;
}) {
  await sendTelegramMessage(
    getParticipantChatId(),
    [
      "Задание принято в Barboss:",
      `Задание: ${input.taskTitle}`,
      `Начислено: ${formatReward(input.reward)}`,
      `Дата: ${formatDate(new Date())}`,
    ].join("\n"),
    { userId: input.userId, action: "telegram_participant_approved" },
  );
}

export async function notifyParticipantTaskRejected(input: {
  taskTitle: string;
  userId?: string;
}) {
  await sendTelegramMessage(
    getParticipantChatId(),
    [
      "Задание отклонено в Barboss:",
      `Задание: ${input.taskTitle}`,
      `Дата: ${formatDate(new Date())}`,
    ].join("\n"),
    { userId: input.userId, action: "telegram_participant_rejected" },
  );
}

export async function notifyParticipantPurchase(input: {
  itemTitle: string;
  price: number;
  userId?: string;
}) {
  await sendTelegramMessage(
    getParticipantChatId(),
    [
      "Покупка в Barboss:",
      `Товар: ${input.itemTitle}`,
      `Списано: ${formatReward(-input.price)}`,
      `Дата: ${formatDate(new Date())}`,
    ].join("\n"),
    { userId: input.userId, action: "telegram_participant_purchase" },
  );
}

export async function notifyParticipantChatMessage(input: { body: string; userId?: string }) {
  await sendTelegramMessage(
    getParticipantChatId(),
    ["Новое сообщение от админа в Barboss:", input.body, `Дата: ${formatDate(new Date())}`].join("\n"),
    { userId: input.userId, action: "telegram_participant_chat" },
  );
}

function priceLabel(price: number) {
  return `${price} райданчиков`;
}

/** @deprecated use notifyAdminNewPurchase */
export async function sendTelegramNotification(input: {
  itemTitle: string;
  price: number;
  purchasedAt: Date;
  username: string;
}) {
  await notifyAdminNewPurchase({
    itemTitle: input.itemTitle,
    price: input.price,
    purchasedAt: input.purchasedAt,
    username: input.username,
  });
}
