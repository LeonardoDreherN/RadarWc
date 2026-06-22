import { notFound } from "next/navigation";
import Image from "next/image";
import { MatchDateTime } from "@/components/MatchDateTime";
import { supabaseAdmin } from "@/lib/supabase";
import { BetLabel } from "@/components/BetLabel";
import { H2HStats } from "@/components/H2HStats";
import type { Fixture } from "@/lib/football-api";
import {
  analyzeGoals, analyzeResult, buildH2HSummary, parseMatchOdds,
  type MatchAnalysis, type RiskLevel, type OddImplied, type H2HSummary,
} from "@/lib/analysis";
import {
  getTeamFixtureHistory, getH2H, getFixtureOdds,
} from "@/lib/football-api";
import { analyzeMatchWithAI } from "@/lib/gemini";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

async function getFixture(id: number): Promise<Fixture | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("fixtures_cache")
    .select("data")
    .eq("fixture_id", id)
    .single();
  return data?.data ?? null;
}

interface SplitAnalysis {
  aiAnalysis: MatchAnalysis | null;
  historicalAnalysis: MatchAnalysis | null;
  oddImplied?: OddImplied;
  h2hSummary: H2HSummary;
}

const CACHE_TTL_HOURS = 6;

async function getCachedAnalysis(fixtureId: number): Promise<SplitAnalysis | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("analysis_cache")
    .select("data, updated_at")
    .eq("fixture_id", fixtureId)
    .single();
  if (!data) return null;
  const age = (Date.now() - new Date(data.updated_at).getTime()) / 3600000;
  if (age > CACHE_TTL_HOURS) return null;
  return data.data as SplitAnalysis;
}

async function saveAnalysisCache(fixtureId: number, analysis: SplitAnalysis) {
  const db = supabaseAdmin();
  await db.from("analysis_cache").upsert({
    fixture_id: fixtureId,
    data: analysis,
    updated_at: new Date().toISOString(),
  });
}

async function buildAnalysis(fixture: Fixture): Promise<SplitAnalysis> {
  // Tenta cache primeiro
  const cached = await getCachedAnalysis(fixture.fixture.id);
  if (cached) return cached;

  const homeId = fixture.teams.home.id;
  const awayId = fixture.teams.away.id;

  const [homeHistory, awayHistory, h2h, oddsData, aiResult] = await Promise.all([
    getTeamFixtureHistory(homeId).catch(() => []),
    getTeamFixtureHistory(awayId).catch(() => []),
    getH2H(homeId, awayId, fixture.fixture.id).catch(() => []),
    getFixtureOdds(fixture.fixture.id).catch(() => ({ bookmakers: [] })),
    analyzeMatchWithAI(fixture.teams.home.name, fixture.teams.away.name, fixture.fixture.id, {
      total: 0, homeWins: 0, awayWins: 0, draws: 0, avgGoals: 0, bttsCount: 0,
    }, fixture.league.round),
  ]);

  const h2hSummary = buildH2HSummary(h2h, homeId);

  const historicalLabels = [
    ...analyzeGoals(homeHistory, awayHistory, homeId, awayId),
    ...analyzeResult(h2h, homeHistory, awayHistory, homeId, awayId),
  ]
    .filter((l) => l.totalGames >= 1)
    .sort((a, b) => b.confidence - a.confidence);

  const hasRealHistory = homeHistory.length > 0 || awayHistory.length > 0;

  const result: SplitAnalysis = {
    aiAnalysis: aiResult,
    historicalAnalysis: hasRealHistory
      ? {
          fixtureId: fixture.fixture.id,
          home: fixture.teams.home.name,
          away: fixture.teams.away.name,
          labels: historicalLabels,
          h2hSummary,
        }
      : null,
    oddImplied: oddsData ? (parseMatchOdds(oddsData.bookmakers) ?? undefined) : undefined,
    h2hSummary,
  };

  // Salva no cache em background (não bloqueia a resposta)
  saveAnalysisCache(fixture.fixture.id, result).catch(() => {});

  return result;
}

