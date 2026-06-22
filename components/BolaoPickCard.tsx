"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, Check, Loader2 } from "lucide-react";
import type { Fixture } from "@/lib/football-api";

interface Pick { home_goals: number; away_goals: number }

interface Props {
  fixture: Fixture;
  existingPick: Pick | null;
  isLocked: boolean;
}

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

  async function save() {
    const h = parseInt(home);
    const a = parseInt(away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Palpite inválido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/bolao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixture_id: fixture.fixture.id, home_goals: h, away_goals: a }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-zinc-900 p-4 space-y-3 ${isExact ? "border-green-500/50" : "border-zinc-800"}`}>
      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        <TeamMini name={fixture.teams.home.name} logo={fixture.teams.home.logo} />
        <div className="text-center text-xs text-zinc-600 flex-1">vs</div>
        <TeamMini name={fixture.teams.away.name} logo={fixture.teams.away.logo} right />
      </div>

      {/* Inputs ou estado bloqueado */}
      {isLocked ? (
        <div className="flex items-center justify-center gap-3">
          <Lock className="w-3.5 h-3.5 text-zinc-600" />
          {existingPick !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-300">
                {existingPick.home_goals} – {existingPick.away_goals}
              </span>
              {isFinished && actualHome !== null && (
                <>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className={`text-xs font-bold ${isExact ? "text-green-400" : "text-zinc-500"}`}>
                    {isExact ? "✓ +1 ponto!" : `Real: ${actualHome}–${actualAway}`}
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs text-zinc-600">Sem palpite</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <GoalInput value={home} onChange={setHome} />
          <span className="text-zinc-500 font-bold">×</span>
          <GoalInput value={away} onChange={setAway} />
          <button
            onClick={save}
            disabled={saving || saved}
            className="ml-auto flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
            {saved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function GoalInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className="w-12 h-9 text-center text-lg font-black bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-green-500"
    />
  );
}

function TeamMini({ name, logo, right }: { name: string; logo: string; right?: boolean }) {
  return (
    <div className={`flex items-center gap-2 flex-1 ${right ? "flex-row-reverse text-right" : ""}`}>
      <div className="w-7 h-7 relative flex-shrink-0">
        <Image src={logo} alt={name} fill className="object-contain" sizes="28px" />
      </div>
      <span className="text-xs font-semibold text-zinc-300 leading-tight">{name}</span>
    </div>
  );
}
