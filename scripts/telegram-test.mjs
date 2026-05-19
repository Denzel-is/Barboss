import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID?.trim();
const participantChatId = process.env.PARTICIPANT_TELEGRAM_CHAT_ID?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing");
  process.exit(1);
}

async function send(label, chatId) {
  if (!chatId) {
    console.log(`${label}: skip (no chat id)`);
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Barboss test: ${label}`,
    }),
  });

  const body = await response.json();
  console.log(`${label} (${chatId}):`, body.ok ? "OK" : body.description ?? body);
}

await send("admin", adminChatId);
await send("participant", participantChatId);
