"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WishlistItem {
  id: string;
  quantity: number;
  notes: string | null;
  userPrice: { toNumber(): number } | null;
  card: {
    name: string;
    setName: string;
    rarity: string | null;
    imageUrl: string | null;
  };
}

export default function WishlistView({ items }: { items: WishlistItem[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const item of items) {
      init[item.id] = item.userPrice ? item.userPrice.toNumber().toFixed(2) : "";
    }
    return init;
  });
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setRemoving(id);
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRemoving(null);
    router.refresh();
  }

  async function savePrice(id: string) {
    const val = parseFloat(prices[id]);
    if (isNaN(val) || val <= 0) return;
    setSavingPrice(id);
    await fetch("/api/wishlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userPrice: val }),
    });
    setSavingPrice(null);
  }

  async function submitOrder() {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/orders", { method: "POST" });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/mis-pedidos");
    router.refresh();
  }

  const allPriced = items.every((item) => {
    const val = parseFloat(prices[item.id]);
    return !isNaN(val) && val > 0;
  });

  const total = items.reduce((sum, item) => {
    const val = parseFloat(prices[item.id]);
    return sum + (isNaN(val) ? 0 : val * item.quantity);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
        <a href="/catalogo" className="text-red-600 font-medium hover:underline">
          Ir al catálogo →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Cart items */}
      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm border p-4 flex gap-4 items-center"
          >
            {item.card.imageUrl ? (
              <div className="relative w-16 h-22 flex-shrink-0">
                <Image
                  src={item.card.imageUrl}
                  alt={item.card.name}
                  width={64}
                  height={88}
                  className="object-contain rounded"
                />
              </div>
            ) : (
              <div className="w-16 h-22 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                ?
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.card.name}</p>
              <p className="text-sm text-gray-600">{item.card.setName}</p>
              {item.card.rarity && (
                <p className="text-xs text-gray-500">{item.card.rarity}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Cantidad: {item.quantity}</p>
            </div>

            {/* Price input */}
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className="text-xs font-medium text-gray-500 mb-0.5">Precio (¥)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={prices[item.id] ?? ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [item.id]: e.target.value }))}
                  onBlur={() => savePrice(item.id)}
                  className={`w-28 rounded-lg px-3 py-2 text-sm text-right font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                    !prices[item.id] || parseFloat(prices[item.id]) <= 0
                      ? "border-2 border-orange-400 bg-orange-50 placeholder-orange-400"
                      : "border-2 border-gray-300 bg-white"
                  }`}
                />
                {savingPrice === item.id && (
                  <span className="text-green-600 text-sm font-bold">✓</span>
                )}
              </div>
              {(!prices[item.id] || parseFloat(prices[item.id]) <= 0) && (
                <span className="text-xs text-orange-600 font-medium">Requerido</span>
              )}
            </div>

            <button
              onClick={() => remove(item.id)}
              disabled={removing === item.id}
              className="text-gray-400 hover:text-red-600 transition disabled:opacity-40 flex-shrink-0 p-1"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Summary + submit */}
      <div className="bg-white rounded-xl border shadow-sm p-6 sticky bottom-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">
              {items.length} carta{items.length !== 1 ? "s" : ""}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {total > 0 ? `¥${total.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="text-right">
            {!allPriced && (
              <p className="text-xs text-orange-600 mb-2">
                Asigna precio a todas las cartas para poder enviar el pedido
              </p>
            )}
            <button
              onClick={submitOrder}
              disabled={!allPriced || submitting || items.length === 0}
              className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando…" : "Hacer pedido"}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
