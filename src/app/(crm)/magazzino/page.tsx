import { ArrowUpDown, Package, Plus, Search, Truck, TriangleAlert } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segment, Segmented } from "@/components/ui/tabs";
import { ingredients } from "@/lib/demo-data";
import { formatEuro } from "@/lib/utils";

export default function MagazzinoPage() {
  const stockValue = ingredients.reduce((total, item) => total + item.stock * item.cost, 0);
  const underStock = ingredients.filter((item) => item.stock < item.min).length;

  return (
    <>
      <PageHeader title="Magazzino" description="Gestisci ingredienti, fornitori e movimenti di stock" />

      <section className="mb-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Package className="size-6" />} label="Ingredienti attivi" value={String(ingredients.length)} />
        <MetricCard icon={<Truck className="size-6" />} label="Fornitori" value="3" />
        <MetricCard icon={<TriangleAlert className="size-6" />} label="Sotto scorta" value={String(underStock)} />
        <MetricCard icon={<span className="text-lg font-black">€</span>} label="Valore magazzino" value={formatEuro(stockValue)} />
      </section>

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-4">
          <Segmented>
            <Segment active>
              <Package className="mr-2 inline size-4" />
              Ingredienti
            </Segment>
            <Segment>
              <Truck className="mr-2 inline size-4" />
              Fornitori
            </Segment>
            <Segment>
              <ArrowUpDown className="mr-2 inline size-4" />
              Movimenti
            </Segment>
          </Segmented>
          <label className="relative block w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <Input className="pl-10" placeholder="Cerca ingrediente..." />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <ArrowUpDown className="size-5" />
            Movimento
          </Button>
          <Button>
            <Plus className="size-5" />
            Ingrediente
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-sm font-extrabold text-muted">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">Categoria</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Min</th>
              <th className="px-5 py-4">Costo</th>
              <th className="px-5 py-4">Fornitore</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient.name} className="border-b border-slate-100 text-sm font-semibold last:border-0">
                <td className="px-5 py-4 font-extrabold">{ingredient.name}</td>
                <td className="px-5 py-4 text-muted">{ingredient.category}</td>
                <td className="px-5 py-4">{ingredient.stock}</td>
                <td className="px-5 py-4">{ingredient.min}</td>
                <td className="px-5 py-4">{formatEuro(ingredient.cost)}</td>
                <td className="px-5 py-4 text-muted">{ingredient.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
