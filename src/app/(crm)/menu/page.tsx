import { ChefHat, Plus, Search } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segment, Segmented } from "@/components/ui/tabs";
import { menuItems } from "@/lib/demo-data";
import { formatEuro } from "@/lib/utils";

export default function MenuPage() {
  return (
    <>
      <PageHeader
        title="Menù"
        description="Gestisci piatti, categorie e prezzi del locale."
        actions={
          <Button>
            <Plus className="size-5" />
            Nuovo piatto
          </Button>
        }
      />

      <section className="mb-7 grid gap-5 md:grid-cols-3">
        <MetricCard icon={<ChefHat className="size-6" />} label="Piatti attivi" value={String(menuItems.length)} />
        <MetricCard icon={<span className="text-xl font-black">#</span>} label="Categorie" value="2" />
        <MetricCard icon={<span className="text-xl font-black">€</span>} label="Prezzo medio" value={formatEuro(10.33)} />
      </section>

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented>
          <Segment active>Pizze classiche</Segment>
          <Segment>Pizze speciali</Segment>
          <Segment>Bevande</Segment>
        </Segmented>
        <label className="relative block w-full max-w-[420px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <Input className="pl-10" placeholder="Cerca nel menù..." />
        </label>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-sm font-extrabold text-muted">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">Categoria</th>
              <th className="px-5 py-4">Prezzo</th>
              <th className="px-5 py-4">Stato</th>
              <th className="px-5 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item.name} className="border-b border-slate-100 text-sm font-semibold last:border-0">
                <td className="px-5 py-4 font-extrabold">{item.name}</td>
                <td className="px-5 py-4 text-muted">{item.category}</td>
                <td className="px-5 py-4">{formatEuro(item.price)}</td>
                <td className="px-5 py-4">
                  <span className="rounded-[999px] border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Button variant="outline" className="h-9 px-3">
                    Modifica
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
