-- AlterTable
ALTER TABLE "donor_profiles" ADD COLUMN     "hadTransfusion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "transfusionDate" TIMESTAMP(3);
