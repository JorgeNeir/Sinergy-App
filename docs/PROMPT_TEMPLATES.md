# Plantillas de Prompts para trabajar con Claude
> Guía práctica de prompt engineering para este proyecto.
> Cada plantilla resuelve un tipo de tarea recurrente.

---

## La estructura base

```
[CONTEXTO]      → archivos/docs que Claude debe leer primero
[TAREA]         → un verbo de acción + objeto específico
[RESTRICCIONES] → qué no tocar, qué reglas respetar
[VERIFICACIÓN]  → criterio objetivo de "está bien hecho"
[FORMATO]       → cómo reportar al terminar
```

**Regla de oro:** Si Claude necesita preguntarte algo para empezar,
tu prompt está incompleto. Cada pregunta = un componente faltante.

---

## Plantilla 1 — Implementar un feature nuevo

```
Lee [docs/specs/<modulo>.md] y [docs/bdd/<modulo>.md].

TAREA: Implementa [nombre del feature] en [archivo(s) objetivo].

RESTRICCIONES:
- Sigue estrictamente las reglas de negocio en la spec sección [N]
- No modifiques [archivos fuera de alcance]
- Requiere rol [ADMIN/STAFF/cualquiera] según la spec

VERIFICACIÓN: Los escenarios [N, M, P] de docs/bdd/<modulo>.md
deben comportarse como se describe.

FORMATO: Al terminar, lista los archivos modificados y
confirma qué escenarios cubre cada cambio.
```

**Ejemplo real:**
```
Lee docs/specs/almacen.md y docs/bdd/almacen.md.

TAREA: Implementa crearProducto() en src/actions/almacen.ts
con soporte para stock inicial por sede.

RESTRICCIONES:
- Solo ADMIN puede crear productos (ver spec sección 2)
- nombre debe ser único — manejar el error de Prisma y relanzarlo
  como "Ya existe un producto con ese nombre"
- No toques AlmacenPage.tsx ni el schema de Prisma

VERIFICACIÓN: Los escenarios 9 y 10 de docs/bdd/almacen.md
deben funcionar correctamente.

FORMATO: Muestra solo las líneas añadidas/cambiadas, no el archivo completo.
```

---

## Plantilla 2 — Corregir un bug

```
CONTEXTO: [describe el síntoma observado]
Archivo relevante: [ruta]
Regla de negocio que se viola: [cita de docs/specs/]

TAREA: Corrige el bug en [función/componente específico].

RESTRICCIONES:
- No cambies la firma de la función
- No refactorices código no relacionado al bug
- La corrección debe ser mínima (menos de [N] líneas si es posible)

VERIFICACIÓN: [describe cómo reproducir el bug y el comportamiento esperado]

FORMATO: Muestra el diff antes/después del cambio.
```

**Ejemplo real:**
```
CONTEXTO: Al transferir stock, si el destino no tiene registro previo
(StockSede no existe), la función falla con "record not found"
en vez de crear el registro.

Archivo: src/actions/almacen.ts, función transferirStock()
Regla violada: docs/specs/almacen.md sección 4 —
"upsert si no existe" en la postcondición de transferirStock

TAREA: Corrige el upsert del stockDestino para crear el registro
si no existe, en lugar de hacer update.

RESTRICCIONES:
- No cambies cómo se maneja el stockOrigen
- La corrección debe estar dentro del $transaction existente

VERIFICACIÓN: El escenario 5 de docs/bdd/almacen.md debe pasar
(Funza sin stock previo recibe 3 unidades exitosamente).

FORMATO: Solo el diff del bloque del $transaction.
```

---

## Plantilla 3 — Agregar un test

```
Lee docs/bdd/<modulo>.md escenario(s) [N].

TAREA: Escribe el test unitario para el escenario [N]
en docs/tests/<modulo>.test.ts siguiendo el patrón
de los tests existentes en ese archivo.

RESTRICCIONES:
- Usa el mismo mock de Prisma que los tests existentes
- Un describe() por feature, un it() por escenario
- Nombramiento: it('hace X cuando Y')

VERIFICACIÓN: El test debe compilar con tsc sin errores.

FORMATO: Solo el bloque it() nuevo, no el archivo completo.
```

---

## Plantilla 4 — Refactorizar sin cambiar comportamiento

```
CONTEXTO: [describe por qué se refactoriza — deuda técnica, legibilidad, etc.]

TAREA: Refactoriza [función/componente] en [archivo].

RESTRICCIONES:
- El comportamiento externo NO debe cambiar
- No modifiques los tests existentes (deben seguir pasando)
- No cambies la interfaz pública (tipos, parámetros, retornos)
- Máximo [N] líneas cambiadas

VERIFICACIÓN: Todos los tests existentes en docs/tests/<modulo>.test.ts
deben seguir pasando.

FORMATO: Explica en 2 líneas qué mejora el refactor, luego el diff.
```

