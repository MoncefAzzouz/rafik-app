-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "profileImage" TEXT;

-- CreateTable
CREATE TABLE "PortfolioPost" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioPost_professionalId_createdAt_idx" ON "PortfolioPost"("professionalId", "createdAt");

-- AddForeignKey
ALTER TABLE "PortfolioPost" ADD CONSTRAINT "PortfolioPost_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
