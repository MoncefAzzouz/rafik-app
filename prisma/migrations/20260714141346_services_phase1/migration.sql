-- CreateEnum
CREATE TYPE "MediationMode" AS ENUM ('MEDIATED', 'DIRECT');

-- CreateEnum
CREATE TYPE "CommissionMode" AS ENUM ('PERCENTAGE', 'SUBSCRIPTION');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "clientCommune" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "clientLat" DOUBLE PRECISION,
ADD COLUMN     "clientLng" DOUBLE PRECISION,
ADD COLUMN     "clientWilaya" TEXT,
ADD COLUMN     "commissionAmount" INTEGER,
ADD COLUMN     "commissionModeSnapshot" "CommissionMode",
ADD COLUMN     "commissionPercentSnapshot" DOUBLE PRECISION,
ADD COLUMN     "finalPrice" INTEGER,
ADD COLUMN     "mediationModeSnapshot" "MediationMode";

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "address" TEXT,
ADD COLUMN     "commissionModeOverride" "CommissionMode",
ADD COLUMN     "commissionPercentOverride" DOUBLE PRECISION,
ADD COLUMN     "commune" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "mediationModeOverride" "MediationMode",
ADD COLUMN     "subscriptionFeeOverride" INTEGER,
ADD COLUMN     "wilaya" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "commune" TEXT,
ADD COLUMN     "wilaya" TEXT;

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "mediationMode" "MediationMode" NOT NULL DEFAULT 'MEDIATED',
    "commissionMode" "CommissionMode" NOT NULL DEFAULT 'PERCENTAGE',
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "subscriptionFee" INTEGER NOT NULL DEFAULT 3000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_bookingId_key" ON "Conversation"("bookingId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
