import Image from "next/image";
import { getKnockoutMatches } from "@/lib/football-api";
import { GitBranch } from "lucide-react";
import type { Fixture } from "@/lib/football-api";

export const revalidate = 300;

const STAGE_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

const STAGE_LABELS: Record<string, string> = {
  ROUND_OF_32: "Oitavas de Final",
  ROUND_OF_16: "Quartas de Final",
  QUARTER_FINALS: "Semifinais",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

// WC 2026 tem 48 seleções, estrutura real:
const STAGE_LABELS_WC2026: Record<string, string> = {
  ROUND_OF_32: "Rodada de 32",
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

function statusLabel(f: Fixture) {
  const s = f.fixture.status.short;
  if (["1H", "HT", "2H", "ET", "P"].includes(s))
    return { text: `AO VIVO ${f.fixture.status.elapsed ? `${f.fixture.status.elapsed}'` : ""}`, live: true };
  if (["FT", "AET", "PEN"].includes(s)) return { text: "Encerrado", live: false };
  const d = new Date(f.fixture.date);
  return {
    text: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    live: false,
  };
}

function BracketMatch({ fixture: f }: { fixture: Fixture }) {
  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(f.fixture.status.short);
  const isFinished = ["FT", "AET", "PEN"].includes(f.fixture.status.short);
  const { text, live } = statusLabel(f);

  return (
    <div className={`rounded-xl border p-3 space-y-2 transition-colors ${
      isLive ? "border-green-500/40 bg-green-950/20" : "border-zinc-800/60 bg-zinc-900/60"
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-zinc-600">{f.league.round}</span>
        <span className={`text-[10px] font-bold ${live ? "text-green-400" : "text-zinc-600"}`}>{text}</span>
      </div>

      {/* Time da casa */}
      <TeamRow
        name={f.teams.home.name}
        logo={f.teams.home.logo}
        goals={f.goals.home}
        winner={isFinished ? f.teams.home.winner === true : undefined}
        isLive={isLive}
      />
      {/* Time visitante */}
      <TeamRow
        name={f.teams.away.name}
        logo={f.teams.away.logo}
        goals={f.goals.away}
        winner={isFinished ? f.teams.away.winner === true : undefined}
        isLive={isLive}
      />
    </div>
  );
}

function TeamRow({
  name, logo, goals, winner, isLive,
}: {
  name: string;
  logo: string;
  goals: number | null;
  winner?: boolean;
  isLive?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${winner === false ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {logo ? (
          <div className="w-6 h-6 relative shrink-0">
            <Image src={logo} alt={name} fill className="object-contain" sizes="24px" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-700 shrink-0" />
        )}
        <span className={`text-xs font-semibold truncate ${winner ? "text-white" : "text-zinc-300"}`}>
          {name}
        </span>
      </div>
      {goals !== null ? (
        <span className={`text-sm font-black w-5 text-center shrink-0 ${
          isLive ? "text-green-300 score-pulse" : winner ? "text-white" : "text-zinc-400"
        }`}>
          {goals}
        </span>
      ) : (
        <span className="text-xs text-zinc-700 w-5 text-center shrink-0">–</span>
      )}
    </div>
  );
}

export default async function ChaveamentoPage() {
  const matchesByStage = await getKnockoutMatches();
  const stages = STAGE_ORDER.filter((s) => matchesByStage[s]?.length > 0);

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <GitBranch className="w-10 h-10 text-zinc-700" />
        <p className="text-zinc-300 font-bold">Chaveamento em breve</p>
        <p className="text-zinc-600 text-sm max-w-xs">
          O chaveamento será exibido ao início da fase eliminatória (a partir de julho de 2026).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 page-transition">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-green-400" />
        <h1 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Chaveamento</h1>
      </div>

      {stages.map((stage, si) => {
        const matches = matchesByStage[stage];
        const label = STAGE_LABELS_WC2026[stage] ?? stage;
        const isFinal = stage === "FINAL";

        return (
          <section key={stage} className="space-y-2 animate-fade-in-up" style={{ animationDelay: `${si * 0.08}s` }}>
            <div className={`flex items-center gap-2 ${isFinal ? "justify-center" : ""}`}>
              {isFinal && <span className="text-lg">🏆</span>}
              <h2 className={`text-xs font-black uppercase tracking-widest ${
                isFinal ? "text-yellow-400" : "text-zinc-300"
              }`}>
                {label}
              </h2>
              {isFinal && <span className="text-lg">🏆</span>}
            </div>

            <div className={`grid gap-2 ${
              isFinal || stage === "THIRD_PLACE" ? "grid-cols-1" :
              stage === "SEMI_FINALS" ? "grid-cols-1 sm:grid-cols-2" :
              "grid-cols-1 sm:grid-cols-2"
            }`}>
              {matches.map((f) => (
                <BracketMatch key={f.fixture.id} fixture={f} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-[10px] text-zinc-700 text-center pb-2">
        Dados via football-data.org · atualizado a cada 5min
      </p>
    </div>
  );
}
