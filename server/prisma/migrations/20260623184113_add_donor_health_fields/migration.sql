-- AlterTable
ALTER TABLE "donor_profiles" ADD COLUMN     "chronicIllnessDetails" TEXT,
ADD COLUMN     "geneticDisorderDetails" TEXT,
ADD COLUMN     "hasChronicIllness" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasGeneticDisorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAlcoholic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSmoker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usesDrugs" BOOLEAN NOT NULL DEFAULT false;
