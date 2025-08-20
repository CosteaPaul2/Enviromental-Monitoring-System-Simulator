-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis" WITH VERSION "1.0";

-- CreateEnum
CREATE TYPE "ShapeType" AS ENUM ('CIRCLE', 'RECTANGLE', 'POLYGON');

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "location" geometry(Point, 4326);

-- CreateTable
CREATE TABLE "Shape" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShapeType" NOT NULL,
    "geometry" geometry(Geometry, 4326) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shape_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shape_geometry_index" ON "Shape" USING GIST ("geometry");

-- CreateIndex
CREATE INDEX "Shape_userId_idx" ON "Shape"("userId");

-- CreateIndex
CREATE INDEX "sensor_location_index" ON "Sensor" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "Shape" ADD CONSTRAINT "Shape_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
