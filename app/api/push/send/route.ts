import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { title, body, url } = await req.json();
    const payload = JSON.stringify({ title, body, url: url ?? "/ao-vivo" });

    const db = supabaseAdmin();
    const { data: subs } = await db.from("push_subscriptions").select("subscription");
    if (!subs?.length) return NextResponse.json({ sent: 0 });

    const results = await Promise.allSettled(
      subs.map((row) =>
        webpush.sendNotification(row.subscription, payload)
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: subs.length });
  } catch (e) {
    console.error("push send error:", e);
    return NextResponse.json({ error: "Erro ao enviar" }, { status: 500 });
  }
}
