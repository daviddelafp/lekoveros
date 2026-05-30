"use client";

import { useState } from "react";
import Image from "next/image";

interface PokemonCard {
  id: string;
  name: string;
  set: { name: string; id: string };
  number: string;
  rarity: string;
  images: { small: string; large: string };
}

export default function CardSearch({ userId }: { userId: string }) {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setCards(data.data ?? []);
    setLoading(false);
  }

  async function addToList(card: PokemonCard) {
    setAdding(card.id);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardExternalId: card.id,
        cardName: card.name,
        cardSetName: card.set.name,
        cardSetId: card.set.id,
        cardNumber: card.number,
        cardRarity: card.rarity,
        cardImageUrl: card.images.small,
        quantity: 1,
      }),
    });
    const data = await res.json();
    setAdding(null);
    setFeedback({
      id: card.id,
      msg: res.ok ? "Añadida a tu lista" : data.error,
      ok: res.ok,
    });
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Buscar carta por nombre..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {cards.length === 0 && !loading && (
        <p className="text-gray-400 text-center py-16">
          Busca una carta para empezar
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition"
          >
            {card.images?.small && (
              <div className="relative aspect-[3/4]">
                <Image
                  src={card.images.small}
                  alt={card.name}
                  fill
                  className="object-contain p-2"
                  sizes="200px"
                />
              </div>
            )}
            <div className="p-3">
              <p className="font-medium text-sm truncate">{card.name}</p>
              <p className="text-xs text-gray-400 truncate">{card.set.name}</p>
              {card.rarity && (
                <p className="text-xs text-gray-400">{card.rarity}</p>
              )}
              <button
                onClick={() => addToList(card)}
                disabled={adding === card.id}
                className="mt-2 w-full text-xs bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {adding === card.id ? "Añadiendo..." : "+ Mi Lista"}
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
