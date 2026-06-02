"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

interface PoolItem {
  id: string;
  quantity: number;
  orderId: string;
  orderNumber: number;
  userPrice: { toNumber?: () => number } | number;
  adminPrice: { toNumber?: () => number } | number | null;
  card: { id: string; name: string; setName: string; rarity: string | null; imageUrl: string | null };
  user: { id: string; name: string; email: string };
}

function toNum(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export default function PoolManager({ items }: { items: PoolItem[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState<string | null>(null);

  // Filters
  const [filterUser, setFilterUser] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [filterCard, setFilterCard] = useState("");
  const [searchText, setSearchText] = useState("");

  // Unique filter options
  const uniqueUsers = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((i) => m.set(i.user.id, i.user.name));
    return Array.from(m.entries());
  }, [items]);

  const uniqueSets = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((i) => m.set(i.card.setName, i.card.setName));
    return Array.from(m.keys()).sort();
  }, [items]);

  const uniqueCards = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((i) => m.set(i.card.id, i.card.name));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  // Apply filters
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterUser && i.user.id !== filterUser) return false;
      if (filterSet && i.card.setName !== filterSet) return false;
      if (filterCard && i.card.id !== filterCard) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          i.card.name.toLowerCase().includes(q) ||
          i.user.name.toLowerCase().includes(q) ||
          i.card.setName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filterUser, filterSet, filterCard, searchText]);

  // Group by order (default)
  const groupedByOrder = useMemo(() => {
    const groups: Record<string, {
      orderId: string;
      orderNumber: number;
      user: PoolItem["user"];
      items: PoolItem[];
    }> = {};
    for (const item of filtered) {
      if (!groups[item.orderId]) {
        groups[item.orderId] = {
          orderId: item.orderId,
          orderNumber: item.orderNumber,
          user: item.user,
          items: [],
        };
      }
      groups[item.orderId].items.push(item);
    }
    return Object.values(groups).sort((a, b) => a.orderNumber - b.orderNumber);
  }, [filtered]);

  async function uploadPhoto(orderItemId: string, file: File, caption: string, finalPrice: string) {
    setUploading(orderItemId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderItemId", orderItemId);
    if (caption) formData.append("caption", caption);
    if (finalPrice) formData.append("finalPrice", finalPrice);
    await fetch("/api/photos", { method: "POST", body: formData });
    setUploading(null);
    router.refresh();
  }

  const hasFilters = filterUser || filterSet || filterCard || searchText;

  const totalValue = filtered.reduce(
    (s, i) => s + toNum(i.adminPrice ?? i.userPrice) * i.quantity,
    0
  );

  return (
    <div>
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Nombre de carta, usuario…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Set filter */}
          <div className="min-w-44">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Set</label>
            <select
              value={filterSet}
              onChange={(e) => setFilterSet(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Todos los sets</option>
              {uniqueSets.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Card filter */}
          <div className="min-w-44">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Carta</label>
            <select
              value={filterCard}
              onChange={(e) => setFilterCard(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Todas las cartas</option>
              {uniqueCards.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div className="min-w-44">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Comprador</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Todos</option>
              {uniqueUsers.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setFilterUser(""); setFilterSet(""); setFilterCard(""); setSearchText(""); }}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-700">
          <span className="font-semibold">{filtered.length}</span> carta{filtered.length !== 1 ? "s" : ""}
          {" · "}
          <span className="font-semibold">{groupedByOrder.length}</span> pedido{groupedByOrder.length !== 1 ? "s" : ""}
          {" · Total: "}
          <span className="font-bold text-gray-900">¥{totalValue.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {groupedByOrder.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-600 font-medium">No hay cartas pendientes de compra.</p>
          <p className="text-sm text-gray-500 mt-1">
            Aquí aparecerán las cartas cuando el pago de un pedido esté confirmado.
          </p>
        </div>
      )}

      {/* ── Orders ──────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {groupedByOrder.map(({ orderId, orderNumber, user, items: orderItems }) => {
          const orderTotal = orderItems.reduce(
            (s, i) => s + toNum(i.adminPrice ?? i.userPrice) * i.quantity,
            0
          );

          return (
            <div key={orderId} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Order header */}
              <div className="bg-gray-50 border-b px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-700 font-bold text-sm">#{orderNumber}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500 font-medium">{orderItems.length} carta{orderItems.length !== 1 ? "s" : ""}</p>
                  <p className="font-bold text-gray-900">¥{orderTotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {orderItems.map((item) => (
                  <PurchaseRow
                    key={item.id}
                    item={item}
                    uploading={uploading === item.id}
                    onUpload={(file, caption, finalPrice) =>
                      uploadPhoto(item.id, file, caption, finalPrice)
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PurchaseRow({
  item,
  uploading,
  onUpload,
}: {
  item: PoolItem;
  uploading: boolean;
  onUpload: (file: File, caption: string, finalPrice: string) => void;
}) {
  const [caption, setCaption] = useState("");
  const [finalPrice, setFinalPrice] = useState(
    toNum(item.adminPrice ?? item.userPrice).toFixed(2)
  );

  return (
    <div className={`px-5 py-4 flex items-center gap-4 flex-wrap ${uploading ? "opacity-60" : ""}`}>
      {/* Card image + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {item.card.imageUrl ? (
          <div className="relative w-10 h-14 flex-shrink-0">
            <Image src={item.card.imageUrl} alt={item.card.name} fill className="object-contain rounded" sizes="40px" />
          </div>
        ) : (
          <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">?</div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.card.name}</p>
          <p className="text-xs text-gray-600">{item.card.setName}</p>
          <p className="text-xs text-gray-500">x{item.quantity}</p>
        </div>
      </div>

      {/* Agreed price */}
      <div className="flex-shrink-0 text-center">
        <p className="text-xs font-medium text-gray-600 mb-0.5">Precio pactado</p>
        <p className="text-sm font-bold text-gray-900">¥{toNum(item.adminPrice ?? item.userPrice).toFixed(2)}</p>
      </div>

      {/* Final price input */}
      <div className="flex-shrink-0">
        <label className="block text-xs font-medium text-gray-600 mb-0.5">Precio final (¥)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={finalPrice}
          onChange={(e) => setFinalPrice(e.target.value)}
          className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Caption */}
      <div className="flex-shrink-0">
        <label className="block text-xs font-medium text-gray-600 mb-0.5">Nota</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Opcional"
          className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-400"
        />
      </div>

      {/* Upload button */}
      <label className={`flex-shrink-0 cursor-pointer bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
        {uploading ? "Subiendo…" : "📷 Foto de compra"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file, caption, finalPrice);
          }}
        />
      </label>
    </div>
  );
}
