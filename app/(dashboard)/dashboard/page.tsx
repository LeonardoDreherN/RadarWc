import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { MatchCard } from "@/components/MatchCard";
import { DashboardTabs } from "@/components/DashboardTabs";
import type { Fixture } from "@/lib/football-api";
import { Radio, Calendar, Clock } from "lucide-react";

export const revalidate = 300;

interface Props {
  searchParams: Promise<{ f?: string }>;
}

async function getFixtures() {
  const db = supabaseAdmin();
  const { data } = await db.from("fixtures_cache").select("data").order("fixture_id");
  return (data ?? []).map((r) => r.data as Fixture);
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

export default async function DashboardPage({ searchParams }: Props) {
  const { f: filter = "hoje" } = await searchParams;
  const fixtures = await getFixtures();

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const live = fixtures.filter((f) =>
    ["1H", "HT", "2H", "ET", "P"].includes(f.fixture.status.short)
  );

  const filterUpcoming = (list: Fixture[]) => {
    const upcoming = list.filter((f) =>
      f.fixture.status.short === "NS" && new Date(f.fixture.date) > now
    ).sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

    if (filter === "hoje") return upcoming.filter((f) => isSameDay(new Date(f.fixture.date), now));
    if (filter === "amanha") return upcoming.filter((f) => isSameDay(new Date(f.fixture.date), tomorrow));
    if (filter === "semana") return upcoming.filter((f) => new Date(f.fixture.date) <= weekEnd);
    return upcoming.slice(0, 30);
  };

  const upcoming = filterUpcoming(fixtures);
  const finished = fixtures
    .filter((f) => ["FT", "AET", "PEN"].includes(f.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, 10);

  if (fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-3xl">⚽</div>
        <p className="text-zinc-300 font-bold">Jogos carregando...</p>
        <p className="text-zinc-600 text-sm max-w-xs">Os jogos aparecem aqui assim que o cron job rodar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tabs de filtro */}
      <Suspense fallback={null}>
        <DashboardTabs />
      </Suspense>

      {live.length > 0 && (
        <Section title="Ao Vivo" count={live.length} accent="text-green-400" icon={<Radio className="w-3.5 h-3.5 animate-pulse" />} live>
          {live.map((f, i) => <MatchCard key={f.fixture.id} fixture={f} index={i} />)}
        </Section>
      )}

      {upcoming.length > 0 ? (
        <Section title="Próximos Jogos" count={upcoming.length} accent="text-zinc-300" icon={<Calendar className="w-3.5 h-3.5" />}>
          {upcoming.map((f, i) => <MatchCard key={f.fixture.id} fixture={f} index={i} />)}
        </Section>
      ) : (
        <div className="text-center py-10 text-zinc-600 text-sm">
          Nenhum jogo encontrado para este período.
        </div>
      )}

      {finished.length > 0 && (
        <Section title="Resultados" count={finished.length} accent="text-zinc-500" icon={<Clock className="w-3.5 h-3.5" />}>
          {finished.map((f, i) => <MatchCard key={f.fixture.id} fixture={f} index={i} />)}
        </Section>
      )}
    </div>
  );
}

function Section({
  title, count, accent, icon, live, children,
}: {
  title: string;
  count: number;
  accent: string;
  icon: React.ReactNode;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${accent}`}>
          {icon}
          <h2 className="text-xs font-black uppercase tracking-widest">{title}</h2>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          live ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-zinc-800 text-zinc-500"
        }`}>
          {count}
        </span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
