import Image from "next/image";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

export default async function BookingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

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

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-ink text-white">
            <CardHeader>
              <CardTitle className="text-white">Prenota il tuo tavolo</CardTitle>
              <CardDescription className="text-slate-300">Il sito legge gli slot dal backend centrale, senza disponibilità duplicate.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"].map((slot) => (
                  <button key={slot} className="flex items-center justify-between rounded-[6px] bg-white/10 px-4 py-3 text-left font-extrabold hover:bg-white/15">
                    <span>{slot}</span>
                    <span className="text-sm font-bold text-slate-300">tavoli disponibili</span>
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
              <form className="grid gap-4 sm:grid-cols-2">
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
                  <Input placeholder="Nome e cognome" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Telefono</span>
                  <Input placeholder="+39" />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-bold">Email opzionale</span>
                  <Input type="email" placeholder="email@example.it" />
                </label>
                <label className="flex items-start gap-3 rounded-[6px] border border-line p-3 text-sm font-semibold text-muted sm:col-span-2">
                  <input type="checkbox" className="mt-1" defaultChecked />
                  Accetto il trattamento dei dati per la gestione della prenotazione.
                </label>
                <Button type="button" className="sm:col-span-2">
                  Conferma prenotazione
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
