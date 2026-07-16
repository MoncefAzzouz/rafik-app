-- CreateEnum
CREATE TYPE "PromoScope" AS ENUM ('TAXI', 'FOOD', 'SERVICES', 'ALL');

-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "promoDiscount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "FoodOrder" ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "promoDiscount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TaxiRide" ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "promoDiscount" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "scope" "PromoScope" NOT NULL DEFAULT 'ALL',
    "discountType" "PromoDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxDiscount" INTEGER,
    "minOrderAmount" INTEGER,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT,
    "clientPhone" TEXT,
    "scope" "PromoScope" NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoRedemption_promoCodeId_userId_idx" ON "PromoRedemption"("promoCodeId", "userId");

-- CreateIndex
CREATE INDEX "PromoRedemption_promoCodeId_clientPhone_idx" ON "PromoRedemption"("promoCodeId", "clientPhone");

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
