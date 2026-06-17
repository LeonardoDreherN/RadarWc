"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotifyButton() {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      if (sub) setStatus("subscribed");
    }).catch(() => {});
  }, []);

  async function subscribe() {
    if (!("serviceWorker" in navigator)) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      setStatus("subscribed");
    } catch (e) {
      console.error("subscribe error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }

  if (status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        disabled={loading}
        className="flex items-center gap-1.5 text-green-400 bg-green-500/15 border border-green-500/30 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-green-500/25 disabled:opacity-50"
      >
        <Bell className="w-3.5 h-3.5" />
        Notificações ativas
      </button>
    );
  }

  if (status === "denied") {
    return (
      <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
        <BellOff className="w-3.5 h-3.5" />
        Notificações bloqueadas
      </span>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="flex items-center gap-1.5 text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-zinc-700 disabled:opacity-50"
    >
      <Bell className="w-3.5 h-3.5" />
      {loading ? "Aguarde..." : "Ativar notificações"}
    </button>
  );
}
