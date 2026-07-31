# Aztec Ops

Sistema interno de gestión operativa de proyectos para una agencia de automatización con IA. Responde en una sola pantalla las preguntas de cada mañana: **qué está bloqueado, qué está en riesgo, qué proyecto no tiene siguiente paso claro y a qué hay que dedicar el día.**

La agencia maneja tres tipos de trabajo con dinámicas distintas: **Proyecto** (alcance cerrado y fecha de entrega), **Diagnóstico** (descubrimiento corto para vender un proyecto) y **Mantenimiento o recurrente** (servicio continuo con cadencia).

## Cómo priorizamos

Cada proyecto **activo** recibe un score de 0 a 100 calculado en vivo: `score = 40·S + 30·U + 20·V + 10·P`.

- **S — severidad**: Bloqueado = 1,0 · En riesgo = 0,6 · Sano = 0.
- **U — urgencia** según la fecha límite: vencida = 1,0 · ≤7 días = 0,8 · ≤14 = 0,6 · ≤30 = 0,4 · >30 = 0,2 · sin fecha = 0,5.
- **V — valor**: valor del proyecto en USD dividido por el mayor valor del portafolio activo (sin valor registrado = 0).
- **P — presión de tareas**: `min(1, (tareas abiertas Crítica+Alta + tareas vencidas) / 6)`.

Nada se guarda en base de datos: el score y la salud se recalculan desde los datos vivos en cada carga y tras cada edición. La **prioridad manual** del equipo se muestra al lado pero no altera la fórmula; cuando se contradice con el score aparece el chip "Prioridad manual difiere del score". A igual score el desempate es explícito y determinista: **mayor valor en USD → fecha límite más próxima (nulos al final) → código de proyecto**.

## Reglas de salud

1. **Bloqueado** — el proyecto tiene bloqueos registrados **o** al menos una tarea en estado `Bloqueada`.
2. **En riesgo** (si no está bloqueado) — tiene al menos una tarea vencida, **o** su fecha límite ya pasó estando Activo, **o** no tiene fecha límite (esta condición no aplica a *Mantenimiento o recurrente*: un servicio continuo no exige fecha de cierre), **o** está Activo con 0 tareas abiertas.
3. **Sano** — en cualquier otro caso.

**Sin siguiente paso claro** es un indicador aparte: no hay `next_step` escrito **y** no hay tareas abiertas no bloqueadas. Cuando falta el siguiente paso manual, el sistema sugiere el título de la tarea abierta de mayor prioridad y fecha más próxima, marcada como "sugerido". El paso manual siempre manda.

Definiciones: **tarea abierta** = estado distinto de `Hecha`; **tarea vencida** = abierta con fecha de vencimiento anterior a hoy (comparación de strings `YYYY-MM-DD` con la fecha local del navegador).

## Vistas

- `/` — Panel operativo: KPIs clicables, "Requiere acción hoy" (top 5 por score), portafolio completo agrupado por tipo con filtros y búsqueda, y el popover "¿Cómo priorizamos?".
- `/proyecto/:project_code` — Detalle editable, desglose S/U/V/P y gestión de tareas.
- `/equipo` — Carga por persona calculada en vivo, con detección de cuellos de botella y sugerencia de rebalanceo.

## Cómo correr en local

```bash
npm i
npm run dev
```

Variables de entorno necesarias (archivo `.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

App publicada: _(pendiente de publicar; el enlace se agrega aquí al desplegar)_.

## Supuestos

- Tasa fija **COP → USD = 4.000**. Los valores en COP (PRJ-18, PRJ-20) se muestran normalizados a USD con esa nota visible en la interfaz.
- **"Hoy"** es la fecha local del navegador, no UTC.
- Datos semilla = dataset del reto: 6 personas, 22 proyectos y sus tareas. El dataset llega **sin ninguna tarea en estado `Hecha`** y con **17 de 22 proyectos bloqueados**; por eso la severidad casi no diferencia y el desempate del ranking es explícito.

## Recortes deliberados

- **Sin autenticación**: herramienta interna de un solo equipo.
- **Sin kanban con arrastrar y soltar**: el cambio de estado se hace desde un selector en el detalle.
- **Sin sincronización con la API de origen**: `project_type_api` y `stage` se muestran solo como metadatos de lectura.
