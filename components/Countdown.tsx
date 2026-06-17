"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface Props {
  date: string;
}

export function Countdown({ date }: Props) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(date).getTime() - Date.now();
      if (diff <= 0) { setLabel("Em breve"); return; }

      const totalMin = Math.floor(diff / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;

      if (h >= 48) {
        const d = Math.floor(h / 24);
        setLabel(`${d}d ${h % 24}h`);
      } else if (h >= 1) {
        setLabel(`${h}h ${m.toString().padStart(2, "0")}min`);
      } else {
        setLabel(`${m}min`);
      }
    }

    calc();
    const t = setInterval(calc, 30_000);
    return () => clearInterval(t);
  }, [date]);

  if (!label) return null;

  return (
    <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
      <Clock className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
