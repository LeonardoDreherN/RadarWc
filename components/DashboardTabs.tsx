"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "hoje",   label: "Hoje" },
  { key: "amanha", label: "Amanhã" },
  { key: "semana", label: "Semana" },
  { key: "todos",  label: "Todos" },
];

export function DashboardTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("f") ?? "hoje";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => router.push(`/dashboard?f=${tab.key}`, { scroll: false })}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            active === tab.key
              ? "bg-green-600 text-white shadow-md shadow-green-900/40"
              : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
