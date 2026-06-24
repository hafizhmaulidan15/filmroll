-- CreateEnum
CREATE TYPE "RollStatus" AS ENUM ('ACTIVE', 'FINISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('TEMP', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "AspectRatio" AS ENUM ('SQUARE', 'PORTRAIT', 'STORY');

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "visitorToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmStock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "iso" INTEGER NOT NULL,
    "grainStrength" INTEGER NOT NULL,
    "contrastLevel" INTEGER NOT NULL,
    "saturationLevel" INTEGER NOT NULL,
    "fadeAmount" INTEGER NOT NULL,
    "temperatureShift" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilmStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roll" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "filmStockId" TEXT NOT NULL,
    "title" TEXT,
    "aspectRatio" "AspectRatio" NOT NULL,
    "status" "RollStatus" NOT NULL DEFAULT 'ACTIVE',
    "exposureLimit" INTEGER NOT NULL DEFAULT 36,
    "capturedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Roll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "rollId" TEXT NOT NULL,
    "status" "PhotoStatus" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareRoll" (
    "id" TEXT NOT NULL,
    "rollId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareRoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSheet" (
    "id" TEXT NOT NULL,
    "rollId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_visitorToken_key" ON "Visitor"("visitorToken");

-- CreateIndex
CREATE INDEX "Visitor_visitorToken_idx" ON "Visitor"("visitorToken");

-- CreateIndex
CREATE INDEX "Roll_visitorId_idx" ON "Roll"("visitorId");

-- CreateIndex
CREATE INDEX "Roll_filmStockId_idx" ON "Roll"("filmStockId");

-- CreateIndex
CREATE INDEX "Photo_rollId_idx" ON "Photo"("rollId");

-- CreateIndex
CREATE INDEX "Photo_status_idx" ON "Photo"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShareRoll_shareToken_key" ON "ShareRoll"("shareToken");

-- CreateIndex
CREATE INDEX "ShareRoll_shareToken_idx" ON "ShareRoll"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "ContactSheet_rollId_key" ON "ContactSheet"("rollId");

-- AddForeignKey
ALTER TABLE "Roll" ADD CONSTRAINT "Roll_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roll" ADD CONSTRAINT "Roll_filmStockId_fkey" FOREIGN KEY ("filmStockId") REFERENCES "FilmStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "Roll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareRoll" ADD CONSTRAINT "ShareRoll_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "Roll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSheet" ADD CONSTRAINT "ContactSheet_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "Roll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
