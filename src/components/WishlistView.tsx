"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente de pago", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: { label: "Pago confirmado", color: "bg-blue-100 text-blue-800" },
  IN_POOL: { label: "En proceso de compra", color: "bg-purple-100 text-purple-800" },
  PURCHASED: { label: "Comprada", color: "bg-green-100 text-green-800" },
};

interface WishlistItem {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  card: {
    name: string;
    setName: string;
    rarity: string | null;
    imageUrl: string | null;
    price: { toNumber(): number } | null;
  };
  photos: { imageUrl: string; caption: string | null }[];
}

export default function WishlistView({ items }: { items: WishlistItem[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

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

  if (items.length === 0) {
    return (
      <p className="text-center text-gray-400 py-16">
        Tu lista está vacía. Ve al{" "}
        <a href="/catalogo" className="text-red-600 underline">
          catálogo
        </a>{" "}
        para añadir cartas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const status = STATUS_LABELS[item.status] ?? { label: item.status, color: "bg-gray-100 text-gray-800" };
        const photo = item.photos[0];

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm border p-4 flex gap-4 items-start"
          >
            {item.card.imageUrl && (
              <div className="relative w-20 h-28 flex-shrink-0">
                <Image
                  src={item.card.imageUrl}
                  alt={item.card.name}
                  fill
                  className="object-contain rounded"
                  sizes="80px"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.card.name}</p>
                  <p className="text-sm text-gray-500">{item.card.setName}</p>
                  {item.card.rarity && (
                    <p className="text-xs text-gray-400">{item.card.rarity}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>Cantidad: {item.quantity}</span>
                {item.card.price && (
                  <span className="font-medium text-gray-700">
                    {item.card.price.toNumber().toFixed(2)} €
                  </span>
                )}
              </div>

              {item.notes && (
                <p className="mt-1 text-xs text-gray-400 italic">{item.notes}</p>
              )}

              {photo && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-medium text-green-600 mb-2">Foto de tu carta:</p>
                  <div className="relative w-32 h-44">
                    <Image
                      src={photo.imageUrl}
                      alt="Carta comprada"
                      fill
                      className="object-contain rounded"
                      sizes="128px"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-xs text-gray-500 mt-1">{photo.caption}</p>
                  )}
                </div>
              )}
            </div>

            {item.status === "PENDING" && (
              <button
                onClick={() => remove(item.id)}
                disabled={removing === item.id}
                className="text-xs text-red-400 hover:text-red-600 transition"
              >
                Eliminar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
