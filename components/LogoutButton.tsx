"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase().auth.signOut();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
      title="Sair"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
