#!/bin/sh
set -e

prisma db push --skip-generate --accept-data-loss

node prisma/seed-sedes.cjs

exec node server.js
