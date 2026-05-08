"use client";

import Image from "next/image";
import { ArrowRight, CalendarDays, CheckCircle2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const slots = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

export function BookingWidget({ tenant }: { tenant: string }) {
  const [selectedSlot, setSelectedSlot] = useState("20:00");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <main className="min-h-screen bg-panel px-5 py-8">
      <div className="mx-auto max-w-[980px]">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-[8px] bg-ink">
              <Image src="/plateform-logo.png" alt="Plateform" width={34} height={34} className="rounded-[4px]" />
            </div>
            <div>
              <p className="text-xl font-extrabold">Plateform</p>
              <p className="text-sm font-bold text-muted">Prenotazione online · {tenant}</p>
            </div>
          </div>
          <span className="rounded-[999px] border border-line bg-white px-3 py-1 text-xs font-bold text-muted">Disponibilità live</span>
        </header>

        {confirmed ? (
          <Card className="mb-5 border-emerald-200 bg-emerald-50">
            <CardContent className="flex items-center gap-3 p-5 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="size-5" />
              Prenotazione demo confermata per le {selectedSlot}. Nel prodotto reale questa azione passa dall'API anti-overbooking.
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-ink text-white">
            <CardHeader>
              <CardTitle className="text-white">Prenota il tuo tavolo</CardTitle>
              <CardDescription className="text-slate-300">Il sito legge gli slot dal backend centrale, senza disponibilità duplicate.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "flex items-center justify-between rounded-[6px] px-4 py-3 text-left font-extrabold transition",
                      selectedSlot === slot ? "bg-white text-ink" : "bg-white/10 text-white hover:bg-white/15"
                    )}
                  >
                    <span>{slot}</span>
                    <span className={cn("text-sm font-bold", selectedSlot === slot ? "text-slate-700" : "text-slate-300")}>tavoli disponibili</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dati prenotazione</CardTitle>
              <CardDescription>Conferma finale con controllo anti-overbooking lato backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setConfirmed(true);
                }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Users className="size-4" />
                    Persone
                  </span>
                  <Select defaultValue="4">
                    {[2, 3, 4, 5, 6, 8].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <CalendarDays className="size-4" />
                    Data
                  </span>
                  <Input type="date" defaultValue="2026-05-07" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Nome</span>
                  <Input placeholder="Nome e cognome" required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Telefono</span>
                  <Input placeholder="+39" required />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-bold">Email opzionale</span>
                  <Input type="email" placeholder="email@example.it" />
                </label>
                <label className="flex items-start gap-3 rounded-[6px] border border-line p-3 text-sm font-semibold text-muted sm:col-span-2">
                  <input type="checkbox" className="mt-1" required />
                  Accetto il trattamento dei dati per la gestione della prenotazione.
                </label>
                <Button type="submit" className="sm:col-span-2">
                  Conferma prenotazione alle {selectedSlot}
                  <ArrowRight className="size-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
