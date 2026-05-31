"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface DbCard {
  id: string;
  externalId: string;
  name: string;
  nameJp: string | null;
  setName: string;
  setId: string;
  number: string | null;
  rarity: string | null;
  imageUrl: string | null;
  hp: string | null;
  cardTypes: string[];
  cardCategory: string | null;
  illustrator: string | null;
  pokedexNumber: string | null;
  regulationMark: string | null;
}

export default function CardCatalog({ userId }: { userId: string }) {
  const [cards, setCards] = useState<DbCard[]>([]);
  const [filtered, setFiltered] = useState<DbCard[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        setCards(data);
        setFiltered(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) { setFiltered(cards); return; }
    setFiltered(
      cards.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameJp?.toLowerCase().includes(q) ||
          c.number?.includes(q) ||
          c.illustrator?.toLowerCase().includes(q) ||
          c.rarity?.toLowerCase().includes(q)
      )
    );
  }, [query, cards]);

  async function addToList(card: DbCard) {
    setAdding(card.id);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardExternalId: card.externalId,
        cardName: card.name,
        cardSetName: card.setName,
        cardSetId: card.setId,
        cardNumber: card.number,
        cardRarity: card.rarity,
        cardImageUrl: card.imageUrl,
        quantity: 1,
      }),
    });
    const data = await res.json();
    setAdding(null);
    setFeedback({ id: card.id, msg: res.ok ? "Añadida a tu lista" : data.error, ok: res.ok });
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por nombre, número, rareza, ilustrador…"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <p className="text-gray-400 text-center py-16">Cargando catálogo…</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-center py-16">No se encontraron cartas</p>
      )}

      {!loading && (
        <p className="text-sm text-gray-400 mb-4">
          {filtered.length} carta{filtered.length !== 1 ? "s" : ""}
          {query ? ` encontrada${filtered.length !== 1 ? "s" : ""}` : " en el catálogo"}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition"
          >
            {card.imageUrl ? (
              <div className="relative aspect-[3/4]">
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  className="object-contain p-1"
                  sizes="200px"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                <span className="text-gray-300 text-3xl">?</span>
              </div>
            )}

            <div className="p-2">
              <p className="font-semibold text-sm leading-tight truncate">{card.name}</p>
              {card.number && (
                <p className="text-xs text-gray-400">{card.number}</p>
              )}
              {card.rarity && (
                <p className="text-xs text-gray-400 truncate">{card.rarity}</p>
              )}
              {card.illustrator && (
                <p className="text-xs text-gray-300 truncate italic">{card.illustrator}</p>
              )}

              <button
                onClick={() => addToList(card)}
                disabled={adding === card.id}
                className="mt-2 w-full text-xs bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {adding === card.id ? "Añadiendo…" : "+ Mi Lista"}
              </button>

              {feedback?.id === card.id && (
                <p className={`text-xs mt-1 text-center ${feedback.ok ? "text-green-600" : "text-red-500"}`}>
                  {feedback.msg}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
