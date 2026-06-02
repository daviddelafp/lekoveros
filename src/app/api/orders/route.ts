import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: admin sees all orders, buyer sees own
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";
  const status = req.nextUrl.searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.user.id }),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { card: { select: { id: true, name: true, imageUrl: true, setName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST: buyer submits cart as order (all items must have a price)
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Los admins no pueden crear pedidos" }, { status: 403 });
  }

  const cartItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: { card: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Tu carrito está vacío" }, { status: 400 });
  }

  const missingPrice = cartItems.some((i) => !i.userPrice);
  if (missingPrice) {
    return NextResponse.json(
      { error: "Todas las cartas deben tener un precio antes de hacer el pedido" },
      { status: 400 }
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        items: {
          create: cartItems.map((item) => ({
            cardId: item.cardId,
            quantity: item.quantity,
            userPrice: item.userPrice!,
            notes: item.notes ?? undefined,
          })),
        },
      },
      include: {
        items: { include: { card: true } },
      },
    });
    await tx.wishlistItem.deleteMany({ where: { userId: session.user.id } });
    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}
