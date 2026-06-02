import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type OrderItemStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "PURCHASED";

function deriveOrderStatus(items: { status: OrderItemStatus }[]) {
  const statuses = items.map((i) => i.status);
  if (statuses.every((s) => s === "PENDING")) return "PENDING";
  if (statuses.every((s) => s === "REJECTED")) return "REJECTED";
  if (statuses.every((s) => s === "PURCHASED")) return "COMPLETED";
  if (statuses.some((s) => s === "PENDING")) return "PENDING";
  // No pending left
  const hasAccepted = statuses.some((s) => s === "ACCEPTED" || s === "PURCHASED");
  const hasRejected = statuses.some((s) => s === "REJECTED");
  if (hasAccepted && hasRejected) return "PARTIALLY_ACCEPTED";
  return "ACCEPTED";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, walletBalance: true } },
      items: {
        include: {
          card: true,
          photos: { orderBy: { uploadedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, itemId, adminPrice, paymentAmount } = body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  // ── Accept / reject whole order ────────────────────────────────────────
  if (action === "accept_order") {
    await prisma.orderItem.updateMany({
      where: { orderId: id, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    const allItems = await prisma.orderItem.findMany({ where: { orderId: id } });
    const newStatus = deriveOrderStatus(allItems as { status: OrderItemStatus }[]);
    const updated = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: { items: { include: { card: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "reject_order") {
    await prisma.orderItem.updateMany({
      where: { orderId: id, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "REJECTED" },
      include: { items: { include: { card: true } } },
    });
    return NextResponse.json(updated);
  }

  // ── Accept / reject individual item ────────────────────────────────────
  if ((action === "accept_item" || action === "reject_item") && itemId) {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: action === "accept_item" ? "ACCEPTED" : "REJECTED" },
    });
    const allItems = await prisma.orderItem.findMany({ where: { orderId: id } });
    const newStatus = deriveOrderStatus(allItems as { status: OrderItemStatus }[]);
    await prisma.order.update({ where: { id }, data: { status: newStatus } });
    return NextResponse.json({ ok: true });
  }

  // ── Adjust admin price for an item ─────────────────────────────────────
  if (action === "set_admin_price" && itemId && adminPrice !== undefined) {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { adminPrice: new Prisma.Decimal(adminPrice) },
    });
    return NextResponse.json({ ok: true });
  }

  // ── Confirm payment: add paidAmount to user wallet ──────────────────────
  if (action === "confirm_payment" && paymentAmount !== undefined) {
    const amount = new Prisma.Decimal(paymentAmount);
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: {
          paidAmount: amount,
          status: "PAYMENT_CONFIRMED",
        },
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: { walletBalance: { increment: amount } },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
