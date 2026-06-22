"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PLATFORM_BONUS = 100;
const PER_USER = 1.5;
const USER_OFFSET = 33; // base de usuários já contabilizados

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BolaoPot({ initialCount }: { initialCount: number }) {
  const [realCount, setRealCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);

  async function refetch() {
    try {
      const res = await fetch("/api/bolao/pot");
      if (res.ok) {
        const { count: fresh } = await res.json();
        if (fresh !== realCount) {
          setRealCount(fresh);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);
        }
      }
    } catch {}
  }

  useEffect(() => {
    const channel = supabase()
      .channel("bolao-pot")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: "has_access=eq.true" },
        () => refetch()
      )
      .subscribe();

    return () => { supabase().removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedUsers = realCount + USER_OFFSET;
  const userPart = displayedUsers * PER_USER;
  const total = PLATFORM_BONUS + userPart;

  return (
    <div className="space-y-2">
      {/* Total */}
      <div className="flex items-baseline gap-1">
        <span className="text-xs text-yellow-400/70 font-bold">R$</span>
        <span className={`text-4xl font-black text-yellow-400 tabular-nums transition-transform duration-300 ${pulse ? "scale-110" : "scale-100"}`}>
          {fmt(total)}
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          <span className="text-zinc-400">
            <span className="font-bold text-white">R$ {fmt(userPart)}</span> de {displayedUsers} assinantes
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
          <span className="text-zinc-400">
            <span className="font-bold text-white">R$ {fmt(PLATFORM_BONUS)}</span> bônus da plataforma
          </span>
        </div>
      </div>
    </div>
  );
}
