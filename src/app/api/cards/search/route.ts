import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ data: [] });

  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(query)}" set.series:*&pageSize=20&orderBy=name`,
    { headers, next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Error al buscar cartas" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
