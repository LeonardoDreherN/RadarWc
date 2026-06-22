import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";
import { BolaoPickCard } from "@/components/BolaoPickCard";
import { Trophy } from "lucide-react";
import type { Fixture } from "@/lib/football-api";

const FINISHED = ["FT", "AET", "PEN"];
const GROUP_ROUND = "Fase de Grupos";

const MEDALS = ["🥇", "🥈", "🥉"];

const ROUND_ORDER = [
  "Rodada de 32",
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "3º Lugar",
  "Final",
];

interface BolaoRow {
  user_id: string;
  fixture_id: number;
  home_goals: number;
  away_goals: number;
}

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export default async function BolaoPage() {
  const db = supabaseAdmin();

  const [userId, fixturesRes, picksRes] = await Promise.all([
    getCurrentUserId(),
    db.from("fixtures_cache").select("fixture_id, data").order("fixture_id"),
    db.from("bolao_picks").select("user_id, fixture_id, home_goals, away_goals"),
  ]);

  const allFixtures: Fixture[] = (fixturesRes.data ?? []).map((r: { data: Fixture }) => r.data);
  const knockoutFixtures = allFixtures
    .filter((f) => f.league.round !== GROUP_ROUND)
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

  const allPicks: BolaoRow[] = picksRes.data ?? [];
  const myPicks = new Map<number, BolaoRow>(
    allPicks.filter((p) => p.user_id === userId).map((p) => [p.fixture_id, p])
  );

  // Pontuação: 1pt por placar exato
  const finishedKnockout = knockoutFixtures.filter((f) => FINISHED.includes(f.fixture.status.short));
  const scoreMap = new Map<string, number>();
  for (const fixture of finishedKnockout) {
    const rh = fixture.goals.home, ra = fixture.goals.away;
    if (rh === null || ra === null) continue;
    for (const pick of allPicks) {
      if (pick.fixture_id !== fixture.fixture.id) continue;
      if (pick.home_goals === rh && pick.away_goals === ra) {
        scoreMap.set(pick.user_id, (scoreMap.get(pick.user_id) ?? 0) + 1);
      }
    }
  }

  // Emails
  let emailMap = new Map<string, string>();
  if (scoreMap.size > 0) {
    try {
      const { data: { users } } = await db.auth.admin.listUsers({ perPage: 500 });
      emailMap = new Map(users.map((u) => [u.id, u.email?.split("@")[0] ?? "Usuário"]));
    } catch {}
  }

  const leaderboard = Array.from(scoreMap.entries())
    .map(([uid, pts]) => ({ uid, pts, name: emailMap.get(uid) ?? "Usuário" }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 10);

  const myScore = scoreMap.get(userId ?? "") ?? 0;
  const myRank = leaderboard.findIndex((r) => r.uid === userId) + 1;
  const myPicksCount = myPicks.size;
  const totalKnockout = knockoutFixtures.length;

  // Agrupar por fase
  const byRound = new Map<string, Fixture[]>();
  for (const f of knockoutFixtures) {
    const round = f.league.round || "Mata-mata";
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(f);
  }
  const sortedRounds = Array.from(byRound.keys()).sort(
    (a, b) =>
      (ROUND_ORDER.indexOf(a) === -1 ? 99 : ROUND_ORDER.indexOf(a)) -
      (ROUND_ORDER.indexOf(b) === -1 ? 99 : ROUND_ORDER.indexOf(b))
  );

  return (
    <div className="space-y-6 pb-4">

      {/* ── Hero ── */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-yellow-600/20 via-orange-600/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.12),transparent_60%)]" />
        <div className="relative p-5 space-y-3 border border-yellow-500/20 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-yellow-400/80 uppercase tracking-widest font-bold">Copa do Mundo 2026</p>
              <h1 className="text-xl font-black text-white leading-tight">Bolão das Finais</h1>
              <p className="text-xs text-zinc-400 max-w-55">
                Acerte o placar exato e concorra ao prêmio.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-7 h-7 text-yellow-400" />
            </div>
          </div>

          {/* Stats do usuário */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <StatChip label="Palpites" value={`${myPicksCount}/${totalKnockout}`} />
            <StatChip label="Pontos" value={myScore.toString()} highlight={myScore > 0} />
            <StatChip label="Posição" value={myRank > 0 ? `${myRank}º` : "—"} />
          </div>
        </div>
      </div>

      {/* ── Ranking ── */}
      {leaderboard.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>Ranking</SectionTitle>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800">
            {leaderboard.map((entry, i) => {
              const isMe = entry.uid === userId;
              return (
                <div
                  key={entry.uid}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-yellow-500/5" : ""}`}
                >
                  <span className="text-base w-6 text-center shrink-0">
                    {i < 3 ? MEDALS[i] : <span className="text-xs text-zinc-600">{i + 1}</span>}
                  </span>
                  <span className={`flex-1 text-sm truncate ${isMe ? "text-yellow-300 font-bold" : "text-zinc-300"}`}>
                    {entry.name}{isMe ? " (você)" : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-black ${i === 0 ? "text-yellow-400" : "text-white"}`}>
                      {entry.pts}
                    </span>
                    <span className="text-[10px] text-zinc-600">pt{entry.pts !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Jogos por fase ── */}
      {knockoutFixtures.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-400">Mata-mata ainda não começou</p>
          <p className="text-xs text-zinc-600 max-w-50 mx-auto">
            Os jogos aparecerão aqui assim que a fase de grupos terminar.
          </p>
        </div>
      ) : (
        sortedRounds.map((round) => (
          <div key={round} className="space-y-3">
            <SectionTitle>{round}</SectionTitle>
            {byRound.get(round)!.map((fixture) => (
              <BolaoPickCard
                key={fixture.fixture.id}
                fixture={fixture}
                existingPick={myPicks.get(fixture.fixture.id) ?? null}
                isLocked={fixture.fixture.status.short !== "NS"}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.12em] flex items-center gap-2">
      <span className="flex-1 h-px bg-zinc-800" />
      {children}
      <span className="flex-1 h-px bg-zinc-800" />
    </h2>
  );
}

function StatChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-center space-y-0.5">
      <p className={`text-base font-black ${highlight ? "text-yellow-400" : "text-white"}`}>{value}</p>
      <p className="text-[10px] text-zinc-600">{label}</p>
    </div>
  );
}
