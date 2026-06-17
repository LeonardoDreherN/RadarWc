import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ROTA TEMPORÁRIA DE DESENVOLVIMENTO — remover antes do deploy
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "Passe ?email=seu@email.com na URL" },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("profiles")
    .update({ has_access: true })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Acesso liberado para ${email}` });
}
