#!/bin/sh
set -e

prisma db push --skip-generate --accept-data-loss

node prisma/seed-sedes.cjs

node prisma/seed-demo.cjs

exec node server.js
