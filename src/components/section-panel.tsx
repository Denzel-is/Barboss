type SectionPanelProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
};

export function SectionPanel({ title, eyebrow, children }: SectionPanelProps) {
  return (
    <section className="rounded-[8px] border border-neutral-200 bg-white p-4">
      {eyebrow ? <p className="text-sm font-medium text-emerald-700">{eyebrow}</p> : null}
      <h2 className="mt-1 text-lg font-semibold text-neutral-950">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-neutral-600">{children}</div>
    </section>
  );
}
