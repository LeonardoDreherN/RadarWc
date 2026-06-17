"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MatchCard } from "@/components/MatchCard";
import { SkeletonList } from "@/components/SkeletonCard";
import { NotifyButton } from "@/components/NotifyButton";
import type { Fixture } from "@/lib/football-api";
import { Radio, RefreshCw, ArrowDown } from "lucide-react";

const PTR_THRESHOLD = 70;

export default function AoVivoPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // pull-to-refresh state
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLive = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await fetch("/api/fixtures", { cache: "no-store" });
      const data = await res.json();
      setFixtures(data.live ?? []);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive(true);
    const interval = setInterval(() => fetchLive(false), 60_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // Pull-to-refresh touch handlers
  function onTouchStart(e: React.TouchEvent) {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = -1;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartY.current < 0 || loading) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullY(Math.min(delta, PTR_THRESHOLD + 20));
      setPulling(delta >= PTR_THRESHOLD);
    }
  }

  function onTouchEnd() {
    if (pulling) {
      fetchLive(false);
    }
    setPullY(0);
    setPulling(false);
    touchStartY.current = -1;
  }

  const pullProgress = Math.min(pullY / PTR_THRESHOLD, 1);
  const showPullIndicator = pullY > 10;

  return (
    <div
      ref={containerRef}
      className="space-y-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "pan-x pan-y" }}
    >
      {/* Pull indicator */}
      {showPullIndicator && (
        <div
          className="flex items-center justify-center gap-2 transition-all"
          style={{ height: pullY * 0.6, opacity: pullProgress }}
        >
          {pulling ? (
            <>
              <RefreshCw className="w-4 h-4 text-green-400 ptr-spin" />
              <span className="text-xs text-green-400 font-medium">Solte para atualizar</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4 text-zinc-500" style={{ transform: `rotate(${pullProgress * 180}deg)` }} />
              <span className="text-xs text-zinc-500">Puxe para atualizar</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
          <h1 className="font-bold text-white">Ao Vivo</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotifyButton />
          <button
            onClick={() => fetchLive(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {lastUpdate && (
        <p className="text-xs text-zinc-600">
          Atualizado às {lastUpdate.toLocaleTimeString("pt-BR")} · auto-refresh 60s
        </p>
      )}

      {loading && fixtures.length === 0 ? (
        <SkeletonList count={2} />
      ) : fixtures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Radio className="w-8 h-8 text-zinc-700" />
          <p className="text-zinc-400 font-semibold">Nenhum jogo ao vivo agora</p>
          <p className="text-zinc-600 text-sm">Puxe para baixo ou aguarde — a página atualiza a cada 60s.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fixtures.map((f, i) => (
            <MatchCard key={f.fixture.id} fixture={f} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
