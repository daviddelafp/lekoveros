import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const orderItemId = formData.get("orderItemId") as string;
  const caption = formData.get("caption") as string | null;
  const finalPriceStr = formData.get("finalPrice") as string | null;

  if (!file || !orderItemId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true },
  });
  if (!item) return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "cards");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${orderItemId}-${Date.now()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  const imageUrl = `/uploads/cards/${filename}`;
  const finalPrice = finalPriceStr ? new Prisma.Decimal(finalPriceStr) : null;

  await prisma.$transaction(async (tx) => {
    await tx.cardPhoto.create({
      data: { orderItemId, imageUrl, caption: caption || null },
    });

    await tx.orderItem.update({
      where: { id: orderItemId },
      data: {
        status: "PURCHASED",
        ...(finalPrice !== null ? { finalPrice } : {}),
      },
    });

    // Deduct finalPrice from user wallet
    if (finalPrice !== null) {
      await tx.user.update({
        where: { id: item.order.userId },
        data: { walletBalance: { decrement: finalPrice } },
      });
    }

    // If all non-rejected items are now purchased → COMPLETED
    const allItems = await tx.orderItem.findMany({ where: { orderId: item.orderId } });
    const allSettled = allItems.every(
      (i) => i.status === "REJECTED" || i.status === "PURCHASED" || i.id === orderItemId
    );
    if (allSettled) {
      const hasPurchased = allItems.some((i) => i.status === "PURCHASED" || i.id === orderItemId);
      await tx.order.update({
        where: { id: item.orderId },
        data: { status: hasPurchased ? "COMPLETED" : "REJECTED" },
      });
    }
  });

  return NextResponse.json({ ok: true, imageUrl }, { status: 201 });
}
