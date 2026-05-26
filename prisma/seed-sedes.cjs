const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Sedes fijas
  const sedes = ['C.C. Hayuelos', 'C.C. Primavera', 'Funza'];
  for (const nombre of sedes) {
    await prisma.sede.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`Sedes garantizadas: ${sedes.join(', ')}`);

  // Usuarios base
  const usuarios = [
    {
      email: process.env.SUPERUSER_EMAIL || 'admin@sinergy.com',
      nombre: 'Administrador',
      rol: 'ADMIN',
      password: process.env.SUPERUSER_PASSWORD || 'Admin.Sinergy26',
    },
    {
      email: 'staff@sinergy.com',
      nombre: 'Staff Sinergy',
      rol: 'STAFF',
      password: process.env.STAFF_PASSWORD || 'Staff.Sinergy26',
    },
  ];

  for (const u of usuarios) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { passwordHash, nombre: u.nombre, rol: u.rol },
      create: {
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        passwordHash,
      },
    });
    console.log(`Usuario garantizado: ${u.email} (${u.rol})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
