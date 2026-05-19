type SectionPanelProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
};

export function SectionPanel({ title, eyebrow, children }: SectionPanelProps) {
  return (
    <section className="premium-card">
      {eyebrow ? <p className="text-sm font-bold text-emerald-700">{eyebrow}</p> : null}
      <h2 className="mt-1 text-2xl font-extrabold text-neutral-950">{title}</h2>
      <div className="mt-4 text-[15px] leading-6 text-neutral-600">{children}</div>
    </section>
  );
}
