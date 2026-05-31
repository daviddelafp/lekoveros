"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CatalogCard {
  id: string;
  name: string;
  setName: string;
  rarity: string | null;
  price: unknown;
  active: boolean;
  imageUrl: string | null;
  externalId: string;
}

export default function AdminCatalog({ cards }: { cards: CatalogCard[] }) {
  const router = useRouter();
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState("");

  async function updatePrice(id: string) {
    await fetch(`/api/admin/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: parseFloat(priceValue) }),
    });
    setEditingPrice(null);
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <div>
      {cards.length === 0 && (
        <p className="text-gray-400 text-sm">No hay cartas en el catálogo.</p>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Carta</th>
              <th className="text-left px-4 py-3 font-medium">Set</th>
              <th className="text-left px-4 py-3 font-medium">Rareza</th>
              <th className="text-left px-4 py-3 font-medium">Precio</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {card.imageUrl && (
                      <div className="relative w-8 h-11 flex-shrink-0">
                        <Image src={card.imageUrl} alt={card.name} fill className="object-contain" sizes="32px" />
                      </div>
                    )}
                    <span className="font-medium">{card.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{card.setName}</td>
                <td className="px-4 py-3 text-gray-500">{card.rarity ?? "—"}</td>
                <td className="px-4 py-3">
                  {editingPrice === card.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        className="w-20 border rounded px-2 py-0.5 text-sm"
                        autoFocus
                      />
                      <button onClick={() => updatePrice(card.id)} className="text-green-600 text-xs">✓</button>
                      <button onClick={() => setEditingPrice(null)} className="text-gray-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPrice(card.id);
                        setPriceValue(card.price ? String(card.price) : "");
                      }}
                      className="text-gray-700 hover:text-red-600 transition"
                    >
                      {card.price ? `${Number(card.price).toFixed(2)} €` : "Sin precio"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${card.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {card.active ? "Visible" : "Oculta"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleActive(card.id, card.active)}
                    className="text-xs text-gray-500 hover:text-red-600 transition"
                  >
                    {card.active ? "Ocultar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
