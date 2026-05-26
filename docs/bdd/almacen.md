# Escenarios: Módulo Almacén
> BDD — Behavior-Driven Development  
> Cada escenario es un test de aceptación en lenguaje de negocio.  
> Formato: Given (contexto) → When (acción) → Then (resultado esperado)

---

## Feature: Transferencia de stock entre sedes

### Escenario 1: Transferencia exitosa
```
Given  el usuario tiene rol ADMIN
And    Primavera tiene 10 unidades de ALFAVEN
And    Hayuelos tiene 5 unidades de ALFAVEN
When   transfiere 3 unidades de ALFAVEN de Primavera a Hayuelos
       con observacion "Reabastecimiento mensual"
Then   Primavera queda con 7 unidades de ALFAVEN
And    Hayuelos queda con 8 unidades de ALFAVEN
And    existe un registro TransferenciaStock con:
         cantidad = 3, origen = Primavera, destino = Hayuelos
```

### Escenario 2: Stock insuficiente en origen
```
Given  el admin está autenticado
And    Primavera tiene 2 unidades de ALFAVEN
When   intenta transferir 5 unidades de ALFAVEN de Primavera a Hayuelos
Then   la acción falla con error "Stock insuficiente"
And    el stock de Primavera permanece en 2
And    el stock de Hayuelos no cambia
And    no se crea registro de TransferenciaStock
```

### Escenario 3: Misma sede origen y destino
```
Given  el admin está autenticado
When   intenta transferir de Primavera a Primavera
Then   la acción falla con error "Sede origen y destino no pueden ser iguales"
```

### Escenario 4: STAFF no puede transferir
```
Given  el usuario tiene rol STAFF
When   intenta ejecutar transferirStock(...)
Then   la acción falla con error "Sin permisos"
And    el stock no cambia
```

### Escenario 5: Destino sin stock previo (upsert)
```
Given  el admin está autenticado
And    Primavera tiene 8 unidades de VENDA
And    Funza NO tiene registro de stock de VENDA
When   transfiere 3 unidades de VENDA de Primavera a Funza
Then   Primavera queda con 5 unidades de VENDA
And    Funza queda con 3 unidades de VENDA (registro creado)
```

---

## Feature: Ajuste de stock (conteo físico)

### Escenario 6: Ajuste absoluto exitoso
```
Given  el admin está autenticado
And    Primavera tiene 10 unidades de BONEVIT
When   ajusta el stock de BONEVIT en Primavera a 7
Then   Primavera tiene exactamente 7 unidades de BONEVIT
```

### Escenario 7: Ajuste a cero es válido
```
Given  Primavera tiene 5 unidades de VENDA
When   el admin ajusta a 0
Then   Primavera tiene 0 unidades de VENDA (no error)
```

### Escenario 8: No se puede ajustar a negativo
```
When   el admin intenta ajustar a -1
Then   la acción falla con error de validación
```

---

## Feature: Crear producto

### Escenario 9: Creación con stock inicial
```
Given  el admin está autenticado
And    no existe un producto llamado "OMEGA 3"
When   crea el producto:
         nombre = "OMEGA 3"
         unidadMedida = "cápsula"
         costo = 30000
         precioVenta = 60000
         stockInicial = { Primavera: 10, Hayuelos: 8 }
Then   existe el producto OMEGA 3 en la BD
And    Primavera tiene 10 unidades de OMEGA 3
And    Hayuelos tiene 8 unidades de OMEGA 3
And    Funza tiene 0 unidades de OMEGA 3 (o no tiene registro)
```

### Escenario 10: Nombre duplicado rechazado
```
Given  ya existe un producto llamado "ALFAVEN"
When   el admin intenta crear otro producto con nombre "ALFAVEN"
Then   la acción falla con error "Ya existe un producto con ese nombre"
```

---

## Feature: Visibilidad por rol en la UI

### Escenario 11: ADMIN ve acciones de mutación
```
Given  el usuario es ADMIN
When   navega a /almacen
Then   ve los botones: "+ Nuevo producto", "Ajustar", "Mover", "Editar"
```

### Escenario 12: STAFF solo ve el inventario
```
Given  el usuario es STAFF
When   navega a /almacen
Then   ve la tabla de productos con stock
And    NO ve botones de "+ Nuevo", "Ajustar", "Mover", "Editar"
```

---

## Criterios de aceptación globales del módulo

- [ ] Ninguna operación de mutación es accesible a STAFF (verificado en server action, no solo en UI)
- [ ] Todas las transferencias son atómicas (pasan o fallan completas)
- [ ] `cantidad` en StockSede nunca llega a ser negativa en la BD
- [ ] Todo error devuelve un mensaje legible en español para mostrar al usuario
