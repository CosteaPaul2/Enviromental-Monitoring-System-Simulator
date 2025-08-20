/*
  Warnings:

  - You are about to drop the column `isActive` on the `Sensor` table. All the data in the column will be lost.
  - You are about to drop the column `sensorUnit` on the `SensorReading` table. All the data in the column will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sensorId]` on the table `Sensor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Sensor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `SensorReading` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SensorUnit" AS ENUM ('CELSIUS', 'FAHRENHEIT', 'RH_PERCENTAGE', 'PPM', 'LUX', 'DB');

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- AlterTable
ALTER TABLE "Sensor" DROP COLUMN "isActive",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SensorReading" DROP COLUMN "sensorUnit",
ADD COLUMN     "unit" "SensorUnit" NOT NULL;

-- DropTable
DROP TABLE "Token";

-- DropEnum
DROP TYPE "sensorUnit";

-- CreateTable
CREATE TABLE "AccessToken" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "abilities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessToken_hash_key" ON "AccessToken"("hash");

-- CreateIndex
CREATE INDEX "AccessToken_hash_idx" ON "AccessToken"("hash");

-- CreateIndex
CREATE INDEX "AccessToken_userId_idx" ON "AccessToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensorId_key" ON "Sensor"("sensorId");

-- AddForeignKey
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
