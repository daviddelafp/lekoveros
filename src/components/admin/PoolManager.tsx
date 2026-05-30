"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

interface PoolItem {
  id: string;
  quantity: number;
  status: string;
  card: { id: string; name: string; setName: string; rarity: string | null; imageUrl: string | null };
  user: { id: string; name: string; email: string };
}

export default function PoolManager({ items }: { items: PoolItem[] }) {
  const router = useRouter();
  const [filterCard, setFilterCard] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCard = filterCard ? item.card.id === filterCard : true;
      const matchUser = filterUser ? item.user.id === filterUser : true;
      return matchCard && matchUser;
    });
  }, [items, filterCard, filterUser]);

  // Group by card for visual reference
  const groupedByCard = useMemo(() => {
    const groups: Record<string, { card: PoolItem["card"]; items: PoolItem[] }> = {};
    filtered.forEach((item) => {
      if (!groups[item.card.id]) {
        groups[item.card.id] = { card: item.card, items: [] };
      }
      groups[item.card.id].items.push(item);
    });
    return Object.values(groups);
  }, [filtered]);

  const uniqueCards = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((i) => seen.set(i.card.id, i.card.name));
    return Array.from(seen.entries());
  }, [items]);

  const uniqueUsers = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((i) => seen.set(i.user.id, i.user.name));
    return Array.from(seen.entries());
  }, [items]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function markPurchased() {
    const ids = Array.from(selected);
    await fetch("/api/pool", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistItemIds: ids }),
    });
    setSelected(new Set());
    router.refresh();
  }

  async function uploadPhoto(wishlistItemId: string, file: File, caption: string) {
    setUploading(wishlistItemId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("wishlistItemId", wishlistItemId);
    if (caption) formData.append("caption", caption);
    await fetch("/api/photos", { method: "POST", body: formData });
    setUploading(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          value={filterCard}
          onChange={(e) => setFilterCard(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">Todas las cartas</option>
          {uniqueCards.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">Todos los compradores</option>
          {uniqueUsers.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <button
            onClick={markPurchased}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition ml-auto"
          >
            Marcar {selected.size} como compradas
          </button>
        )}
      </div>

      {groupedByCard.length === 0 && (
        <p className="text-gray-400 text-center py-16">No hay cartas en el pool</p>
      )}

      <div className="space-y-6">
        {groupedByCard.map(({ card, items: cardItems }) => (
          <div key={card.id} className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-3">
              {card.imageUrl && (
                <div className="relative w-10 h-14">
                  <Image src={card.imageUrl} alt={card.name} fill className="object-contain" sizes="40px" />
                </div>
              )}
              <div>
                <p className="font-semibold">{card.name}</p>
                <p className="text-xs text-gray-500">{card.setName}</p>
              </div>
              <span className="ml-auto text-sm text-gray-500">
                {cardItems.reduce((sum, i) => sum + i.quantity, 0)} unidades totales
              </span>
            </div>

            <div className="divide-y">
              {cardItems.map((item) => (
                <PoolItemRow
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onUpload={(file, caption) => uploadPhoto(item.id, file, caption)}
                  uploading={uploading === item.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PoolItemRow({
  item,
  selected,
  onToggle,
  onUpload,
  uploading,
}: {
  item: PoolItem;
  selected: boolean;
  onToggle: () => void;
  onUpload: (file: File, caption: string) => void;
  uploading: boolean;
}) {
  const [caption, setCaption] = useState("");

  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${selected ? "bg-green-50" : ""}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 text-green-600"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{item.user.name}</p>
        <p className="text-xs text-gray-400">{item.user.email}</p>
      </div>
      <span className="text-sm text-gray-600">x{item.quantity}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Nota (opcional)"
          className="text-xs border rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-red-400"
        />
        <label className={`text-xs cursor-pointer bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Subiendo..." : "Foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file, caption);
            }}
          />
        </label>
      </div>
    </div>
  );
}
