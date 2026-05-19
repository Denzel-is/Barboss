import { ChatView } from "@/components/chat-view";
import { requireRole } from "@/lib/auth";
import { listChatMessages } from "@/lib/chat-messages";

export default async function AppChatPage() {
  const user = await requireRole("participant");
  const messages = await listChatMessages({ limit: 200 });

  return (
    <ChatView
      currentUserId={user.id}
      currentUserRole={user.role}
      currentUsername={user.username}
      initialMessages={messages}
    />
  );
}