---

## Plantilla 5 — Investigar un fallo en producción

```
CONTEXTO: [describe el error observado — mensaje, stack trace, cuándo ocurre]

TAREA: Diagnostica la causa raíz del error. No corrijas aún.

RESTRICCIONES:
- Solo lee archivos, no hagas cambios
- Revisa logs si están disponibles en [ubicación]

VERIFICACIÓN: Tu diagnóstico debe responder:
1. ¿Qué línea exacta falla?
2. ¿Bajo qué condición específica?
3. ¿Qué regla de docs/specs/ se está violando?

FORMATO:
- Causa raíz: [una línea]
- Archivo y línea: [ruta:número]
- Condición reproductora: [pasos mínimos]
- Corrección propuesta: [una línea, sin implementar]
```

**Ejemplo real:**
```
CONTEXTO: App Runner entra en CREATE_FAILED al deployar.
Log del error: "Cannot find module 'bcryptjs'"
Stack trace: en prisma/seed-sedes.cjs línea 2

TAREA: Diagnostica por qué bcryptjs no está disponible
en el contenedor de producción. No corrijas aún.

RESTRICCIONES: Solo lee Dockerfile, package.json y start.sh

VERIFICACIÓN: Tu diagnóstico debe responder las 3 preguntas del formato.

FORMATO:
- Causa raíz: [una línea]
- Archivo y línea: [ruta:número]
- Condición reproductora: [cuándo ocurre]
- Corrección propuesta: [una línea]
```

---

## Plantilla 6 — Agregar un módulo nuevo completo

Este es el flujo SDD → BDD → TDD completo en prompts encadenados:

```
PROMPT 1 (Spec):
"Voy a agregar el módulo de [nombre]. Aquí están los requisitos
del negocio: [lista en bullets]. Escribe la spec SDD en
docs/specs/<modulo>.md siguiendo el formato de docs/specs/almacen.md."

PROMPT 2 (Escenarios — después de revisar la spec):
"La spec de docs/specs/<modulo>.md está aprobada.
Escribe los escenarios BDD en docs/bdd/<modulo>.md
siguiendo el formato de docs/bdd/almacen.md.
Cubre: el camino feliz, cada caso de error, y cada regla de permisos."

PROMPT 3 (Tests — después de aprobar los escenarios):
"Los escenarios de docs/bdd/<modulo>.md están aprobados.
Escribe el scaffolding de tests en docs/tests/<modulo>.test.ts
siguiendo el patrón de docs/tests/almacen.test.ts."

PROMPT 4 (Implementación):
"Implementa el módulo completo:
- Server actions en src/actions/<modulo>.ts
- Página en src/app/<modulo>/page.tsx
- Componente en src/components/<ModuloPage>.tsx

Sigue docs/specs/<modulo>.md como contrato.
Los escenarios en docs/bdd/<modulo>.md son el criterio de aceptación.
Avísame cuando cada escenario esté cubierto."
```

---

## Tabla de referencia rápida

| Tipo de tarea | Componentes críticos | Puede omitir |
|---------------|---------------------|--------------|
| Bug fix | CONTEXTO + TAREA + VERIFICACIÓN | FORMATO |
| Feature nuevo | CONTEXTO + TAREA + RESTRICCIONES + VERIFICACIÓN | — |
| Refactor | TAREA + RESTRICCIONES + VERIFICACIÓN | CONTEXTO |
| Investigación | CONTEXTO + TAREA + FORMATO | RESTRICCIONES |
| Test | CONTEXTO + TAREA | RESTRICCIONES |

---

## Los 5 errores más comunes

### 1. Tarea sin verbo claro
```
❌ "La transferencia de stock"
✅ "Implementa / Corrige / Refactoriza / Agrega tests para..."
```

### 2. Contexto implícito
```
❌ "Arregla el error que tuvimos antes"
✅ "Lee el error en docs/bdd/almacen.md escenario 2 y corrígelo en..."
```

### 3. Sin restricciones de alcance
```
❌ "Mejora el módulo de almacén"
✅ "Solo modifica src/actions/almacen.ts, no toques el componente React"
```

### 4. Verificación subjetiva
```
❌ "Asegúrate de que funcione bien"
✅ "Los escenarios 2, 3 y 4 de docs/bdd/almacen.md deben comportarse como se describe"
```

### 5. Pedir todo en un prompt
```
❌ "Implementa el módulo de notificaciones con spec, tests, UI y todo"
✅ Prompts encadenados: spec → escenarios → tests → implementación
   (cada uno espera tu aprobación antes de continuar)
```
