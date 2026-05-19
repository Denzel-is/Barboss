import { ChatView } from "@/components/chat-view";
import { requireRole } from "@/lib/auth";
import { listChatMessages } from "@/lib/chat-messages";

export default async function AdminChatPage() {
  const user = await requireRole("admin");
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
