"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Request {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  card: { name: string; setName: string; rarity: string | null; imageUrl: string | null; price: unknown };
}

export default function RequestsManager({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(id: string, action: "confirm" | "reject") {
    setProcessing(id);
    await fetch("/api/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setProcessing(null);
    router.refresh();
  }

  async function moveToPool(ids: string[]) {
    await fetch("/api/pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistItemIds: ids }),
    });
    router.refresh();
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const confirmed = requests.filter((r) => r.status === "PAYMENT_CONFIRMED");

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">
            Pendientes de confirmación de pago{" "}
            <span className="text-gray-400 font-normal text-base">({pending.length})</span>
          </h2>
        </div>

        {pending.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay solicitudes pendientes</p>
        ) : (
          <div className="space-y-3">
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                processing={processing}
                onConfirm={() => handleAction(req.id, "confirm")}
                onReject={() => handleAction(req.id, "reject")}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">
            Pago confirmado — listas para el pool{" "}
            <span className="text-gray-400 font-normal text-base">({confirmed.length})</span>
          </h2>
          {confirmed.length > 0 && (
            <button
              onClick={() => moveToPool(confirmed.map((r) => r.id))}
              className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Mover todas al pool
            </button>
          )}
        </div>

        {confirmed.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay solicitudes confirmadas</p>
        ) : (
          <div className="space-y-3">
            {confirmed.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                processing={processing}
                onMoveToPool={() => moveToPool([req.id])}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RequestCard({
  req,
  processing,
  onConfirm,
  onReject,
  onMoveToPool,
}: {
  req: Request;
  processing: string | null;
  onConfirm?: () => void;
  onReject?: () => void;
  onMoveToPool?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border p-4 flex gap-4 items-center">
      {req.card.imageUrl && (
        <div className="relative w-14 h-20 flex-shrink-0">
          <Image src={req.card.imageUrl} alt={req.card.name} fill className="object-contain" sizes="56px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{req.card.name}</p>
        <p className="text-sm text-gray-500">{req.card.setName}</p>
        <p className="text-sm text-gray-600 mt-0.5">
          Cliente: <span className="font-medium">{req.user.name}</span>
          <span className="text-gray-400 ml-1">({req.user.email})</span>
        </p>
        <p className="text-xs text-gray-400">Cantidad: {req.quantity}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onConfirm && (
          <button
            onClick={onConfirm}
            disabled={processing === req.id}
            className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            Confirmar pago
          </button>
        )}
        {onReject && (
          <button
            onClick={onReject}
            disabled={processing === req.id}
            className="text-sm text-red-500 hover:text-red-700 px-2 transition"
          >
            Rechazar
          </button>
        )}
        {onMoveToPool && (
          <button
            onClick={onMoveToPool}
            className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
          >
            Al pool
          </button>
        )}
      </div>
    </div>
  );
}
