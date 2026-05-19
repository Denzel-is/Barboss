import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing in .env");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const payload = await response.json();

if (!payload.ok) {
  console.error("getUpdates failed:", payload);
  process.exit(1);
}

const chats = new Map();

for (const update of payload.result ?? []) {
  const chat = update.message?.chat ?? update.my_chat_member?.chat;
  if (!chat?.id) {
    continue;
  }

  chats.set(String(chat.id), {
    chatId: String(chat.id),
    name: [chat.first_name, chat.last_name].filter(Boolean).join(" "),
    username: chat.username ? `@${chat.username}` : "",
    type: chat.type,
  });
}

if (chats.size === 0) {
  console.log("Нет чатов. Напиши боту /start в Telegram, затем запусти снова.");
  process.exit(0);
}

console.log("Используй chat.id (НЕ update_id) в .env:\n");

for (const chat of chats.values()) {
  console.log(`  ${chat.chatId}  ${chat.name}  ${chat.username}  (${chat.type})`);
}

console.log("\nПример:");
console.log('ADMIN_TELEGRAM_CHAT_ID="..."');
console.log('PARTICIPANT_TELEGRAM_CHAT_ID="..."');
