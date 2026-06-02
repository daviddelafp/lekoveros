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
        <p className="text-gray-600 text-sm font-medium">No hay cartas en el catálogo.</p>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Carta</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Set</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Rareza</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Precio ref.</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Visibilidad</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {card.imageUrl && (
                      <div className="relative w-8 h-11 flex-shrink-0">
                        <Image src={card.imageUrl} alt={card.name} fill className="object-contain" sizes="32px" />
                      </div>
                    )}
                    <span className="font-semibold text-gray-900">{card.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-700">{card.setName}</td>
                <td className="px-5 py-3.5 text-gray-700">{card.rarity ?? "—"}</td>
                <td className="px-5 py-3.5">
                  {editingPrice === card.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                        autoFocus
                      />
                      <button onClick={() => updatePrice(card.id)} className="text-green-700 font-bold text-sm px-1">✓</button>
                      <button onClick={() => setEditingPrice(null)} className="text-gray-500 text-sm px-1">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPrice(card.id);
                        setPriceValue(card.price ? String(card.price) : "");
                      }}
                      className="text-gray-800 hover:text-red-600 font-medium transition"
                    >
                      {card.price ? `¥${Number(card.price).toFixed(2)}` : (
                        <span className="text-gray-400 text-xs">Sin precio</span>
                      )}
                    </button>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    card.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {card.active ? "Visible" : "Oculta"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => toggleActive(card.id, card.active)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      card.active
                        ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
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
