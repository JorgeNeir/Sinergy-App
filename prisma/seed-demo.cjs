'use strict';
// Seed de datos demo desde los Excel de referencia (Marzo-Mayo 2026)
// Idempotente: no hace nada si ya hay ventas en la BD

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Productos reales del almacén con precios medianos observados
const PRODUCTOS = [
  { nombre: 'ALFAVEN',           unidadMedida: 'unidad', costo: 36900,  precioVenta: 80000 },
  { nombre: 'BONEVIT',           unidadMedida: 'unidad', costo: 45000,  precioVenta: 90000 },
  { nombre: 'TRIVEN',            unidadMedida: 'unidad', costo: 54900,  precioVenta: 90000 },
  { nombre: 'ZNOVIC',            unidadMedida: 'unidad', costo: 38000,  precioVenta: 88000 },
  { nombre: 'VENDA',             unidadMedida: 'unidad', costo: 10000,  precioVenta: 15000 },
  { nombre: 'VITAMINA C + ZINC', unidadMedida: 'unidad', costo: 52100,  precioVenta: 89000 },
  { nombre: 'LEGUIS T 3',        unidadMedida: 'unidad', costo: 94000,  precioVenta: 130000 },
  { nombre: 'MELASMA 5',         unidadMedida: 'unidad', costo: 58800,  precioVenta: 112000 },
  { nombre: 'CREMA HIDRATANTE',  unidadMedida: 'unidad', costo: 121400, precioVenta: 205000 },
  { nombre: 'PANTALLA SOLAR',    unidadMedida: 'unidad', costo: 71600,  precioVenta: 135000 },
  { nombre: 'CBD',               unidadMedida: 'unidad', costo: 39000,  precioVenta: 80000 },
  { nombre: 'FM MANCHAS',        unidadMedida: 'unidad', costo: 29400,  precioVenta: 75000 },
  { nombre: 'DRENADOR LINFATICO',unidadMedida: 'unidad', costo: 32000,  precioVenta: 67000 },
  { nombre: 'OMEGA KRILL',       unidadMedida: 'unidad', costo: 45000,  precioVenta: 85000 },
  { nombre: 'VITAMINA D3 + K2',  unidadMedida: 'unidad', costo: 35000,  precioVenta: 70000 },
  { nombre: 'PROBIOTICOS',       unidadMedida: 'unidad', costo: 42000,  precioVenta: 80000 },
  { nombre: 'CREMA ROSACEA',     unidadMedida: 'unidad', costo: 58000,  precioVenta: 115000 },
  { nombre: 'GEL PUNTUAL ACNE',  unidadMedida: 'unidad', costo: 28000,  precioVenta: 55000 },
  { nombre: 'LEGUIS',            unidadMedida: 'unidad', costo: 88000,  precioVenta: 130000 },
  { nombre: 'MAGNESIO',          unidadMedida: 'unidad', costo: 30000,  precioVenta: 60000 },
];

// Stock inicial por sede (unidades)
const STOCK_INICIAL = {
  'Primavera': { 'ALFAVEN': 25, 'BONEVIT': 20, 'TRIVEN': 15, 'ZNOVIC': 10, 'VENDA': 50,
                  'VITAMINA C + ZINC': 12, 'MELASMA 5': 8, 'CREMA HIDRATANTE': 6,
                  'PANTALLA SOLAR': 10, 'CBD': 5, 'FM MANCHAS': 8, 'LEGUIS T 3': 5,
                  'DRENADOR LINFATICO': 6, 'OMEGA KRILL': 8, 'VITAMINA D3 + K2': 10,
                  'PROBIOTICOS': 7, 'CREMA ROSACEA': 5, 'GEL PUNTUAL ACNE': 6,
                  'LEGUIS': 4, 'MAGNESIO': 9 },
  'Hayuelos':  { 'ALFAVEN': 20, 'BONEVIT': 15, 'TRIVEN': 12, 'ZNOVIC': 8, 'VENDA': 40,
                  'VITAMINA C + ZINC': 10, 'MELASMA 5': 6, 'CREMA HIDRATANTE': 4,
                  'PANTALLA SOLAR': 8, 'CBD': 4, 'FM MANCHAS': 6, 'LEGUIS T 3': 4,
                  'DRENADOR LINFATICO': 5, 'OMEGA KRILL': 6, 'VITAMINA D3 + K2': 8,
                  'PROBIOTICOS': 5, 'CREMA ROSACEA': 4, 'GEL PUNTUAL ACNE': 5,
                  'LEGUIS': 3, 'MAGNESIO': 7 },
  'Funza':     { 'ALFAVEN': 10, 'BONEVIT': 8, 'TRIVEN': 6, 'VENDA': 20,
                  'VITAMINA C + ZINC': 5, 'PANTALLA SOLAR': 4, 'MAGNESIO': 4 },
};

