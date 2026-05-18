import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("participant");

  return <AppShell user={user}>{children}</AppShell>;
}
