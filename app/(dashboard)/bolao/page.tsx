import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";
import { BolaoPickCard } from "@/components/BolaoPickCard";
import { Trophy, Medal } from "lucide-react";
import type { Fixture } from "@/lib/football-api";

const FINISHED = ["FT", "AET", "PEN"];
const GROUP_ROUND = "Fase de Grupos";

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

  // Leaderboard: pontua 1 por placar exato em jogos encerrados
  const finishedKnockout = knockoutFixtures.filter((f) => FINISHED.includes(f.fixture.status.short));
  const scoreMap = new Map<string, number>();

  for (const fixture of finishedKnockout) {
    const realHome = fixture.goals.home;
    const realAway = fixture.goals.away;
    if (realHome === null || realAway === null) continue;
    for (const pick of allPicks) {
      if (pick.fixture_id !== fixture.fixture.id) continue;
      if (pick.home_goals === realHome && pick.away_goals === realAway) {
        scoreMap.set(pick.user_id, (scoreMap.get(pick.user_id) ?? 0) + 1);
      }
    }
  }

  // Busca emails dos usuários no ranking
  const rankedUserIds = Array.from(scoreMap.keys());
  let emailMap = new Map<string, string>();
  if (rankedUserIds.length > 0) {
    try {
      const { data: { users } } = await db.auth.admin.listUsers({ perPage: 500 });
      emailMap = new Map(users.map((u) => [u.id, u.email?.split("@")[0] ?? "Usuário"]));
    } catch {}
  }

  const leaderboard = Array.from(scoreMap.entries())
    .map(([uid, pts]) => ({ uid, pts, name: emailMap.get(uid) ?? "Usuário" }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 10);

  const myRank = leaderboard.findIndex((r) => r.uid === userId) + 1;
  const myScore = scoreMap.get(userId ?? "") ?? 0;

  // Agrupar jogos por fase
  const byRound = new Map<string, Fixture[]>();
  for (const f of knockoutFixtures) {
    const round = f.league.round || "Mata-mata";
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(f);
  }

  const roundOrder = ["Rodada de 32", "Oitavas de Final", "Quartas de Final", "Semifinal", "3º Lugar", "Final"];
  const sortedRounds = Array.from(byRound.keys()).sort(
    (a, b) => (roundOrder.indexOf(a) === -1 ? 99 : roundOrder.indexOf(a)) - (roundOrder.indexOf(b) === -1 ? 99 : roundOrder.indexOf(b))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h1 className="text-base font-black text-white">Bolão das Finais</h1>
        </div>
        <p className="text-xs text-zinc-400">Acerte o placar exato e ganhe <span className="text-yellow-400 font-bold">1 ponto</span> por jogo. O campeão leva o prêmio!</p>
        {userId && myScore > 0 && (
          <p className="text-xs text-zinc-500 pt-1">
            Você está em <span className="text-white font-bold">{myRank}º lugar</span> com <span className="text-yellow-400 font-bold">{myScore} ponto{myScore !== 1 ? "s" : ""}</span>
          </p>
        )}
      </div>

      {/* Ranking */}
      {leaderboard.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Medal className="w-3.5 h-3.5" /> Ranking
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.uid}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 last:border-0 ${entry.uid === userId ? "bg-zinc-800/60" : ""}`}
              >
                <span className={`text-sm font-black w-5 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-400" : "text-zinc-600"}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-zinc-300 truncate">{entry.name}</span>
                <span className="text-sm font-black text-white">{entry.pts} pt{entry.pts !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jogos por fase */}
      {knockoutFixtures.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-2">
          <Trophy className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-sm text-zinc-500">O mata-mata ainda não começou.</p>
          <p className="text-xs text-zinc-700">Os jogos aparecem aqui assim que a fase de grupos terminar.</p>
        </div>
      ) : (
        sortedRounds.map((round) => (
          <div key={round} className="space-y-2">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{round}</h2>
            {byRound.get(round)!.map((fixture) => {
              const isLocked = fixture.fixture.status.short !== "NS";
              const pick = myPicks.get(fixture.fixture.id) ?? null;
              return (
                <BolaoPickCard
                  key={fixture.fixture.id}
                  fixture={fixture}
                  existingPick={pick}
                  isLocked={isLocked}
                />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
