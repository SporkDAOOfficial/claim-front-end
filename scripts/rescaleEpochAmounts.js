/*
  One-off repair script to rescale an epoch's stored amounts when CSV was uploaded in human units.

  Usage:
    PRISMA_DATABASE_URL="postgres://..." node scripts/rescaleEpochAmounts.js --epochId=1 --decimals=6 [--dry]

  Notes:
  - Multiplier is 10 ** decimals. For USDC, decimals=6 → multiplier=1_000_000.
  - Updates both `Epoch.totalAllocation` and every `MerkleUserClaims.amount` for the epoch.
  - All numeric fields are stored as strings; this script uses BigInt arithmetic for safety.
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../src/generated/prisma');

function parseArgs(argv) {
  const args = {};
  for (const part of argv.slice(2)) {
    const m = part.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else if (part === '--dry') args.dry = 'true';
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const epochId = Number(args.epochId);
  const decimals = Number(args.decimals);
  const dry = args.dry === 'true';

  if (!Number.isInteger(epochId) || epochId <= 0) {
    throw new Error('Missing or invalid --epochId');
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error('Missing or invalid --decimals');
  }

  const multiplier = BigInt(10) ** BigInt(decimals);
  const prisma = new PrismaClient();
  try {
    const epoch = await prisma.epoch.findUnique({ where: { id: epochId } });
    if (!epoch) throw new Error(`Epoch ${epochId} not found`);

    const claims = await prisma.merkleUserClaims.findMany({ where: { epochId } });

    const oldTotal = BigInt(epoch.totalAllocation);
    const newTotal = (oldTotal * multiplier).toString();

    const preview = {
      epochId,
      decimals,
      multiplier: multiplier.toString(),
      totalAllocation: { old: epoch.totalAllocation, new: newTotal },
      claims: claims.slice(0, 5).map(c => ({ id: c.id, old: c.amount, new: (BigInt(c.amount) * multiplier).toString() })),
      claimCount: claims.length,
    };
    console.log('Preview:', preview);

    if (dry) {
      console.log('Dry run complete. No changes written.');
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.epoch.update({ where: { id: epochId }, data: { totalAllocation: newTotal } });
      for (const c of claims) {
        const newAmt = (BigInt(c.amount) * multiplier).toString();
        await tx.merkleUserClaims.update({ where: { id: c.id }, data: { amount: newAmt } });
      }
    });

    console.log(`Rescaled epoch ${epochId}: totalAllocation and ${claims.length} claims updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




