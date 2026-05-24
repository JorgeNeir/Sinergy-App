const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sedes = ['C.C. Hayuelos', 'C.C. Primavera', 'Funza'];
  for (const nombre of sedes) {
    await prisma.sede.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`Sedes garantizadas: ${sedes.join(', ')}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
