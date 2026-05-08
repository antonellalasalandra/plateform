"use client";

import { ArrowUpDown, Package, Plus, Search, Truck, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { ingredients as initialIngredients } from "@/lib/demo-data";
import { formatEuro } from "@/lib/utils";

type Ingredient = (typeof initialIngredients)[number];
type Movement = {
  id: string;
  ingredient: string;
  type: "Carico" | "Scarico" | "Rettifica";
  quantity: number;
  reason: string;
};

const suppliers = ["Molino Nord", "Campania Food", "Caseificio Verde"];

export function MagazzinoWorkspace() {
  const [tab, setTab] = useState<"ingredienti" | "fornitori" | "movimenti">("ingredienti");
  const [query, setQuery] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [modal, setModal] = useState<"ingredient" | "movement" | null>(null);
  const [notice, setNotice] = useState("");

  const stockValue = ingredients.reduce((total, item) => total + item.stock * item.cost, 0);
  const underStock = ingredients.filter((item) => item.stock < item.min).length;
  const filteredIngredients = ingredients.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  const supplierRows = useMemo(
    () =>
      suppliers.map((supplier) => ({
        name: supplier,
        ingredients: ingredients.filter((item) => item.supplier === supplier).length
      })),
    [ingredients]
  );

  function addIngredient(formData: FormData) {
    const ingredient: Ingredient = {
      name: String(formData.get("name") || "Nuovo ingrediente"),
      category: String(formData.get("category") || "Generale"),
      stock: Number(formData.get("stock") || 0),
      min: Number(formData.get("min") || 0),
      cost: Number(formData.get("cost") || 0),
      supplier: String(formData.get("supplier") || suppliers[0])
    };
    setIngredients((current) => [...current, ingredient]);
    setModal(null);
    setNotice(`${ingredient.name} aggiunto al magazzino.`);
  }

  function addMovement(formData: FormData) {
    const ingredientName = String(formData.get("ingredient"));
    const type = String(formData.get("type")) as Movement["type"];
    const quantity = Number(formData.get("quantity") || 0);
    const movement = {
      id: crypto.randomUUID(),
      ingredient: ingredientName,
      type,
      quantity,
      reason: String(formData.get("reason") || "Movimento manuale")
    };

    setMovements((current) => [movement, ...current]);
    setIngredients((current) =>
      current.map((item) => {
        if (item.name !== ingredientName) return item;
        if (type === "Carico") return { ...item, stock: item.stock + quantity };
        if (type === "Scarico") return { ...item, stock: Math.max(0, item.stock - quantity) };
        return { ...item, stock: quantity };
      })
    );
    setModal(null);
    setNotice(`Movimento registrato per ${ingredientName}.`);
  }

  return (
    <>
      <PageHeader title="Magazzino" description="Gestisci ingredienti, fornitori e movimenti di stock" />
      {notice ? <Notice message={notice} onClose={() => setNotice("")} /> : null}

      <section className="mb-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Package className="size-6" />} label="Ingredienti attivi" value={String(ingredients.length)} />
        <MetricCard icon={<Truck className="size-6" />} label="Fornitori" value={String(suppliers.length)} />
        <MetricCard icon={<TriangleAlert className="size-6" />} label="Sotto scorta" value={String(underStock)} />
        <MetricCard icon={<span className="text-lg font-black">€</span>} label="Valore magazzino" value={formatEuro(stockValue)} />
      </section>

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-4">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { label: "Ingredienti", value: "ingredienti" },
              { label: "Fornitori", value: "fornitori" },
              { label: "Movimenti", value: "movimenti" }
            ]}
          />
          <label className="relative block w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Cerca ingrediente..." />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setModal("movement")}>
            <ArrowUpDown className="size-5" />
            Movimento
          </Button>
          <Button onClick={() => setModal("ingredient")}>
            <Plus className="size-5" />
            Ingrediente
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {tab === "ingredienti" ? (
          <DataTable
            headers={["Nome", "Categoria", "Stock", "Min", "Costo", "Fornitore"]}
            rows={filteredIngredients.map((ingredient) => [
              ingredient.name,
              ingredient.category,
              String(ingredient.stock),
              String(ingredient.min),
              formatEuro(ingredient.cost),
              ingredient.supplier
            ])}
            empty="Nessun ingrediente trovato."
          />
        ) : null}
        {tab === "fornitori" ? (
          <DataTable
            headers={["Nome", "Ingredienti", "Stato"]}
            rows={supplierRows.map((supplier) => [supplier.name, String(supplier.ingredients), "Attivo"])}
            empty="Nessun fornitore trovato."
          />
        ) : null}
        {tab === "movimenti" ? (
          <DataTable
            headers={["Ingrediente", "Tipo", "Quantità", "Motivo"]}
            rows={movements.map((movement) => [movement.ingredient, movement.type, String(movement.quantity), movement.reason])}
            empty="Nessun movimento registrato. Usa il pulsante Movimento."
          />
        ) : null}
      </Card>

      {modal === "ingredient" ? (
        <Modal title="Nuovo ingrediente" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addIngredient(new FormData(event.currentTarget));
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Input name="name" placeholder="Nome ingrediente" required />
            <Input name="category" placeholder="Categoria" defaultValue="Linea pizza" />
            <Input name="stock" type="number" placeholder="Stock" defaultValue={10} />
            <Input name="min" type="number" placeholder="Minimo" defaultValue={5} />
            <Input name="cost" type="number" step="0.01" placeholder="Costo" defaultValue={1} />
            <Select name="supplier" defaultValue={suppliers[0]}>
              {suppliers.map((supplier) => (
                <option key={supplier}>{supplier}</option>
              ))}
            </Select>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                Annulla
              </Button>
              <Button type="submit">Aggiungi</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal === "movement" ? (
        <Modal title="Nuovo movimento" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addMovement(new FormData(event.currentTarget));
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Select name="ingredient" defaultValue={ingredients[0]?.name}>
              {ingredients.map((ingredient) => (
                <option key={ingredient.name}>{ingredient.name}</option>
              ))}
            </Select>
            <Select name="type" defaultValue="Carico">
              <option>Carico</option>
              <option>Scarico</option>
              <option>Rettifica</option>
            </Select>
            <Input name="quantity" type="number" step="0.01" defaultValue={1} />
            <Input name="reason" placeholder="Motivo" defaultValue="Movimento manuale" />
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                Annulla
              </Button>
              <Button type="submit">Registra</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function DataTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  return (
    <table className="w-full min-w-[760px] border-collapse text-left">
      <thead>
        <tr className="border-b border-line text-sm font-extrabold text-muted">
          {headers.map((header) => (
            <th key={header} className="px-5 py-4">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`} className="border-b border-slate-100 text-sm font-semibold last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className={cellIndex === 0 ? "px-5 py-4 font-extrabold" : "px-5 py-4 text-muted"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td className="px-5 py-16 text-center text-sm font-bold text-muted" colSpan={headers.length}>
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-[560px] rounded-[8px] border border-line bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button type="button" className="grid size-10 place-items-center rounded-[6px] border border-line" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
