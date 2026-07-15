-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('FOOD', 'TAXI', 'BOTH');

-- CreateEnum
CREATE TYPE "RideCancelledBy" AS ENUM ('CLIENT', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FraudAlertType" AS ENUM ('DRIVER_EXCESSIVE_CANCELLATIONS', 'CLIENT_EXCESSIVE_CANCELLATIONS', 'PAIR_COLLUSION', 'LATE_CANCEL_PATTERN');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "service" "ServiceKind" NOT NULL DEFAULT 'FOOD',
ADD COLUMN     "vehicleColor" TEXT,
ADD COLUMN     "vehicleModel" TEXT;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "taxiBaseFare" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "taxiCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "taxiMinFare" INTEGER NOT NULL DEFAULT 150,
ADD COLUMN     "taxiPerKm" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "TaxiRide" (
    "id" TEXT NOT NULL,
    "rideNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupWilaya" TEXT,
    "pickupCommune" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION,
    "estimatedFare" INTEGER,
    "proposedFare" INTEGER,
    "agreedFare" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "driverId" TEXT,
    "commissionPercentSnapshot" DOUBLE PRECISION,
    "commissionAmount" INTEGER,
    "driverEarnings" INTEGER,
    "cancelledBy" "RideCancelledBy",
    "cancelReason" TEXT,
    "cancelStage" TEXT,
    "clientRating" DOUBLE PRECISION,
    "driverRating" DOUBLE PRECISION,
    "acceptedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxiRide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxiRideOffer" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxiRideOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "type" "FraudAlertType" NOT NULL,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'MEDIUM',
    "driverId" TEXT,
    "clientPhone" TEXT,
    "clientName" TEXT,
    "rideId" TEXT,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxiRide_rideNumber_key" ON "TaxiRide"("rideNumber");

-- CreateIndex
CREATE INDEX "TaxiRide_driverId_status_idx" ON "TaxiRide"("driverId", "status");

-- CreateIndex
CREATE INDEX "TaxiRide_clientPhone_idx" ON "TaxiRide"("clientPhone");

-- CreateIndex
CREATE UNIQUE INDEX "TaxiRideOffer_rideId_driverId_key" ON "TaxiRideOffer"("rideId", "driverId");

-- CreateIndex
CREATE INDEX "FraudAlert_driverId_isResolved_idx" ON "FraudAlert"("driverId", "isResolved");

-- CreateIndex
CREATE INDEX "FraudAlert_clientPhone_isResolved_idx" ON "FraudAlert"("clientPhone", "isResolved");

-- AddForeignKey
ALTER TABLE "TaxiRide" ADD CONSTRAINT "TaxiRide_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRideOffer" ADD CONSTRAINT "TaxiRideOffer_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "TaxiRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRideOffer" ADD CONSTRAINT "TaxiRideOffer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
