import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function seedAdmin() {
  const password = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lekoveros.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@lekoveros.com",
      password,
      role: "ADMIN",
      active: true,
    },
  });
  console.log("Admin:", admin.email);
}

async function seedCards() {
  const jsonPath = path.join(__dirname, "..", "scripts", "abyss-eye.json");
  if (!existsSync(jsonPath)) {
    console.log("scripts/abyss-eye.json not found — skipping card seed");
    return;
  }

  const { set, cards } = JSON.parse(readFileSync(jsonPath, "utf-8"));

  const cardSet = await prisma.cardSet.upsert({
    where: { tcgId: set.setId },
    update: {},
    create: {
      tcgId: set.setId,
      slug: set.setSlug,
      nameEn: set.nameEn,
      nameJp: set.nameJp ?? null,
      releaseDate: set.releaseDate ?? null,
      totalCards: set.totalCards ? parseInt(set.totalCards) : null,
      logoUrl: set.logoUrl ?? null,
      symbolUrl: set.symbolUrl ?? null,
      sourceUrl: set.sourceUrl ?? null,
    },
  });

  let count = 0;
  for (const card of cards) {
    if (card.error) continue;
    const tcgCardId = card.sourceUrl?.match(/\/cards\/(\d+)\//)?.[1];
    if (!tcgCardId) continue;

    const resistance =
      card.resistance && card.resistance.trim() !== "—" && card.resistance.trim() !== "-"
        ? card.resistance.trim()
        : null;

    const payload = {
      name: card.nameEn ?? "Unknown",
      nameJp: card.nameJp ?? null,
      setName: "Abyss Eye",
      setId: "abyss-eye",
      number: card.number ?? null,
      rarity: card.rarity ?? null,
      imageUrl: card.imageUrl ?? null,
      hp: card.hp ?? null,
      cardTypes: card.cardTypes ?? [],
      cardCategory: card.cardCategory ?? null,
      illustrator: card.illustrator ?? null,
      pokedexNumber: card.pokedexNumber ?? null,
      weakness: card.weakness ?? null,
      resistance,
      retreatCost: card.retreatCost ?? null,
      regulationMark: card.regulationMark ?? null,
      attacks: card.attacks?.length ? card.attacks : null,
      active: true,
      cardSetId: cardSet.id,
    };

    await prisma.card.upsert({
      where: { externalId: `tcgcollector-${tcgCardId}` },
      update: payload,
      create: { externalId: `tcgcollector-${tcgCardId}`, ...payload },
    });
    count++;
  }
  console.log(`Cards seeded: ${count} (Abyss Eye)`);
}

async function main() {
  await seedAdmin();
  await seedCards();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