async function main() {
  const ventaCount = await prisma.venta.count();
  if (ventaCount > 0) {
    console.log('Demo data already loaded (' + ventaCount + ' ventas). Skipping.');
    return;
  }
  console.log('Loading demo data...');

  // Buscar sedes y usuario admin
  const sedes = await prisma.sede.findMany();
  const sedeMap = {};
  for (const s of sedes) sedeMap[s.nombre] = s.id;

  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
  if (!admin) { console.log('No admin user found. Skipping demo seed.'); return; }
  const adminId = admin.id;

  // ── Productos y stock ──────────────────────────────────────────
  console.log('Creating products...');
  const productoMap = {};
  for (const p of PRODUCTOS) {
    const prod = await prisma.producto.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: { nombre: p.nombre, unidadMedida: p.unidadMedida, costo: p.costo, precioVenta: p.precioVenta },
    });
    productoMap[p.nombre] = prod.id;

    for (const [sedeNombre, stocks] of Object.entries(STOCK_INICIAL)) {
      const sedeId = sedeMap[sedeNombre];
      if (!sedeId || !stocks[p.nombre]) continue;
      await prisma.stockSede.upsert({
        where: { productoId_sedeId: { productoId: prod.id, sedeId } },
        update: {},
        create: { productoId: prod.id, sedeId, cantidad: stocks[p.nombre] },
      });
    }
  }
  console.log('Products OK:', Object.keys(productoMap).length);

  // ── Ventas ────────────────────────────────────────────────────
  const dataPath = path.join(__dirname, 'seed_data.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('Inserting', raw.ventas.length, 'ventas...');
  let ok = 0, skip = 0;
  for (const v of raw.ventas) {
    const sedeId = sedeMap[v.sede];
    if (!sedeId) { skip++; continue; }

    let productoId = null;
    let tratamiento = null;
    if (v.tipo === 'ALMACEN') {
      // Buscar producto por nombre aproximado
      productoId = productoMap[v.detalle] || null;
      if (!productoId) {
        // Buscar coincidencia parcial
        for (const [pNombre, pId] of Object.entries(productoMap)) {
          if (v.detalle.includes(pNombre) || pNombre.includes(v.detalle.split(' ')[0])) {
            productoId = pId; break;
          }
        }
      }
      if (!productoId) { skip++; continue; } // ALMACEN sin producto conocido
    } else {
      tratamiento = v.detalle;
    }

    await prisma.venta.create({
      data: {
        fecha: new Date(v.fecha),
        sedeId,
        pacienteNombre: v.nombre,
        pacienteApellido: v.apellido,
        tipo: v.tipo,
        tratamiento,
        productoId,
        cantidad: productoId ? 1 : null,
        valorPagado: v.valor,
        formaPago: v.pago,
        registradoPorId: adminId,
      },
    });
    ok++;
  }
  console.log('Ventas OK:', ok, '/ Skipped:', skip);

  // ── Planes de tratamiento (depilación) ────────────────────────
  console.log('Inserting', raw.planes.length, 'planes...');
  // Todos los planes de depilacion van a Primavera (sede principal en el Excel)
  const sedeIdPrimavera = sedeMap['Primavera'];
  if (sedeIdPrimavera) {
    for (const p of raw.planes) {
      const plan = await prisma.planTratamiento.create({
        data: {
          sedeId: sedeIdPrimavera,
          pacienteNombre: p.nombre,
          pacienteApellido: p.apellido,
          tipo: 'ESTETICO',
          tratamiento: 'DEPILACION LASER - ' + p.zonas.toUpperCase(),
          totalDosis: p.total_dosis,
          valorTotal: p.valor,
          observaciones: p.obs || null,
          fechaVenta: new Date(p.fecha),
          registradoPorId: adminId,
        },
      });

      // Registrar sesiones completadas
      for (let i = 0; i < p.dosis_hechas; i++) {
        const sesFecha = new Date(p.fecha);
        sesFecha.setDate(sesFecha.getDate() + (i + 1) * 28); // ~1 mes entre sesiones
        await prisma.sesionPlan.create({
          data: {
            planId: plan.id,
            sedeId: sedeIdPrimavera,
            fecha: sesFecha,
            dosisAplicadas: 1,
            notas: 'Sesion ' + (i + 1),
            registradoPorId: adminId,
          },
        });
      }

      // Registrar pago inicial si existe
      if (p.pago_inicial > 0) {
        await prisma.pagoPlan.create({
          data: {
            planId: plan.id,
            monto: p.pago_inicial,
            formaPago: 'EFECTIVO',
            observaciones: 'Pago inicial (50%)',
            registradoPorId: adminId,
          },
        });
      }
    }
  }
  console.log('Planes OK:', raw.planes.length);
  console.log('Demo seed complete!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