export default async function JogoPage({ params }: Props) {
  const { id } = await params;
  const fixtureId = parseInt(id);

  const fixture = await getFixture(fixtureId);
  if (!fixture) notFound();
  const { aiAnalysis, historicalAnalysis, oddImplied, h2hSummary } = await buildAnalysis(fixture);

  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(fixture.fixture.status.short);
  const isFinished = ["FT", "AET", "PEN"].includes(fixture.fixture.status.short);

  const byRisk = (labels: MatchAnalysis["labels"]) => ({
    baixo: labels.filter((l) => l.risk === "baixo"),
    medio: labels.filter((l) => l.risk === "medio"),
    alto: labels.filter((l) => l.risk === "alto"),
    nao_apostar: labels.filter((l) => l.risk === "nao_apostar"),
  });

  const aiGroups = aiAnalysis ? byRisk(aiAnalysis.labels) : null;

  return (
    <div className="space-y-5">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Todos os jogos
      </Link>

      {/* Cabeçalho do jogo */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{fixture.league.round}</span>
          {isLive ? (
            <span className="text-green-400 font-bold animate-pulse">
              AO VIVO {fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : ""}
            </span>
          ) : (
            <MatchDateTime isoDate={fixture.fixture.date} />
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <TeamBlock name={fixture.teams.home.name} logo={fixture.teams.home.logo} />
          <div className="text-center">
            {fixture.goals.home !== null ? (
              <span className="text-4xl font-black text-white">
                {fixture.goals.home} – {fixture.goals.away}
              </span>
            ) : (
              <span className="text-2xl text-zinc-500 font-bold">vs</span>
            )}
            {isFinished && fixture.score?.halftime?.home !== null && (
              <p className="text-xs text-zinc-600 mt-1">
                Intervalo: {fixture.score.halftime.home}–{fixture.score.halftime.away}
              </p>
            )}
          </div>
          <TeamBlock name={fixture.teams.away.name} logo={fixture.teams.away.logo} right />
        </div>

        <p className="text-xs text-zinc-600 text-center">
          {fixture.fixture.venue.name} · {fixture.fixture.venue.city}
        </p>
      </div>

      {/* Odd implícita */}
      {oddImplied && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Probabilidade Implícita (Odds)
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <OddBlock label={fixture.teams.home.name.split(" ")[0]} value={oddImplied.home} />
            <OddBlock label="Empate" value={oddImplied.draw} />
            <OddBlock label={fixture.teams.away.name.split(" ")[0]} value={oddImplied.away} />
          </div>
        </div>
      )}

      {/* Seção 1 — Análise IA */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Análise Copa 2026</h2>

        {aiGroups ? (
          <div className="space-y-4">
            <RiskSection title="Tendência" color="text-green-400" labels={aiGroups.baixo} />
            <RiskSection title="Médio Risco" color="text-yellow-400" labels={aiGroups.medio} />
            <RiskSection title="Alto Risco" color="text-orange-400" labels={aiGroups.alto} />
            <RiskSection title="Não Apostar" color="text-zinc-500" labels={aiGroups.nao_apostar} muted />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-xs text-zinc-500">Análise IA indisponível no momento.</p>
          </div>
        )}
      </div>

      {/* H2H */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Confronto Direto</h2>
        <H2HStats
          summary={h2hSummary}
          homeName={fixture.teams.home.name}
          awayName={fixture.teams.away.name}
        />
      </div>

      <p className="text-xs text-zinc-700 text-center pb-2">
        As estatísticas são baseadas em dados históricos e não garantem resultados futuros.
        Aposte com responsabilidade.
      </p>
    </div>
  );
}

function RiskSection({
  title, color, labels, muted,
}: {
  title: string;
  color: string;
  labels: import("@/lib/analysis").BetLabel[];
  muted?: boolean;
}) {
  if (labels.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className={`text-xs font-bold uppercase tracking-widest ${color} ${muted ? "opacity-60" : ""}`}>
        {title}
      </h3>
      {labels.map((l, i) => (
        <BetLabel key={i} label={l} />
      ))}
    </section>
  );
}

function TeamBlock({ name, logo, right }: { name: string; logo: string; right?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 flex-1 ${right ? "" : ""}`}>
      <div className="w-12 h-12 relative">
        <Image src={logo} alt={name} fill className="object-contain" sizes="48px" />
      </div>
      <span className="text-sm font-semibold text-zinc-200 text-center leading-tight">
        {name}
      </span>
    </div>
  );
}

function OddBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-800/60 rounded-lg p-2.5 space-y-1">
      <p className="text-xs text-zinc-500 truncate">{label}</p>
      <p className="text-lg font-black text-white">{value}%</p>
    </div>
  );
}
