"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, CalendarDays, ChefHat, LayoutDashboard, Package, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/panoramica", label: "Panoramica", icon: LayoutDashboard },
  { href: "/fatturato", label: "Fatturato", icon: Banknote },
  { href: "/prenotazioni", label: "Prenotazioni", icon: CalendarDays },
  { href: "/personale", label: "Personale", icon: Users },
  { href: "/magazzino", label: "Magazzino", icon: Package },
  { href: "/menu", label: "Menù", icon: ChefHat },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="px-3 py-6">
      <p className="mb-3 px-2 text-sm font-bold text-slate-400">Menu</p>
      <div className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-bold text-slate-100 transition hover:bg-white/10",
                active && "bg-white/15 text-white"
              )}
            >
              <Icon className="size-5" strokeWidth={2.2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
