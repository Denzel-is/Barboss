type TelegramPurchaseInput = {
  itemTitle: string;
  price: number;
  purchasedAt: Date;
  username: string;
};

function getDisplayName(username: string) {
  return username === "rayakrutaya2006" ? "Raya" : username;
}

export async function sendTelegramNotification({ itemTitle, price, purchasedAt, username }: TelegramPurchaseInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const text = [
    "Новая покупка в Barboss:",
    `Пользователь: ${getDisplayName(username)}`,
    `Товар: ${itemTitle}`,
    `Цена: ${price} райданчиков`,
    `Дата: ${new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(purchasedAt)}`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  } catch (error) {
    console.error("Telegram notification failed", error);
  }
}
