import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const setSlug = req.nextUrl.searchParams.get("set") ?? "";

  const cards = await prisma.card.findMany({
    where: {
      active: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nameJp: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(setSlug && { setId: setSlug }),
    },
    orderBy: [{ setId: "asc" }, { number: "asc" }],
    select: {
      id: true,
      externalId: true,
      name: true,
      nameJp: true,
      setName: true,
      setId: true,
      number: true,
      rarity: true,
      imageUrl: true,
      hp: true,
      cardTypes: true,
      cardCategory: true,
      illustrator: true,
      pokedexNumber: true,
      regulationMark: true,
    },
  });

  return NextResponse.json(cards);
}
