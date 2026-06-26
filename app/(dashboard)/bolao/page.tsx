import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";
import { BolaoPickCard } from "@/components/BolaoPickCard";
import { BolaoPot } from "@/components/BolaoPot";
import { Trophy } from "lucide-react";
import type { Fixture } from "@/lib/football-api";

const FINISHED = ["FT", "AET", "PEN"];
const GROUP_ROUNDS = ["Fase de Grupos", "GROUP_STAGE"];
const MEDALS = ["🥇", "🥈", "🥉"];
const ROUND_ORDER = ["16 Avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "3º Lugar", "Final"];

const ROUND_NORMALIZE: Record<string, string> = {
  LAST_32: "16 Avos de Final",
  LAST_16: "Oitavas de Final",
  ROUND_OF_32: "16 Avos de Final",
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

function normalizeRound(round: string): string {
  return ROUND_NORMALIZE[round] ?? round;
}

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

  const [userId, fixturesRes, picksRes, usersCountRes] = await Promise.all([
    getCurrentUserId(),
    db.from("fixtures_cache").select("fixture_id, data").order("fixture_id"),
    db.from("bolao_picks").select("user_id, fixture_id, home_goals, away_goals"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("has_access", true),
  ]);

  const userCount = usersCountRes.count ?? 0;
  const allFixtures: Fixture[] = (fixturesRes.data ?? []).map((r: { data: Fixture }) => r.data);
  const knockoutFixtures = allFixtures
    .filter((f) => !GROUP_ROUNDS.includes(f.league.round))
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

  const allPicks: BolaoRow[] = picksRes.data ?? [];
  const myPicks = new Map<number, BolaoRow>(
    allPicks.filter((p) => p.user_id === userId).map((p) => [p.fixture_id, p])
  );

  // Pontuação: 1pt por placar exato em jogos encerrados
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

  // Ranking: todos que fizeram palpites, mesmo com 0 pts
  const allPickUserIds = Array.from(new Set(allPicks.map((p) => p.user_id)));
  let leaderboard: { uid: string; pts: number; name: string }[] = [];

  if (allPickUserIds.length > 0) {
    try {
      const { data: { users } } = await db.auth.admin.listUsers({ perPage: 500 });
      const emailMap = new Map(users.map((u) => [u.id, u.email?.split("@")[0] ?? "Usuário"]));
      leaderboard = allPickUserIds
        .map((uid) => ({ uid, pts: scoreMap.get(uid) ?? 0, name: emailMap.get(uid) ?? "Usuário" }))
        .sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name))
        .slice(0, 10);
    } catch {}
  }

  const anyScored = leaderboard.some((e) => e.pts > 0);

  const myScore = scoreMap.get(userId ?? "") ?? 0;
  const myRank = leaderboard.findIndex((r) => r.uid === userId) + 1;
  const myPicksCount = myPicks.size;
  const totalKnockout = knockoutFixtures.length;

  // Agrupar por fase
  const byRound = new Map<string, Fixture[]>();
  for (const f of knockoutFixtures) {
    const round = normalizeRound(f.league.round || "Mata-mata");
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

      {/* ── Hero com pot ── */}
      <div className="relative rounded-2xl overflow-hidden border border-yellow-500/20">
        <div className="absolute inset-0 bg-linear-to-br from-yellow-600/20 via-orange-600/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.12),transparent_60%)]" />

        <div className="relative p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest font-bold">Copa do Mundo 2026</p>
              <h1 className="text-lg font-black text-white">Bolão das Finais</h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
          </div>

          {/* Pot ao vivo */}
          <div className="rounded-xl bg-black/30 border border-yellow-500/15 p-4 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Prêmio acumulado</p>
            <BolaoPot initialCount={userCount} />
          </div>

          {/* Stats pessoais */}
          <div className="grid grid-cols-3 gap-2">
            <StatChip label="Palpites" value={`${myPicksCount}/${totalKnockout || "?"}`} />
            <StatChip label="Pontos" value={myScore.toString()} highlight={myScore > 0} />
            <StatChip label="Posição" value={myRank > 0 ? `${myRank}º` : "—"} />
          </div>
        </div>
      </div>

      {/* ── Ranking ── */}
      <div className="space-y-3">
        <SectionTitle>Ranking</SectionTitle>

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-400">Nenhum palpite ainda</p>
            <p className="text-xs text-zinc-600">Seja o primeiro a palpitar!</p>
          </div>
        ) : (
          <>
            {!anyScored && (
              <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
                <p className="text-xs text-zinc-400">Aguardando o primeiro resultado do mata-mata</p>
              </div>
            )}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800">
              {leaderboard.map((entry, i) => {
                const isMe = entry.uid === userId;
                return (
                  <div
                    key={entry.uid}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-yellow-500/5" : ""}`}
                  >
                    <span className="w-6 text-center shrink-0">
                      {anyScored && i < 3
                        ? <span className="text-base">{MEDALS[i]}</span>
                        : <span className="text-xs text-zinc-600">{i + 1}</span>}
                    </span>
                    <span className={`flex-1 text-sm truncate ${isMe ? "text-yellow-300 font-bold" : "text-zinc-300"}`}>
                      {entry.name}{isMe ? " (você)" : ""}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-sm font-black tabular-nums ${i === 0 && entry.pts > 0 ? "text-yellow-400" : "text-zinc-400"}`}>
                        {entry.pts}
                      </span>
                      <span className="text-[10px] text-zinc-600">pt{entry.pts !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-700 text-center">
              Ranking atualiza conforme os jogos encerram
            </p>
          </>
        )}
      </div>

      {/* ── Jogos por fase ── */}
      {knockoutFixtures.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-400">Mata-mata ainda não começou</p>
          <p className="text-xs text-zinc-600 mx-auto max-w-50">
            Os jogos aparecem aqui assim que a fase de grupos terminar.
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
