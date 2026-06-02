"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface OrderItem {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  userPrice: { toNumber?(): number } | number;
  adminPrice: { toNumber?(): number } | number | null;
  finalPrice: { toNumber?(): number } | number | null;
  card: {
    name: string;
    setName: string;
    number: string | null;
    rarity: string | null;
    imageUrl: string | null;
  };
  photos: { imageUrl: string; caption: string | null }[];
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  paidAmount: { toNumber?(): number } | number | null;
  notes: string | null;
  createdAt: string | Date;
  user: { id: string; name: string; email: string; walletBalance: { toNumber?(): number } | number };
  items: OrderItem[];
}

function toNum(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

const ITEM_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Sin revisar", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "Aceptada", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  PURCHASED: { label: "Comprada ✓", color: "bg-green-100 text-green-700" },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En revisión",
  ACCEPTED: "Aceptado — pendiente de pago",
  PARTIALLY_ACCEPTED: "Parcialmente aceptado — pendiente de pago",
  REJECTED: "Rechazado",
  PAYMENT_CONFIRMED: "Pago confirmado",
  COMPLETED: "Completado",
};

export default function OrderDetail({ order }: { order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [paymentInput, setPaymentInput] = useState(
    order.paidAmount ? toNum(order.paidAmount).toFixed(2) : ""
  );
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  async function action(act: string, extra?: Record<string, unknown>) {
    setBusy((b) => new Set([...b, act]));
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, ...extra }),
    });
    setBusy((b) => { const n = new Set(b); n.delete(act); return n; });
    router.refresh();
  }

  async function itemAction(act: string, itemId: string) {
    setBusy((b) => new Set([...b, itemId]));
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, itemId }),
    });
    setBusy((b) => { const n = new Set(b); n.delete(itemId); return n; });
    router.refresh();
  }

  async function saveAdminPrice(itemId: string) {
    const val = editPrices[itemId];
    if (!val || isNaN(parseFloat(val))) return;
    setBusy((b) => new Set([...b, `price-${itemId}`]));
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_admin_price", itemId, adminPrice: parseFloat(val) }),
    });
    setBusy((b) => { const n = new Set(b); n.delete(`price-${itemId}`); return n; });
    setEditPrices((p) => { const n = { ...p }; delete n[itemId]; return n; });
    router.refresh();
  }

  async function confirmPayment() {
    const amount = parseFloat(paymentInput);
    if (isNaN(amount) || amount <= 0) return;
    setConfirmingPayment(true);
    await action("confirm_payment", { paymentAmount: amount });
    setConfirmingPayment(false);
    setShowPaymentForm(false);
  }

  const acceptedItems = order.items.filter((i) => i.status === "ACCEPTED" || i.status === "PURCHASED");
  const acceptedTotal = acceptedItems.reduce((s, i) => s + toNum(i.adminPrice ?? i.userPrice) * i.quantity, 0);
  const pendingItems = order.items.filter((i) => i.status === "PENDING");
  const canReview = ["PENDING", "ACCEPTED", "PARTIALLY_ACCEPTED"].includes(order.status);
  const canConfirmPayment = ["ACCEPTED", "PARTIALLY_ACCEPTED"].includes(order.status) && !order.paidAmount;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">Pedido #{order.orderNumber}</h2>
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-gray-600">{order.user.name} · {order.user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total aceptado</p>
            <p className="text-2xl font-bold text-gray-900">¥{acceptedTotal.toFixed(2)}</p>
            <p className="text-sm text-gray-500">
              Cartera cliente: <span className="font-semibold text-gray-700">¥{toNum(order.user.walletBalance).toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Bulk actions */}
        {canReview && pendingItems.length > 0 && (
          <div className="flex gap-3 mt-5 pt-5 border-t">
            <button
              onClick={() => action("accept_order")}
              disabled={busy.has("accept_order")}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              Aceptar todo el pedido
            </button>
            <button
              onClick={() => action("reject_order")}
              disabled={busy.has("reject_order")}
              className="border border-red-300 text-red-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition"
            >
              Rechazar todo el pedido
            </button>
          </div>
        )}

        {/* Payment confirmation */}
        {canConfirmPayment && (
          <div className="mt-5 pt-5 border-t">
            {!showPaymentForm ? (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Confirmar pago recibido
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Importe recibido:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentInput}
                  onChange={(e) => setPaymentInput(e.target.value)}
                  placeholder={`¥${acceptedTotal.toFixed(2)}`}
                  className="w-32 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  autoFocus
                />
                <span className="text-sm text-gray-600">¥</span>
                <button
                  onClick={confirmPayment}
                  disabled={confirmingPayment}
                  className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {confirmingPayment ? "Guardando…" : "Confirmar"}
                </button>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {order.paidAmount && (
          <div className="mt-5 pt-5 border-t flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm text-green-700 font-medium">
              Pago confirmado: ¥{toNum(order.paidAmount).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">
            Cartas del pedido{" "}
            <span className="text-gray-500 font-normal text-sm">({order.items.length})</span>
          </h3>
        </div>

        <div className="divide-y">
          {order.items.map((item) => {
            const cfg = ITEM_STATUS_CONFIG[item.status] ?? { label: item.status, color: "bg-gray-100 text-gray-700" };
            const effectivePrice = toNum(item.adminPrice ?? item.userPrice);
            const isEditing = item.id in editPrices;
            const isBusy = busy.has(item.id);

            return (
              <div key={item.id} className={`flex gap-4 items-center px-6 py-4 ${item.status === "REJECTED" ? "opacity-50 bg-gray-50" : ""}`}>
                {/* Card image */}
                {item.card.imageUrl ? (
                  <div className="relative w-12 h-16 flex-shrink-0">
                    <Image src={item.card.imageUrl} alt={item.card.name} fill className="object-contain rounded" sizes="48px" />
                  </div>
                ) : (
                  <div className="w-12 h-16 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-400">?</div>
                )}

                {/* Card info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.card.name}</p>
                  <p className="text-xs text-gray-500">{item.card.setName}</p>
                  {item.card.number && <p className="text-xs text-gray-500">Nº {item.card.number}</p>}
                  {item.notes && <p className="text-xs text-gray-500 italic mt-0.5">{item.notes}</p>}
                </div>

                {/* Quantity */}
                <div className="text-center flex-shrink-0 w-10">
                  <p className="text-xs text-gray-500">Qty</p>
                  <p className="font-semibold text-gray-900">{item.quantity}</p>
                </div>

                {/* Prices */}
                <div className="flex-shrink-0 text-right w-40">
                  <p className="text-xs text-gray-500 mb-1">Precio usuario</p>
                  <p className="text-sm text-gray-600">¥{toNum(item.userPrice).toFixed(2)}</p>

                  <p className="text-xs text-gray-500 mt-1 mb-1">Precio admin</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrices[item.id]}
                        onChange={(e) => setEditPrices((p) => ({ ...p, [item.id]: e.target.value }))}
                        className="w-20 border rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-red-400"
                        autoFocus
                      />
                      <button onClick={() => saveAdminPrice(item.id)} disabled={busy.has(`price-${item.id}`)} className="text-green-600 text-sm">✓</button>
                      <button onClick={() => setEditPrices((p) => { const n = { ...p }; delete n[item.id]; return n; })} className="text-gray-400 text-sm">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditPrices((p) => ({ ...p, [item.id]: item.adminPrice ? toNum(item.adminPrice).toFixed(2) : toNum(item.userPrice).toFixed(2) }))}
                      className={`text-sm font-semibold hover:text-red-600 transition ${item.adminPrice ? "text-red-600" : "text-gray-900"}`}
                    >
                      ¥{effectivePrice.toFixed(2)}
                      {!item.adminPrice && <span className="text-gray-400 text-xs ml-1">(editar)</span>}
                    </button>
                  )}

                  {item.finalPrice && (
                    <p className="text-xs text-green-700 mt-1">Final: ¥{toNum(item.finalPrice).toFixed(2)}</p>
                  )}
                </div>

                {/* Status */}
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>
                  {cfg.label}
                </span>

                {/* Item actions */}
                {canReview && item.status === "PENDING" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => itemAction("accept_item", item.id)}
                      disabled={isBusy}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => itemAction("reject_item", item.id)}
                      disabled={isBusy}
                      className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                {/* Purchase photo */}
                {item.photos[0] && (
                  <div className="relative w-10 h-14 flex-shrink-0">
                    <Image src={item.photos[0].imageUrl} alt="Compra" fill className="object-contain rounded" sizes="40px" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
