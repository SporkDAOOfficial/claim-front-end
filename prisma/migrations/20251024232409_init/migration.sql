/*
  Warnings:

  - The primary key for the `Epoch` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[address,epochId]` on the table `MerkleUserClaims` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `claimDeadline` to the `Epoch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenAddress` to the `Epoch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAllocation` to the `Epoch` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Epoch` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `epochId` on the `MerkleUserClaims` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."MerkleUserClaims" DROP CONSTRAINT "MerkleUserClaims_epochId_fkey";

-- DropIndex
DROP INDEX "public"."Epoch_merkleRoot_idx";

-- DropIndex
DROP INDEX "public"."MerkleUserClaims_address_merkleRoot_key";

-- AlterTable
ALTER TABLE "Epoch" DROP CONSTRAINT "Epoch_pkey",
ADD COLUMN     "claimDeadline" VARCHAR(20) NOT NULL,
ADD COLUMN     "tokenAddress" VARCHAR(42) NOT NULL,
ADD COLUMN     "totalAllocation" VARCHAR(78) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "Epoch_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MerkleUserClaims" ALTER COLUMN "proof" SET DATA TYPE TEXT,
DROP COLUMN "epochId",
ADD COLUMN     "epochId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Epoch_tokenAddress_idx" ON "Epoch"("tokenAddress");

-- CreateIndex
CREATE INDEX "MerkleUserClaims_epochId_idx" ON "MerkleUserClaims"("epochId");

-- CreateIndex
CREATE UNIQUE INDEX "MerkleUserClaims_address_epochId_key" ON "MerkleUserClaims"("address", "epochId");

-- AddForeignKey
ALTER TABLE "MerkleUserClaims" ADD CONSTRAINT "MerkleUserClaims_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "Epoch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
