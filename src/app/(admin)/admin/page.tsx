import { SectionPanel } from "@/components/section-panel";
import { getDb } from "@/lib/db";

export default async function AdminHomePage() {
  const pendingCount = await getDb().taskSubmission.count({
    where: { status: "pending" },
  });

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="Главная" title="Админ-панель">
        <p className="text-3xl font-semibold text-neutral-950">{pendingCount}</p>
        <p className="mt-2 text-sm text-neutral-500">отправок ожидают проверки</p>
      </SectionPanel>
    </div>
  );
}
