-- Drop unused tables (PoolItem first because of FK to PurchasePool)
DROP TABLE IF EXISTS "PoolItem";
DROP TABLE IF EXISTS "PurchasePool";

-- Drop unused enums
DROP TYPE IF EXISTS "PoolStatus";
DROP TYPE IF EXISTS "WishlistStatus";

-- Simplify WishlistItem: remove status, add userPrice
ALTER TABLE "WishlistItem" DROP COLUMN IF EXISTS "status";
ALTER TABLE "WishlistItem" ADD COLUMN IF NOT EXISTS "userPrice" DECIMAL(10,2);

-- Add wallet balance to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Fix CardPhoto: drop old FK and column, then delete orphaned rows
ALTER TABLE "CardPhoto" DROP CONSTRAINT IF EXISTS "CardPhoto_wishlistItemId_fkey";
ALTER TABLE "CardPhoto" DROP COLUMN IF EXISTS "wishlistItemId";
-- Existing rows no longer have a valid reference — purge them
DELETE FROM "CardPhoto";

-- New enums
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING','ACCEPTED','PARTIALLY_ACCEPTED','REJECTED','PAYMENT_CONFIRMED','COMPLETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING','ACCEPTED','REJECTED','PURCHASED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Order table
CREATE TABLE IF NOT EXISTS "Order" (
  "id"          TEXT          NOT NULL,
  "orderNumber" SERIAL,
  "userId"      TEXT          NOT NULL,
  "status"      "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "paidAmount"  DECIMAL(10,2),
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");

-- OrderItem table
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id"         TEXT              NOT NULL,
  "orderId"    TEXT              NOT NULL,
  "cardId"     TEXT              NOT NULL,
  "quantity"   INTEGER           NOT NULL DEFAULT 1,
  "userPrice"  DECIMAL(10,2)     NOT NULL,
  "adminPrice" DECIMAL(10,2),
  "finalPrice" DECIMAL(10,2),
  "status"     "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
  "notes"      TEXT,
  "createdAt"  TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- Add orderItemId to CardPhoto — table is empty after DELETE above, NOT NULL is safe
ALTER TABLE "CardPhoto" ADD COLUMN IF NOT EXISTS "orderItemId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CardPhoto" ALTER COLUMN "orderItemId" DROP DEFAULT;

-- Foreign keys for Order
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for OrderItem
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_cardId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK for CardPhoto → OrderItem
ALTER TABLE "CardPhoto" DROP CONSTRAINT IF EXISTS "CardPhoto_orderItemId_fkey";
ALTER TABLE "CardPhoto" ADD CONSTRAINT "CardPhoto_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
