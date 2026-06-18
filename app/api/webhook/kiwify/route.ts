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
    console.error("Kiwify webhook: assinatura inválida");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const db = supabaseAdmin();

  await db.from("kiwify_events").insert({
    event_type: payload.order_status,
    order_id: payload.order_id,
    customer_email: payload.Customer?.email,
    payload,
  });

  // Libera acesso em compra aprovada
  if (payload.order_status === "paid") {
    const email = payload.Customer?.email;
    if (!email) {
      console.error("Kiwify webhook: email não encontrado no payload", payload);
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    const { data, error } = await db
      .from("profiles")
      .update({
        has_access: true,
        kiwify_order_id: payload.order_id,
        access_granted_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select("id, email, has_access");

    if (error) {
      console.error("Kiwify webhook: erro ao atualizar perfil", { email, error });
    } else if (!data || data.length === 0) {
      console.error("Kiwify webhook: nenhum perfil encontrado para", email, "— acesso pendente");
    } else {
      console.log("Kiwify webhook: acesso liberado para", email, data);
    }
  }

  // Revoga acesso em reembolso / chargeback
  if (["refunded", "chargedback"].includes(payload.order_status)) {
    const email = payload.Customer?.email;
    if (email) {
      const { error } = await db
        .from("profiles")
        .update({ has_access: false })
        .eq("email", email);

      if (error) {
        console.error("Kiwify webhook: erro ao revogar acesso", { email, error });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
