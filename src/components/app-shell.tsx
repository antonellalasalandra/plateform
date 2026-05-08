import Image from "next/image";
import Link from "next/link";
import { LogOut, PanelLeft } from "lucide-react";
import { MobileMenu } from "@/components/mobile-menu";
import { SidebarNav } from "@/components/sidebar-nav";
import { appUser } from "@/lib/demo-data";

export function AppShell({ children }: { children: React.ReactNode }) {
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

        <SidebarNav />
      </aside>

      <header className="fixed left-0 right-0 top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-white px-5 lg:left-[280px] lg:px-8">
        <div className="flex items-center gap-4">
          <MobileMenu />
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
