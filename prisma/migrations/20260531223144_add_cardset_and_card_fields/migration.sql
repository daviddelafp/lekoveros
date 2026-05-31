-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "attacks" JSONB,
ADD COLUMN     "cardCategory" TEXT,
ADD COLUMN     "cardSetId" TEXT,
ADD COLUMN     "cardTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hp" TEXT,
ADD COLUMN     "illustrator" TEXT,
ADD COLUMN     "pokedexNumber" TEXT,
ADD COLUMN     "regulationMark" TEXT,
ADD COLUMN     "resistance" TEXT,
ADD COLUMN     "retreatCost" INTEGER,
ADD COLUMN     "weakness" TEXT,
ALTER COLUMN "active" SET DEFAULT true;

-- CreateTable
CREATE TABLE "CardSet" (
    "id" TEXT NOT NULL,
    "tcgId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameJp" TEXT,
    "releaseDate" TEXT,
    "totalCards" INTEGER,
    "logoUrl" TEXT,
    "symbolUrl" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_tcgId_key" ON "CardSet"("tcgId");

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_slug_key" ON "CardSet"("slug");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_cardSetId_fkey" FOREIGN KEY ("cardSetId") REFERENCES "CardSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
