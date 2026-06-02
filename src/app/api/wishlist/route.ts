import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const {
    cardExternalId, cardName, cardSetName, cardSetId,
    cardNumber, cardRarity, cardImageUrl, quantity, notes, userPrice,
  } = await req.json();

  let card = await prisma.card.findUnique({ where: { externalId: cardExternalId } });

  if (!card) {
    card = await prisma.card.create({
      data: {
        externalId: cardExternalId,
        name: cardName,
        setName: cardSetName,
        setId: cardSetId,
        number: cardNumber,
        rarity: cardRarity,
        imageUrl: cardImageUrl,
        active: true,
      },
    });
  }

  const existing = await prisma.wishlistItem.findFirst({
    where: { userId: session.user.id, cardId: card.id },
  });

  if (existing) {
    return NextResponse.json({ error: "Ya tienes esta carta en tu carrito" }, { status: 409 });
  }

  const item = await prisma.wishlistItem.create({
    data: {
      userId: session.user.id,
      cardId: card.id,
      quantity: quantity ?? 1,
      notes,
      userPrice: userPrice ?? null,
    },
    include: { card: true },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, userPrice } = await req.json();

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updated = await prisma.wishlistItem.update({
    where: { id },
    data: { userPrice: userPrice !== undefined ? userPrice : item.userPrice },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.wishlistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
