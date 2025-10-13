-- CreateTable
CREATE TABLE "Epoch" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "merkleRoot" VARCHAR(66) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Epoch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerkleUserClaims" (
    "id" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "amount" VARCHAR(78) NOT NULL,
    "proof" VARCHAR(66) NOT NULL,
    "merkleRoot" VARCHAR(66) NOT NULL,
    "epochId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerkleUserClaims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Epoch_merkleRoot_idx" ON "Epoch"("merkleRoot");

-- CreateIndex
CREATE INDEX "Epoch_isActive_idx" ON "Epoch"("isActive");

-- CreateIndex
CREATE INDEX "MerkleUserClaims_address_idx" ON "MerkleUserClaims"("address");

-- CreateIndex
CREATE INDEX "MerkleUserClaims_merkleRoot_idx" ON "MerkleUserClaims"("merkleRoot");

-- CreateIndex
CREATE INDEX "MerkleUserClaims_epochId_idx" ON "MerkleUserClaims"("epochId");

-- CreateIndex
CREATE UNIQUE INDEX "MerkleUserClaims_address_merkleRoot_key" ON "MerkleUserClaims"("address", "merkleRoot");

-- AddForeignKey
ALTER TABLE "MerkleUserClaims" ADD CONSTRAINT "MerkleUserClaims_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "Epoch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
