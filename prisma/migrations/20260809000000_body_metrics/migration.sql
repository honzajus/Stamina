-- AlterTable
ALTER TABLE "users" ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "weightKg" DOUBLE PRECISION,
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "stepCount" INTEGER;
