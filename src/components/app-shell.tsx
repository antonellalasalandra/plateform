"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  CalendarDays,
  ChefHat,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  PanelLeft,
  Settings,
  Users
} from "lucide-react";
import { appUser } from "@/lib/demo-data";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-panel text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-white/10 bg-black text-white lg:block">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5">
          <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#0d1429]">
            <Image src="/plateform-logo.png" alt="Plateform" width={28} height={28} className="rounded-[4px]" priority />
          </div>
          <div>
            <p className="text-lg font-extrabold leading-tight">Plateform</p>
            <p className="text-sm font-semibold text-slate-400">Gestionale</p>
          </div>
        </div>

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
      </aside>

      <header className="fixed left-0 right-0 top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-white px-5 lg:left-[280px] lg:px-8">
        <div className="flex items-center gap-4">
          <button className="grid size-10 place-items-center rounded-[6px] border border-line bg-white lg:hidden" aria-label="Apri menu">
            <MenuIcon className="size-5" />
          </button>
          <PanelLeft className="hidden size-5 text-ink lg:block" />
          <span className="text-base font-extrabold">Gestionale</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden text-sm font-semibold text-muted sm:inline">{appUser.email}</span>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-extrabold text-ink">
            <LogOut className="size-5" />
            Esci
          </Link>
        </div>
      </header>

      <main className="min-h-screen pt-[76px] lg:pl-[280px]">
        <div className="mx-auto w-full max-w-[1680px] px-5 py-10 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
