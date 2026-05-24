#!/bin/sh
set -e

# Sync schema (idempotent)
prisma db push --skip-generate --accept-data-loss

# Seed only if no sedes exist (first deploy)
SEDE_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.sede.count()
  .then(n => { process.stdout.write(String(n)); return p.\$disconnect(); })
  .catch(() => { process.stdout.write('0'); });
")

if [ "$SEDE_COUNT" = "0" ]; then
  echo "DB vacía — ejecutando seed inicial..."
  node prisma/seed.cjs
else
  echo "DB con $SEDE_COUNT sede(s) — omitiendo seed."
fi

exec node server.js
