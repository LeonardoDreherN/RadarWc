"use client";

interface Props {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: Props) {
  const color =
    confidence >= 70
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : confidence >= 55
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-zinc-700/50 text-zinc-400 border-zinc-600/30";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}
    >
      {confidence}%
    </span>
  );
}
