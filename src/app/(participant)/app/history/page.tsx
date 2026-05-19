import { Suspense } from "react";

import { HistoryFilterChips } from "@/components/history-filter-chips";
import { ParticipantHistoryList } from "@/components/participant-history-list";
import { SectionPanel } from "@/components/section-panel";
import { requireRole } from "@/lib/auth";
import { parseParticipantHistoryFilter } from "@/lib/history-types";
import { getParticipantHistory } from "@/lib/participant-history";

const filterOptions = [
  { value: "all", label: "Все" },
  { value: "tasks", label: "Задания" },
  { value: "shop", label: "Магазин" },
  { value: "credits", label: "Начисления" },
  { value: "penalties", label: "Штрафы" },
];

type HistoryPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function ParticipantHistoryPage({ searchParams }: HistoryPageProps) {
  const user = await requireRole("participant");
  const params = await searchParams;
  const filter = parseParticipantHistoryFilter(params.filter);
  const entries = await getParticipantHistory(user.id, filter);

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="История" title="Все действия">
        <p className="text-sm text-neutral-500">
          Задания, покупки, начисления, списания и пасхальные бонусы. Записи не удаляются.
        </p>
      </SectionPanel>

      <Suspense fallback={<p className="text-sm text-neutral-500">Загрузка фильтров…</p>}>
        <HistoryFilterChips options={filterOptions} />
      </Suspense>

      <SectionPanel eyebrow="События" title={filterOptions.find((item) => item.value === filter)?.label ?? "Все"}>
        <ParticipantHistoryList entries={entries} />
      </SectionPanel>
    </div>
  );
}
