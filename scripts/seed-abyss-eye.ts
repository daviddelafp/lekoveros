import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const raw = readFileSync(path.join(__dirname, "abyss-eye.json"), "utf-8");
  const data = JSON.parse(raw);

  const { set, cards } = data;

  // Upsert the CardSet
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

  console.log(`CardSet: ${cardSet.nameEn} (id=${cardSet.id})`);

  let created = 0, updated = 0, skipped = 0;

  for (const card of cards) {
    if (card.error) { skipped++; continue; }

    // Extract TCGCollector numeric ID from source URL
    const tcgCardId = card.sourceUrl.match(/\/cards\/(\d+)\//)?.[1];
    if (!tcgCardId) { console.warn(`No ID found for ${card.sourceUrl}`); skipped++; continue; }

    const externalId = `tcgcollector-${tcgCardId}`;

    // Clean resistance (em-dash variants → null)
    const resistance = card.resistance && card.resistance.trim() !== "—" && card.resistance.trim() !== "-"
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
      where: { externalId },
      update: payload,
      create: { externalId, ...payload },
    });

    console.log(`  [${card.number ?? "?"}] ${card.nameEn} — ${card.rarity}`);
    created++;
  }

  console.log(`\nDone. Created/updated: ${created}, skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
