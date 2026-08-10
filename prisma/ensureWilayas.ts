// Idempotent: inserts the 58 Algerian wilayas if missing, WITHOUT touching any other
// data or overwriting prices you've already set. Safe to run on production.
//   npx ts-node prisma/ensureWilayas.ts
import prisma from '../src/lib/prisma';
import { ALGERIA_WILAYAS } from '../src/lib/wilayas';

async function main() {
  let created = 0;
  for (const w of ALGERIA_WILAYAS) {
    const res = await prisma.truckWilaya.upsert({
      where: { code: w.code },
      // keep the existing name/price if the row already exists
      update: {},
      // sensible starter prices on first insert (admin edits them later)
      create: { code: w.code, name: w.name, price: w.code === 19 ? 500 : w.code === 16 ? 5000 : 2000 },
    });
    if (res) created++;
  }
  const total = await prisma.truckWilaya.count();
  console.log(`Wilayas ensured. Table now has ${total} wilayas.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
