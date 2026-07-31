# Aztec Ops

## Qué es y qué problema resuelve

Aztec Ops es el sistema interno de gestión operativa de proyectos de una agencia de automatización con IA. Cada mañana el equipo necesita responder cuatro preguntas: qué está bloqueado, qué está en riesgo, qué proyecto no tiene siguiente paso claro y a qué dedicar el día. El panel responde esas cuatro preguntas en una sola pantalla, sobre tres tipos de trabajo con dinámicas distintas: **Proyecto** (alcance cerrado con fecha de entrega), **Diagnóstico** (descubrimiento corto para vender un proyecto) y **Mantenimiento o recurrente** (servicio continuo con cadencia).

## Cómo priorizamos

Cada proyecto **activo** recibe un score de 0 a 100 calculado en vivo: `score = 40·S + 30·U + 20·V + 10·P`.

- **S — severidad**: Bloqueado = 1,0 · En riesgo = 0,6 · Sano = 0.
- **U — urgencia** según `target_date`: vencida = 1,0 · ≤7 días = 0,8 · ≤14 = 0,6 · ≤30 = 0,4 · >30 = 0,2 · sin fecha = 0,5.
- **V — valor**: valor del proyecto en USD dividido por el mayor valor del portafolio activo (sin valor registrado = 0).
- **P — presión de tareas**: `min(1, (tareas abiertas Crítica+Alta + tareas vencidas) / 6)`.

A igual score el desempate es explícito y determinista: **mayor valor en USD → `target_date` más próxima (nulos al final) → `project_code` ascendente**.

Con el dataset actual **17 de 22 proyectos están bloqueados**, así que la severidad queda saturada y casi no diferencia: el orden lo terminan decidiendo la urgencia, el valor y la presión de tareas. Por eso el desglose S/U/V/P está a la vista en cada tarjeta. Nada se persiste: el score y la salud se recalculan desde los datos vivos en cada carga y tras cada edición. La **prioridad manual** del equipo se muestra al lado pero no altera la fórmula; cuando se contradice con el score aparece el chip "Prioridad manual difiere del score".

## Reglas de salud

La jerarquía se evalúa en este orden y la primera que aplica gana:

1. **Bloqueado** — el campo `blockers` no está vacío **o** existe al menos una tarea en estado `Bloqueada`.
2. **En riesgo** (solo si no está bloqueado) — al menos una tarea vencida, **o** `target_date < hoy` estando Activo, **o** no tiene `target_date` (esta condición no aplica a *Mantenimiento o recurrente*: un servicio continuo no exige fecha de cierre), **o** está Activo con 0 tareas abiertas.
3. **Sano** — en cualquier otro caso.

**Sin siguiente paso claro** es un flag independiente de la salud: no hay `next_step` escrito **y** no hay tareas abiertas no bloqueadas. Cuando falta el paso manual, el sistema sugiere el título de la tarea abierta de mayor prioridad y fecha más próxima, marcada como "sugerido"; el paso manual siempre manda.

Definiciones: **tarea abierta** = estado distinto de `Hecha`; **tarea vencida** = abierta con `due_date` anterior a hoy.

## Cómo correr en local

```bash
npm i
npm run dev
```

Variables de entorno necesarias en el archivo `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

El esquema completo (tablas `projects`, `tasks`, `team_members`, triggers de `updated_at` y políticas RLS) está en `supabase/migrations/`, así que la base se puede levantar desde cero aplicando esas migraciones.

## App publicada

**App publicada:** _(pendiente)_

## Supuestos

- Tasa fija **COP → USD = 4.000**. Los valores en COP se muestran normalizados a USD con esa nota visible en la interfaz.
- **"Hoy"** es la fecha local del navegador, no UTC. Todas las fechas se comparan como strings `'YYYY-MM-DD'`, nunca como objetos `Date` en UTC.
- Los datos semilla son el dataset del reto: 6 personas, 22 proyectos y 82 tareas. Llegan **sin ninguna tarea en estado `Hecha`** y con **17 de 22 proyectos bloqueados**.

## Recortes deliberados

- **Sin autenticación**: es una herramienta interna de un solo equipo, con RLS permisiva para el rol `anon`.
- **Sin kanban con arrastrar y soltar**: el cambio de estado de una tarea se hace desde un selector en el detalle del proyecto.
- **Sin sincronización con la API de origen**: `project_type_api` y `stage` se muestran solo como metadatos de lectura.
