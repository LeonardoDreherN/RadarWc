"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BASE = 100;
const PER_USER = 1.5;

export function BolaoPot({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const channel = supabase()
      .channel("bolao-pot")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => {
          setCount((c) => c + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);
        }
      )
      .subscribe();

    return () => { supabase().removeChannel(channel); };
  }, []);

  const pot = BASE + count * PER_USER;
  const formatted = pot.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1">
        <span className="text-xs text-yellow-400/70 font-bold">R$</span>
        <span className={`text-4xl font-black text-yellow-400 tabular-nums transition-all duration-300 ${pulse ? "scale-110" : "scale-100"}`}>
          {formatted}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-zinc-500">
          {count} usuários · +R$1,50 por novo cadastro
        </span>
      </div>
    </div>
  );
}
