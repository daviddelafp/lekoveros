import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const wishlistItemId = formData.get("wishlistItemId") as string;
  const caption = formData.get("caption") as string | null;

  if (!file || !wishlistItemId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.findUnique({ where: { id: wishlistItemId } });
  if (!item) return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "cards");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${wishlistItemId}-${Date.now()}.${ext}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/cards/${filename}`;

  const photo = await prisma.cardPhoto.create({
    data: { wishlistItemId, imageUrl, caption },
  });

  if (item.status !== "PURCHASED") {
    await prisma.wishlistItem.update({
      where: { id: wishlistItemId },
      data: { status: "PURCHASED" },
    });
  }

  return NextResponse.json(photo, { status: 201 });
}
