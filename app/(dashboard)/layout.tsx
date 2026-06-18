import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="field-bg min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60 px-4 py-2 flex items-center justify-between">
        <div className="h-12">
          <Image src="/icons/icon-512.png" alt="RadarWC" width={180} height={48} className="h-12 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors">
            <Search className="w-4.5 h-4.5" />
          </button>
          <Link
            href="/ao-vivo"
            className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        <PageTransition>{children}</PageTransition>
      </main>

      <BottomNav />
    </div>
  );
}
