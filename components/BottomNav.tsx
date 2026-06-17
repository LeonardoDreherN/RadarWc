"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Radio, Trophy, GitBranch } from "lucide-react";

const ITEMS = [
  { href: "/dashboard",    icon: Home,        label: "Jogos"    },
  { href: "/grupos",       icon: LayoutGrid,  label: "Grupos"   },
  { href: "/artilharia",   icon: Trophy,      label: "Artilh."  },
  { href: "/chaveamento",  icon: GitBranch,   label: "Chavea."  },
  { href: "/ao-vivo",      icon: Radio,       label: "Ao Vivo"  },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800/60 flex">
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const active = path === href || (href !== "/dashboard" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:scale-95 ${
              active ? "text-green-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400" />
              )}
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-green-400" : ""}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
