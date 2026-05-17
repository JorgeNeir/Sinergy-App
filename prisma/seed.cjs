const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos...');
  await prisma.recetaInsumo.deleteMany();
  await prisma.inventarioSede.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.insumo.deleteMany();
  await prisma.sede.deleteMany();

  console.log('Creando sedes...');
  const hayuelos = await prisma.sede.create({ data: { nombre: 'C.C. Hayuelos' } });
  const primavera = await prisma.sede.create({ data: { nombre: 'C.C. Primavera' } });
  const funza = await prisma.sede.create({ data: { nombre: 'Funza' } });

  console.log('Creando insumos del catálogo...');
  const guante = await prisma.insumo.create({
    data: { nombre: 'Guantes de Nitrilo', unidadMedida: 'par' },
  });
  const acido = await prisma.insumo.create({
    data: { nombre: 'Ácido Hialurónico Reticulado', unidadMedida: 'jeringa' },
  });
  const anestesia = await prisma.insumo.create({
    data: { nombre: 'Anestesia Local', unidadMedida: 'ampolla' },
  });

  console.log('Creando inventarios por sede...');
  // Hayuelos
  await prisma.inventarioSede.create({
    data: { sedeId: hayuelos.id, insumoId: guante.id, stockActual: 100, costoUnitario: 500 },
  });
  await prisma.inventarioSede.create({
    data: { sedeId: hayuelos.id, insumoId: acido.id, stockActual: 10, costoUnitario: 150000 },
  });
  await prisma.inventarioSede.create({
    data: { sedeId: hayuelos.id, insumoId: anestesia.id, stockActual: 20, costoUnitario: 8000 },
  });

  // Primavera
  await prisma.inventarioSede.create({
    data: { sedeId: primavera.id, insumoId: guante.id, stockActual: 80, costoUnitario: 500 },
  });
  await prisma.inventarioSede.create({
    data: { sedeId: primavera.id, insumoId: acido.id, stockActual: 5, costoUnitario: 150000 },
  });
  await prisma.inventarioSede.create({
    data: { sedeId: primavera.id, insumoId: anestesia.id, stockActual: 15, costoUnitario: 8000 },
  });

  // Funza
  await prisma.inventarioSede.create({
    data: { sedeId: funza.id, insumoId: guante.id, stockActual: 50, costoUnitario: 500 },
  });
  await prisma.inventarioSede.create({
    data: { sedeId: funza.id, insumoId: acido.id, stockActual: 8, costoUnitario: 150000 },
  });
  await prisma.inventarioSede.create({
    data: { sedeId: funza.id, insumoId: anestesia.id, stockActual: 10, costoUnitario: 8000 },
  });

  console.log('Creando servicio...');
  const servicio = await prisma.servicio.create({
    data: { nombre: 'Armonización Facial', precioVenta: 800000 },
  });

  await prisma.recetaInsumo.create({
    data: { servicioId: servicio.id, insumoId: guante.id, cantidadNecesaria: 1 },
  });
  await prisma.recetaInsumo.create({
    data: { servicioId: servicio.id, insumoId: acido.id, cantidadNecesaria: 1 },
  });

  console.log('Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });