"use client";

import { Clock, Save, Table2 } from "lucide-react";
import { useState } from "react";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { restaurant, roomTables } from "@/lib/demo-data";

export function ImpostazioniWorkspace() {
  const [notice, setNotice] = useState("");

  function saveSettings(formData: FormData) {
    const name = String(formData.get("name") || restaurant.name);
    setNotice(`Impostazioni salvate per ${name}.`);
  }

  return (
    <>
      <PageHeader title="Impostazioni" description="Configura informazioni, orari e parametri del locale." />
      {notice ? <Notice message={notice} onClose={() => setNotice("")} /> : null}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Informazioni locale</CardTitle>
            <CardDescription>Dati di contatto, capienza e link social.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveSettings(new FormData(event.currentTarget));
              }}
              className="grid gap-5 lg:grid-cols-2"
            >
              <label className="space-y-2">
                <span className="text-sm font-bold">Nome locale</span>
                <Input name="name" defaultValue={restaurant.name} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Telefono</span>
                <Input name="phone" defaultValue={restaurant.phone} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Email</span>
                <Input name="email" defaultValue={restaurant.email} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">P.IVA</span>
                <Input name="vat" placeholder="IT00000000000" />
              </label>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm font-bold">Indirizzo</span>
                <Input name="address" defaultValue={restaurant.address} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Coperti max / slot</span>
                <Input name="capacity" type="number" defaultValue={restaurant.capacity} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Durata media tavolo (min)</span>
                <Input name="duration" type="number" defaultValue={90} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Anticipo min (ore)</span>
                <Input name="minAdvance" type="number" defaultValue={2} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Anticipo max (giorni)</span>
                <Input name="maxAdvance" type="number" defaultValue={60} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Instagram URL</span>
                <Input name="instagram" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Facebook URL</span>
                <Input name="facebook" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">TripAdvisor URL</span>
                <Input name="tripadvisor" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Google Maps URL</span>
                <Input name="maps" />
              </label>
              <div className="lg:col-span-2">
                <Button type="submit">
                  <Save className="size-5" />
                  Salva modifiche
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Turni di servizio
              </CardTitle>
              <CardDescription>Parametri usati dall'availability engine.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ["Pranzo", "12:00", "15:00", "90 min", "30 min"],
                  ["Cena", "19:00", "23:30", "105 min", "30 min"]
                ].map(([name, start, end, duration, interval]) => (
                  <div key={name} className="grid grid-cols-5 gap-3 rounded-[6px] border border-line px-4 py-3 text-sm font-bold">
                    <span>{name}</span>
                    <span className="text-muted">{start}</span>
                    <span className="text-muted">{end}</span>
                    <span className="text-muted">{duration}</span>
                    <span className="text-muted">{interval}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="size-5" />
                Sala e tavoli
              </CardTitle>
              <CardDescription>Tavoli fisici e capienze usate nelle assegnazioni.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {roomTables.map((table) => (
                  <div key={table.id} className="flex items-center justify-between rounded-[6px] border border-line px-4 py-3">
                    <span className="font-extrabold">{table.name}</span>
                    <span className="text-sm font-bold text-muted">{table.seats} coperti</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
