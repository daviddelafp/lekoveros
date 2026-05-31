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
  card: { name: string; number: string | null; setName: string; rarity: string | null; imageUrl: string | null; price: unknown };
}

interface ClientGroup {
  user: { id: string; name: string; email: string };
  requests: Request[];
}

function groupByClient(requests: Request[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>();
  for (const req of requests) {
    const existing = map.get(req.user.id);
    if (existing) {
      existing.requests.push(req);
    } else {
      map.set(req.user.id, { user: req.user, requests: [req] });
    }
  }
  return [...map.values()];
}

export default function RequestsManager({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const pending = requests.filter((r) => r.status === "PENDING");
  const confirmed = requests.filter((r) => r.status === "PAYMENT_CONFIRMED");

  const pendingGroups = groupByClient(pending);
  const confirmedGroups = groupByClient(confirmed);

  async function action(ids: string[], type: "confirm" | "reject") {
    setProcessing((prev) => new Set([...prev, ...ids]));
    await Promise.all(
      ids.map((id) =>
        fetch("/api/requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: type }),
        })
      )
    );
    setProcessing(new Set());
    router.refresh();
  }

  async function moveToPool(ids: string[]) {
    setProcessing((prev) => new Set([...prev, ...ids]));
    await fetch("/api/pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistItemIds: ids }),
    });
    setProcessing(new Set());
    router.refresh();
  }

  const isBusy = (ids: string[]) => ids.some((id) => processing.has(id));

  return (
    <div className="space-y-10">

      {/* ── Pendientes de confirmar pago ────────────────────────────── */}
      <section>
        <h2 className="font-semibold text-lg mb-4">
          Pendientes de confirmar pago{" "}
          <span className="text-gray-400 font-normal text-base">({pending.length})</span>
        </h2>

        {pendingGroups.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin solicitudes pendientes.</p>
        ) : (
          <div className="space-y-4">
            {pendingGroups.map(({ user, requests: reqs }) => {
              const ids = reqs.map((r) => r.id);
              return (
                <div key={user.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* Client header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{reqs.length} carta{reqs.length !== 1 ? "s" : ""}</span>
                      <button
                        onClick={() => action(ids, "confirm")}
                        disabled={isBusy(ids)}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        Confirmar todo
                      </button>
                      <button
                        onClick={() => action(ids, "reject")}
                        disabled={isBusy(ids)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 transition disabled:opacity-50"
                      >
                        Rechazar todo
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="divide-y">
                    {reqs.map((req) => (
                      <CardRow
                        key={req.id}
                        req={req}
                        busy={processing.has(req.id)}
                        actions={
                          <>
                            <button
                              onClick={() => action([req.id], "confirm")}
                              disabled={processing.has(req.id)}
                              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => action([req.id], "reject")}
                              disabled={processing.has(req.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Pago confirmado — listas para el pool ───────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">
            Pago confirmado — pasar al pool{" "}
            <span className="text-gray-400 font-normal text-base">({confirmed.length})</span>
          </h2>
          {confirmed.length > 0 && (
            <button
              onClick={() => moveToPool(confirmed.map((r) => r.id))}
              disabled={isBusy(confirmed.map((r) => r.id))}
              className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              Mover todo al pool
            </button>
          )}
        </div>

        {confirmedGroups.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin solicitudes confirmadas.</p>
        ) : (
          <div className="space-y-4">
            {confirmedGroups.map(({ user, requests: reqs }) => {
              const ids = reqs.map((r) => r.id);
              return (
                <div key={user.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* Client header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b">
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{reqs.length} carta{reqs.length !== 1 ? "s" : ""}</span>
                      <button
                        onClick={() => moveToPool(ids)}
                        disabled={isBusy(ids)}
                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                      >
                        Mover todo al pool
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="divide-y">
                    {reqs.map((req) => (
                      <CardRow
                        key={req.id}
                        req={req}
                        busy={processing.has(req.id)}
                        actions={
                          <button
                            onClick={() => moveToPool([req.id])}
                            disabled={processing.has(req.id)}
                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                          >
                            Al pool
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CardRow({
  req,
  busy,
  actions,
}: {
  req: Request;
  busy: boolean;
  actions: React.ReactNode;
}) {
  return (
    <div className={`flex gap-3 items-center px-4 py-3 ${busy ? "opacity-50" : ""}`}>
      {req.card.imageUrl ? (
        <div className="relative w-10 h-14 flex-shrink-0">
          <Image src={req.card.imageUrl} alt={req.card.name} fill className="object-contain" sizes="40px" />
        </div>
      ) : (
        <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">?</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{req.card.name}</p>
        <p className="text-xs text-gray-400">
          {req.card.number && <span className="mr-2">{req.card.number}</span>}
          {req.card.rarity && <span>{req.card.rarity}</span>}
        </p>
        <p className="text-xs text-gray-400">Cantidad: {req.quantity}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">{actions}</div>
    </div>
  );
}
