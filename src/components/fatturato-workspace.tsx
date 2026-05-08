"use client";

import { Banknote, Receipt, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { DonutChart, TrendChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SegmentedControl } from "@/components/segmented-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentMix, revenueTrend } from "@/lib/demo-data";
import { formatEuro } from "@/lib/utils";

type Range = "today" | "7" | "30" | "90";
type Tab = "riepilogo" | "scontrini" | "conti";

export function FatturatoWorkspace() {
  const [range, setRange] = useState<Range>("30");
  const [tab, setTab] = useState<Tab>("riepilogo");
  const [notice, setNotice] = useState("");

  const multiplier = range === "today" ? 0.08 : range === "7" ? 0.35 : range === "30" ? 1 : 2.6;
  const revenue = Math.round(15230 * multiplier);
  const receipts = Math.round(428 * multiplier);

  return (
    <>
      <PageHeader
        title="Fatturato"
        description="Scontrini, conti tavolo e analisi degli incassi."
        actions={
          <SegmentedControl
            value={range}
            onChange={(value) => {
              setRange(value);
              setNotice(`Periodo aggiornato: ${value === "today" ? "oggi" : `${value} giorni`}.`);
            }}
            options={[
              { label: "Oggi", value: "today" },
              { label: "7g", value: "7" },
              { label: "30g", value: "30" },
              { label: "90g", value: "90" }
            ]}
          />
        }
      />
      {notice ? <Notice message={notice} onClose={() => setNotice("")} /> : null}

      <div className="mb-6">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { label: "Riepilogo", value: "riepilogo" },
            { label: "Scontrini", value: "scontrini" },
            { label: "Conti tavolo", value: "conti" }
          ]}
        />
      </div>

      <section className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Banknote className="size-6" />} label="Incasso periodo" value={formatEuro(revenue)} />
        <MetricCard icon={<TrendingUp className="size-6" />} label="Incasso oggi" value={formatEuro(1280)} />
        <MetricCard icon={<Receipt className="size-6" />} label="Scontrini + Conti" value={String(receipts)} />
        <MetricCard icon={<Sparkles className="size-6" />} label="Scontrino medio" value={formatEuro(receipts ? revenue / receipts : 0)} />
      </section>

      {tab === "riepilogo" ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Andamento incassi</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={revenueTrend} currency />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Per metodo di pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={paymentMix} />
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-sm font-extrabold text-muted">
                  <th className="px-5 py-4">Ora</th>
                  <th className="px-5 py-4">Tavolo</th>
                  <th className="px-5 py-4">Metodo</th>
                  <th className="px-5 py-4 text-right">Totale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["12:48", "T4", "Carta", 42],
                  ["13:10", "T2", "Contanti", 28],
                  ["20:35", "T7", "Carta", 86]
                ].map((row) => (
                  <tr key={row.join("-")} className="border-b border-slate-100 text-sm font-semibold last:border-0">
                    <td className="px-5 py-4 font-extrabold">{row[0]}</td>
                    <td className="px-5 py-4 text-muted">{row[1]}</td>
                    <td className="px-5 py-4 text-muted">{row[2]}</td>
                    <td className="px-5 py-4 text-right font-extrabold">{formatEuro(Number(row[3]))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
