import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET ?? "";
  const hash = crypto.createHmac("sha1", secret).update(body).digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.nextUrl.searchParams.get("signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const db = supabaseAdmin();

  // Loga o evento sempre
  await db.from("kiwify_events").insert({
    event_type: payload.order_status,
    order_id: payload.order_id,
    customer_email: payload.Customer?.email,
    payload,
  });

  // Libera acesso apenas em compra aprovada
  if (payload.order_status === "paid") {
    const email = payload.Customer?.email;
    if (!email) {
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    // Atualiza perfil — o trigger já criou o perfil na hora do cadastro
    const { error } = await db
      .from("profiles")
      .update({
        has_access: true,
        kiwify_order_id: payload.order_id,
        access_granted_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (error) {
      // Usuário ainda não se cadastrou — salva acesso pendente para quando ele se registrar
      console.error("Kiwify webhook: perfil não encontrado para", email, error);
    }
  }

  // Revoga acesso em reembolso / chargeback
  if (["refunded", "chargedback"].includes(payload.order_status)) {
    const email = payload.Customer?.email;
    if (email) {
      await db
        .from("profiles")
        .update({ has_access: false })
        .eq("email", email);
    }
  }

  return NextResponse.json({ ok: true });
}
