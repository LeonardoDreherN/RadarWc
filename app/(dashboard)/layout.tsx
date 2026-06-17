import Image from "next/image";
import { BottomNav } from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="field-bg min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60 px-4 py-2.5 flex items-center justify-between">
        <div className="h-14">
          <Image src="/icons/icon-512.png" alt="RadarWC" width={200} height={56} className="h-14 w-auto object-contain" />
        </div>
        <span className="text-[10px] text-zinc-600 font-medium px-2 py-1 rounded-full border border-zinc-800">
          FIFA World Cup 2026
        </span>
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        <PageTransition>{children}</PageTransition>
      </main>

      <BottomNav />
    </div>
  );
}
