-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('HAS_INVOICE', 'NO_INVOICE', 'NOT_REQUIRED');

-- AlterEnum
ALTER TYPE "PromoScope" ADD VALUE 'TRUCK';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TRUCKER';

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "truckBaseFare" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "truckCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 12,
ADD COLUMN     "truckMinFare" INTEGER NOT NULL DEFAULT 800,
ADD COLUMN     "truckPerKm" DOUBLE PRECISION NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE "TruckType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "capacityLabel" TEXT,
    "priceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "surcharge" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckCategoryType" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "truckTypeId" TEXT NOT NULL,

    CONSTRAINT "TruckCategoryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "truckCode" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "plate" TEXT,
    "truckTypeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "wilaya" TEXT,
    "commune" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cancellationCount" INTEGER NOT NULL DEFAULT 0,
    "profileImage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "truckTypeId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupWilaya" TEXT,
    "pickupCommune" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "scheduledType" TEXT NOT NULL DEFAULT 'now',
    "scheduledDate" TEXT,
    "estimatedPrice" INTEGER,
    "promoCodeId" TEXT,
    "promoDiscount" INTEGER DEFAULT 0,
    "agreedPrice" INTEGER,
    "commissionPercentSnapshot" DOUBLE PRECISION,
    "commissionAmount" INTEGER,
    "driverEarnings" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "truckId" TEXT,
    "cancelledBy" "RideCancelledBy",
    "cancelReason" TEXT,
    "cancelStage" TEXT,
    "clientRating" DOUBLE PRECISION,
    "acceptedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "loadingAt" TIMESTAMP(3),
    "transitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TruckType_name_key" ON "TruckType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TruckCategory_name_key" ON "TruckCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TruckCategoryType_categoryId_truckTypeId_key" ON "TruckCategoryType"("categoryId", "truckTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_userId_key" ON "Truck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_truckCode_key" ON "Truck"("truckCode");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_phone_key" ON "Truck"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "TruckOrder_orderNumber_key" ON "TruckOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "TruckOrder_truckId_status_idx" ON "TruckOrder"("truckId", "status");

-- CreateIndex
CREATE INDEX "TruckOrder_clientPhone_idx" ON "TruckOrder"("clientPhone");

-- AddForeignKey
ALTER TABLE "TruckCategoryType" ADD CONSTRAINT "TruckCategoryType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TruckCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckCategoryType" ADD CONSTRAINT "TruckCategoryType_truckTypeId_fkey" FOREIGN KEY ("truckTypeId") REFERENCES "TruckType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_truckTypeId_fkey" FOREIGN KEY ("truckTypeId") REFERENCES "TruckType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckOrder" ADD CONSTRAINT "TruckOrder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TruckCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckOrder" ADD CONSTRAINT "TruckOrder_truckTypeId_fkey" FOREIGN KEY ("truckTypeId") REFERENCES "TruckType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckOrder" ADD CONSTRAINT "TruckOrder_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
