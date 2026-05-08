"use client";

import { ChefHat, Plus, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { menuItems as initialMenuItems } from "@/lib/demo-data";
import { formatEuro } from "@/lib/utils";

type MenuItem = (typeof initialMenuItems)[number];
const categories = ["Pizze classiche", "Pizze speciali", "Bevande"];

export function MenuWorkspace() {
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems);
  const [category, setCategory] = useState("Pizze classiche");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredItems = items.filter(
    (item) => item.category === category && item.name.toLowerCase().includes(query.toLowerCase())
  );
  const averagePrice = items.length ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0;

  function saveItem(formData: FormData, originalName?: string) {
    const item: MenuItem = {
      name: String(formData.get("name") || "Nuovo piatto"),
      category: String(formData.get("category") || category),
      price: Number(formData.get("price") || 0),
      status: String(formData.get("status") || "Attiva")
    };

    setItems((current) =>
      originalName ? current.map((currentItem) => (currentItem.name === originalName ? item : currentItem)) : [...current, item]
    );
    setCategory(item.category);
    setEditing(null);
    setCreating(false);
    setNotice(originalName ? `${item.name} aggiornato.` : `${item.name} aggiunto al menù.`);
  }

  const actions = (
    <Button onClick={() => setCreating(true)}>
      <Plus className="size-5" />
      Nuovo piatto
    </Button>
  );

  return (
    <>
      <PageHeader title="Menù" description="Gestisci piatti, categorie e prezzi del locale." actions={actions} />
      {notice ? <Notice message={notice} onClose={() => setNotice("")} /> : null}

      <section className="mb-7 grid gap-5 md:grid-cols-3">
        <MetricCard icon={<ChefHat className="size-6" />} label="Piatti attivi" value={String(items.length)} />
        <MetricCard icon={<span className="text-xl font-black">#</span>} label="Categorie" value={String(categories.length)} />
        <MetricCard icon={<span className="text-xl font-black">€</span>} label="Prezzo medio" value={formatEuro(averagePrice)} />
      </section>

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          value={category}
          onChange={setCategory}
          options={categories.map((item) => ({ label: item, value: item }))}
        />
        <label className="relative block w-full max-w-[420px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Cerca nel menù..." />
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
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
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
                    <Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}>
                      Modifica
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-sm font-bold text-muted">
                  Nessun piatto in questa categoria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {creating ? (
        <MenuItemModal
          title="Nuovo piatto"
          item={{ name: "", category, price: 10, status: "Attiva" }}
          onClose={() => setCreating(false)}
          onSave={(formData) => saveItem(formData)}
        />
      ) : null}

      {editing ? (
        <MenuItemModal
          title={`Modifica ${editing.name}`}
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(formData) => saveItem(formData, editing.name)}
        />
      ) : null}
    </>
  );
}

function MenuItemModal({
  title,
  item,
  onClose,
  onSave
}: {
  title: string;
  item: MenuItem;
  onClose: () => void;
  onSave: (formData: FormData) => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(new FormData(event.currentTarget));
        }}
        className="grid gap-4 md:grid-cols-2"
      >
        <Input name="name" defaultValue={item.name} placeholder="Nome piatto" required />
        <Select name="category" defaultValue={item.category}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </Select>
        <Input name="price" type="number" step="0.01" defaultValue={item.price} />
        <Select name="status" defaultValue={item.status}>
          <option>Attiva</option>
          <option>Non disponibile</option>
        </Select>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit">Salva</Button>
        </div>
      </form>
    </Modal>
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
