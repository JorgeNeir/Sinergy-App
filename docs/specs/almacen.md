# Spec: Módulo Almacén
> SDD — Spec-Driven Development  
> Este archivo define el CONTRATO del módulo. Claude debe leerlo antes de tocar cualquier código de almacén.

---

## 1. Alcance

El módulo Almacén gestiona el inventario de productos por sede.  
Existe stock separado por sede — un producto puede tener cantidades distintas en Primavera, Hayuelos y Funza.

**Fuera de alcance:** ventas (ver `docs/specs/ventas.md`), compras a proveedores, vencimientos.

---

## 2. Actores y permisos

| Actor | Puede hacer |
|-------|-------------|
| ADMIN | Todo: crear productos, ajustar stock, transferir, ver reportes |
| STAFF | Solo lectura: ver productos y stock disponible |

Regla crítica: **cualquier mutación de stock requiere rol ADMIN**.  
Si un STAFF intenta mutar stock → lanzar error `"Sin permisos"`.

---

## 3. Entidades y reglas invariantes

### Producto
- `nombre` es único en toda la BD (case-sensitive).
- `activo: false` oculta el producto de la UI pero conserva el historial.
- `precioVenta` y `costo` siempre positivos.

### StockSede
- Relación `[productoId, sedeId]` es única (un registro por combinación).
- `cantidad` **nunca puede ser negativa**. Si una operación lo dejaría negativo → error.
- Stock cero es válido y diferente a "no existe registro".

### TransferenciaStock
- Registro inmutable. Nunca se edita ni borra.
- `sedeOrigenId !== sedeDestinoId` — nunca transferir a la misma sede.
- `cantidad > 0` siempre.

---

## 4. Contratos de las Server Actions

### `getProductos()`
- **Auth:** cualquier usuario autenticado
- **Returns:** lista de productos activos con stock por sede
- **Ordenado por:** nombre ascendente

### `crearProducto(data)`
- **Auth:** ADMIN
- **Input:**
  ```ts
  {
    nombre: string        // requerido, único
    unidadMedida: string  // requerido (ej: "unidad", "caja", "ml")
    costo: number         // requerido, > 0
    precioVenta: number   // requerido, > 0
    stockInicial?: Record<sedeId, cantidad>  // opcional
  }
  ```
- **Efecto:** crea Producto + un StockSede por cada entrada en stockInicial
- **Error si:** nombre ya existe, costo o precioVenta <= 0

### `actualizarStock(productoId, sedeId, cantidad)`
- **Auth:** ADMIN
- **Semántica:** reemplaza el stock absoluto (no incrementa)
- **Input:** cantidad >= 0
- **Efecto:** upsert de StockSede

### `transferirStock(data)`
- **Auth:** ADMIN
- **Input:**
  ```ts
  {
    productoId: string
    sedeOrigenId: string
    sedeDestinoId: string
    cantidad: number       // > 0
    observaciones?: string
  }
  ```
- **Precondición:** `stockOrigen.cantidad >= cantidad`
- **Efecto (atómico en una transacción):**
  1. `stockOrigen.cantidad -= cantidad`
  2. `stockDestino.cantidad += cantidad` (upsert si no existe)
  3. Crea `TransferenciaStock` con timestamp y adminId
- **Errores:**
  - `"Stock insuficiente"` si origen no tiene suficiente
  - `"Sede origen y destino no pueden ser iguales"`
  - `"Cantidad debe ser mayor a cero"`

### `editarProducto(id, data)`
- **Auth:** ADMIN
- **Campos editables:** nombre, unidadMedida, costo, precioVenta, activo
- **No editable:** id, stocks (se editan por separado)

---

## 5. Reglas de UI (para componentes React)

- Stock = 0 → mostrar en **rojo**
- Stock > 0 y < 3 → mostrar en **amarillo** (alerta)
- Stock >= 3 → mostrar en **verde**
- Solo ADMIN ve los botones de acción (Ajustar, Transferir, Editar, Nuevo)
- STAFF ve la tabla pero sin acciones de mutación

---

## 6. Decisiones de diseño registradas

| Decisión | Razón |
|----------|-------|
| Stock absoluto en `actualizarStock`, no delta | Evita errores de doble-submit; el admin ajusta al conteo físico real |
| Transferencia en `$transaction` | Garantiza consistencia; si falla el decremento no se hace el incremento |
| TransferenciaStock es inmutable | Auditoría: siempre se puede reconstruir el historial |
| `nombre` único en Producto | Evita duplicados confusos; el admin debe ser explícito si quiere variantes |
