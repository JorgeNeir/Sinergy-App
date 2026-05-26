# Cómo trabajar con agentes de IA en este proyecto

Este documento explica el flujo de trabajo para desarrollar features nuevas usando SDD → BDD → TDD con Claude u otros agentes.

---

## El principio fundamental

> **Un agente sin contexto es un junior sin onboarding.**
> Un agente con contexto es un senior que ya conoce el proyecto.

La diferencia entre pedir "implementa la transferencia de stock" y tener un archivo `docs/specs/almacen.md` es enorme. Con el archivo, Claude ya sabe las reglas, los errores, los contratos, y las decisiones de diseño. Sin él, lo inventa.

---

## Los tres niveles de contexto

### 1. SDD — La Spec (¿Qué construir?)
**Archivo:** `docs/specs/<modulo>.md`

Define el **contrato inmutable** del feature. Lo escribe el desarrollador (o Claude con supervisión) **antes de escribir código**.

Contiene:
- Alcance (qué está dentro, qué está fuera)
- Actores y permisos
- Invariantes del dominio (reglas que nunca pueden romperse)
- Contratos de las funciones (input, output, precondiciones, postcondiciones)
- Decisiones de diseño con su razón

**Criterio para escribirla:** Si puedes responder estas preguntas, tienes una buena spec:
- ¿Qué pasa si un usuario sin permisos llama esta función?
- ¿Qué datos nunca pueden existir en la BD?
- ¿Qué devuelve la función cuando falla?

---

### 2. BDD — Los Escenarios (¿Cómo lo vive el usuario?)
**Archivo:** `docs/bdd/<modulo>.md`

Define **ejemplos concretos** del comportamiento esperado, en lenguaje de negocio.
Se escribe **antes de codificar** la feature.

Formato Given/When/Then:
- **Given:** el estado inicial del sistema
- **When:** la acción que ejecuta el usuario
- **Then:** el resultado observable

**Criterio para escribirlos:**
- Un escenario por cada "camino feliz" (todo sale bien)
- Un escenario por cada error importante
- Un escenario por cada regla de permisos
- Un escenario para los edge cases (valores límite, datos vacíos)

**Regla de oro:** Si el escenario no tiene un "And" en el "Then" que verifique la BD o el estado, está incompleto.

---

### 3. TDD — Los Tests (¿Cómo se verifica?)
**Archivo:** `docs/tests/<modulo>.test.ts`

Traduce los escenarios BDD a código ejecutable. Se escribe **antes o junto** con la implementación.

**El ciclo TDD:**
```
1. Escribe el test (falla en rojo)
2. Escribe el mínimo código para que pase (verde)
3. Refactoriza (limpio)
```

**Por qué importa con agentes:** Claude puede correr los tests y auto-verificar. El prompt se convierte en:
> "Implementa `transferirStock` hasta que todos los tests en `docs/tests/almacen.test.ts` pasen"

Esto es verificable sin que tú revises el código línea a línea.

---

## El flujo completo para una feature nueva

### Ejemplo: "Quiero agregar alertas de stock mínimo"

**Paso 1: Tú escribes la Spec (5-10 min)**
```markdown
# Spec: Alertas de stock mínimo
- Cada producto tiene un campo `stockMinimo: number` (default 3)
- Si stock < stockMinimo → aparece en rojo + badge "⚠ Stock bajo"
- ADMIN recibe notificación al entrar si hay productos bajo mínimo
- STAFF solo ve el color, no la notificación
```

**Paso 2: Le pides a Claude los escenarios**
```
Prompt: "Lee docs/specs/alertas-stock.md y escribe los escenarios BDD 
en formato Given/When/Then para docs/bdd/alertas-stock.md"
```
Claude genera los escenarios → tú los revisas y corriges → apruebas.

**Paso 3: Le pides a Claude los tests**
```
Prompt: "Basándote en docs/bdd/alertas-stock.md, escribe los tests 
unitarios en docs/tests/alertas-stock.test.ts usando el mismo patrón 
que docs/tests/almacen.test.ts"
```

**Paso 4: Le pides a Claude la implementación**
```
Prompt: "Implementa la feature de alertas de stock siguiendo 
docs/specs/alertas-stock.md. Los tests en docs/tests/alertas-stock.test.ts 
deben pasar. Avísame cuando estén todos en verde."
```

**Resultado:** Feature implementada con contratos claros, escenarios documentados y tests que previenen regresiones futuras.

---

## Cómo invocar a Claude de forma efectiva

### ❌ Prompt débil
```
"Agrega validación a la transferencia de stock"
```
Claude inventa reglas. Puede chocar con el diseño existente. Pide aclaraciones.

### ✅ Prompt fuerte
```
"Modifica `transferirStock` en src/actions/almacen.ts.
Reglas en docs/specs/almacen.md, escenarios en docs/bdd/almacen.md.
Asegúrate de que los escenarios 2 y 3 estén cubiertos.
No cambies la firma de la función."
```
Claude tiene: contexto del dominio, criterios de aceptación, restricciones claras.

---

## Estructura de archivos del proyecto

```
docs/
├── HOW_TO_WORK_WITH_AGENTS.md   ← este archivo
├── specs/                        ← SDD: contratos por módulo
│   ├── almacen.md
│   ├── ventas.md
│   ├── planes.md
│   └── informes.md
├── bdd/                          ← BDD: escenarios por módulo
│   ├── almacen.md
│   ├── ventas.md
│   └── planes.md
└── tests/                        ← TDD: tests ejecutables
    ├── almacen.test.ts
    ├── ventas.test.ts
    └── planes.test.ts

memory/
├── MEMORY.md                     ← índice de memoria persistente
└── project_sinergy.md            ← contexto del proyecto Sinergy

CLAUDE.md                         ← instrucciones globales para el agente
```

---

## Qué va en CLAUDE.md vs en docs/specs/

| Contenido | Dónde va |
|-----------|----------|
| "Usa siempre TypeScript strict" | `CLAUDE.md` |
| "Esta versión de Next.js tiene breaking changes" | `CLAUDE.md` / `AGENTS.md` |
| "Los roles son ADMIN y STAFF" | `docs/specs/<modulo>.md` |
| "Stock nunca puede ser negativo" | `docs/specs/almacen.md` |
| "La transferencia debe ser atómica" | `docs/specs/almacen.md` |

**Regla:** `CLAUDE.md` = instrucciones sobre **cómo trabajar**. `docs/specs/` = conocimiento sobre **el dominio del negocio**.

---

## Señales de que tu spec está incompleta

- Claude te hace más de 2 preguntas de aclaración → falta contexto en la spec
- El código de Claude funciona pero viola una regla de negocio → falta un invariante
- Claude sobreescribe algo que no debería → falta una restricción de alcance
- Los tests pasan pero el comportamiento es incorrecto → los escenarios BDD están mal escritos

---

## Evolución de los documentos

Los docs evolucionan con el código. Cuando cambias una regla:
1. Actualiza primero la Spec (SDD)
2. Actualiza los escenarios afectados (BDD)
3. Actualiza o agrega tests (TDD)
4. Solo entonces modifica el código

Esto se llama **"docs as source of truth"**: el código implementa la spec, no al revés.
