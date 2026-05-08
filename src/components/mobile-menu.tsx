"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="grid size-10 place-items-center rounded-[6px] border border-line bg-white lg:hidden"
        aria-label="Apri menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Chiudi menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[300px] max-w-[86vw] border-r border-white/10 bg-black text-white shadow-2xl">
            <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#0d1429]">
                  <Image src="/plateform-logo.png" alt="Plateform" width={28} height={28} className="rounded-[4px]" priority />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-tight">Plateform</p>
                  <p className="text-sm font-semibold text-slate-400">Gestionale</p>
                </div>
              </div>
              <button className="grid size-10 place-items-center rounded-[6px] bg-white/10" aria-label="Chiudi menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>
              <SidebarNav />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
