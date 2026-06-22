"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, Check, Loader2, Minus } from "lucide-react";
import { motion } from "framer-motion";
import type { Fixture } from "@/lib/football-api";

interface Pick { home_goals: number; away_goals: number }
interface Props { fixture: Fixture; existingPick: Pick | null; isLocked: boolean }

export function BolaoPickCard({ fixture, existingPick, isLocked }: Props) {
  const [home, setHome] = useState<string>(existingPick?.home_goals?.toString() ?? "");
  const [away, setAway] = useState<string>(existingPick?.away_goals?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isFinished = ["FT", "AET", "PEN"].includes(fixture.fixture.status.short);
  const actualHome = fixture.goals.home;
  const actualAway = fixture.goals.away;

  const isExact =
    isFinished &&
    existingPick !== null &&
    existingPick.home_goals === actualHome &&
    existingPick.away_goals === actualAway;

  const hasPick = existingPick !== null;

  async function save() {
    const h = parseInt(home);
    const a = parseInt(away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { setError("Placar inválido"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/bolao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixture_id: fixture.fixture.id, home_goals: h, away_goals: a }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro ao salvar"); }
      else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border overflow-hidden ${
        isExact
          ? "border-green-500/60 bg-green-950/20"
          : isFinished && hasPick
          ? "border-zinc-700 bg-zinc-900/80"
          : isLocked
          ? "border-zinc-800 bg-zinc-900/50"
          : "border-zinc-700 bg-zinc-900"
      }`}
    >
      {/* Faixa de acerto */}
      {isExact && (
        <div className="bg-green-500 text-black text-[10px] font-black tracking-widest uppercase text-center py-1">
          Placar exato — +1 ponto!
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Times + placar atual */}
        <div className="flex items-center justify-between gap-2">
          <TeamBlock name={fixture.teams.home.name} logo={fixture.teams.home.logo} />

          <div className="flex flex-col items-center gap-1 shrink-0">
            {isFinished && actualHome !== null ? (
              <span className="text-2xl font-black text-white tabular-nums">
                {actualHome}<span className="text-zinc-500 mx-1">–</span>{actualAway}
              </span>
            ) : fixture.fixture.status.short !== "NS" ? (
              <span className="text-sm font-bold text-green-400 animate-pulse">AO VIVO</span>
            ) : (
              <Minus className="w-4 h-4 text-zinc-600" />
            )}
            <span className="text-[10px] text-zinc-600 text-center leading-tight max-w-[80px] truncate">
              {fixture.league.round}
            </span>
          </div>

          <TeamBlock name={fixture.teams.away.name} logo={fixture.teams.away.logo} right />
        </div>

        {/* Área de palpite */}
        {isLocked ? (
          <div className={`rounded-xl p-3 flex items-center justify-center gap-3 ${hasPick ? "bg-zinc-800/60" : "bg-zinc-800/30"}`}>
            <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            {hasPick ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">Seu palpite:</span>
                <span className={`font-black text-sm ${isExact ? "text-green-400" : isFinished ? "text-zinc-400 line-through" : "text-white"}`}>
                  {existingPick.home_goals} – {existingPick.away_goals}
                </span>
              </div>
            ) : (
              <span className="text-xs text-zinc-600">Você não palpitou neste jogo</span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500 text-center">Qual será o placar?</p>
            <div className="flex items-center gap-3">
              {/* Home input */}
              <div className="flex-1 flex items-center gap-2">
                <div className="w-7 h-7 relative shrink-0">
                  <Image src={fixture.teams.home.logo} alt={fixture.teams.home.name} fill className="object-contain" sizes="28px" />
                </div>
                <input
                  type="number" min={0} max={99} value={home}
                  onChange={(e) => setHome(e.target.value)}
                  placeholder="0"
                  className="flex-1 h-11 text-center text-xl font-black bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <span className="text-zinc-500 font-black text-lg">×</span>

              {/* Away input */}
              <div className="flex-1 flex items-center gap-2 flex-row-reverse">
                <div className="w-7 h-7 relative shrink-0">
                  <Image src={fixture.teams.away.logo} alt={fixture.teams.away.name} fill className="object-contain" sizes="28px" />
                </div>
                <input
                  type="number" min={0} max={99} value={away}
                  onChange={(e) => setAway(e.target.value)}
                  placeholder="0"
                  className="flex-1 h-11 text-center text-xl font-black bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={save} disabled={saving || saved}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60
                bg-green-600 hover:bg-green-500 active:scale-95 text-white flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved && <Check className="w-4 h-4" />}
              {saved ? "Palpite salvo!" : saving ? "Salvando..." : hasPick ? "Atualizar palpite" : "Confirmar palpite"}
            </button>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TeamBlock({ name, logo, right }: { name: string; logo: string; right?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${right ? "" : ""}`}>
      <div className="w-10 h-10 relative">
        <Image src={logo} alt={name} fill className="object-contain" sizes="40px" />
      </div>
      <span className="text-[11px] font-semibold text-zinc-300 text-center leading-tight max-w-[80px]">{name}</span>
    </div>
  );
}
