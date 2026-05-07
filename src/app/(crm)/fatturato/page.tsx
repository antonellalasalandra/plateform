import { Banknote, Receipt, Sparkles, TrendingUp } from "lucide-react";
import { DonutChart, TrendChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segment, Segmented } from "@/components/ui/tabs";
import { paymentMix, revenueTrend } from "@/lib/demo-data";
import { formatEuro } from "@/lib/utils";

export default function FatturatoPage() {
  return (
    <>
      <PageHeader
        title="Fatturato"
        description="Scontrini, conti tavolo e analisi degli incassi."
        actions={
          <Segmented>
            <Segment>Oggi</Segment>
            <Segment>7g</Segment>
            <Segment active>30g</Segment>
            <Segment>90g</Segment>
          </Segmented>
        }
      />

      <div className="mb-6">
        <Segmented>
          <Segment active>Riepilogo</Segment>
          <Segment>Scontrini</Segment>
          <Segment>Conti tavolo</Segment>
        </Segmented>
      </div>

      <section className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Banknote className="size-6" />} label="Incasso periodo" value={formatEuro(15230)} />
        <MetricCard icon={<TrendingUp className="size-6" />} label="Incasso oggi" value={formatEuro(1280)} />
        <MetricCard icon={<Receipt className="size-6" />} label="Scontrini + Conti" value="428" />
        <MetricCard icon={<Sparkles className="size-6" />} label="Scontrino medio" value={formatEuro(35.58)} />
      </section>

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

      <Card className="mt-6">
        <CardContent className="flex min-h-[110px] items-center justify-center p-6 text-center text-sm font-bold text-muted">
          I dati fiscali sono previsti come modulo successivo: l'MVP mantiene il focus su prenotazioni, tavoli e disponibilità live.
        </CardContent>
      </Card>
    </>
  );
}
