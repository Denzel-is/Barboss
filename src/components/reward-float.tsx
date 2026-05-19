import { formatReward } from "@/lib/format";

export function RewardFloat({ amount }: { amount: number }) {
  if (amount <= 0) {
    return null;
  }

  return (
    <span className="reward-float pointer-events-none absolute -top-3 right-4 rounded-full border border-emerald-300/20 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-lg">
      {formatReward(amount)}
    </span>
  );
}
