import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { count } = await supabaseAdmin()
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("has_access", true);

  return NextResponse.json({ count: count ?? 0 });
}
