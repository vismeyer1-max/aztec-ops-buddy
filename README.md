# Aztec Ops

Sistema interno de gestión operativa de proyectos para una agencia de automatización con IA.

## Qué es y qué problema resuelve

La agencia maneja tres tipos de trabajo con dinámicas distintas: **Proyecto** (alcance cerrado y fecha de entrega), **Diagnóstico** (descubrimiento corto para vender un proyecto) y **Mantenimiento o recurrente** (servicio continuo con cadencia). El dolor real del equipo no es la falta de datos, sino tener que reconstruir cada mañana el mismo diagnóstico a mano: qué está bloqueado, qué está en riesgo, qué proyecto no tiene un siguiente paso claro y a qué dedicar el día. Aztec Ops responde eso en una sola pantalla, calculando todo en vivo desde `projects` y `tasks` — no hay estados guardados a mano ni semáforos escritos en duro.

## Cómo priorizamos

Cada proyecto activo recibe un **score de 0 a 100**:

```
score = 40·S + 30·U + 20·V + 10·P
```

- **S — severidad:** Bloqueado = 1.0, En riesgo = 0.6, Sano = 0.
- **U — urgencia** por fecha límite: vencida = 1.0; ≤7 días = 0.8; ≤14 = 0.6; ≤30 = 0.4; >30 = 0.2; sin fecha = 0.5.
- **V — valor:** valor del proyecto en USD dividido por el mayor valor del portafolio activo. Sin valor registrado = 0, y se marca con un aviso.
- **P — presión de tareas:** `min(1, (tareas abiertas Crítica+Alta + tareas vencidas) / 6)`.

Los proyectos `Pausado` o `Cerrado` no entran al ranking. A igual score el desempate es explícito y determinista: **valor USD descendente, luego fecha límite ascendente con los nulos al final, luego código de proyecto** — el orden nunca depende de cómo lleguen las filas de la base, así que el ranking es idéntico entre recargas.

Una aclaración honesta sobre el estado actual del portafolio: **17 de los 22 proyectos están bloqueados**, así que la severidad no alcanza a diferenciarlos y el orden lo terminan decidiendo la urgencia, el valor y la presión de tareas. Por eso el desglose S/U/V/P está siempre a la vista y por eso el desempate es explícito en vez de quedar implícito.

La **prioridad manual** del proyecto no altera la fórmula: es el juicio humano puesto al lado de la recomendación del sistema. Cuando ambos se contradicen (manual Crítica/Alta con score < 40, o manual Baja con score ≥ 70) la interfaz lo señala en vez de esconderlo.

## Reglas de salud

Se evalúan en orden; la primera que se cumple manda:

1. **Bloqueado** — el campo `blockers` no está vacío **o** hay al menos una tarea en estado `Bloqueada`.
2. **En riesgo** (si no está bloqueado) — hay al menos una tarea vencida, **o** la fecha límite ya pasó estando activo, **o** no tiene fecha límite, **o** está activo con cero tareas abiertas.
   La condición de "sin fecha límite" **no** aplica a `Mantenimiento o recurrente`: un servicio continuo no exige fecha de cierre, su cadencia ya se vigila por sus tareas.
3. **Sano** — en el resto de los casos.

Cada veredicto viene con sus razones legibles ("Fecha límite vencida hace 170 días", "2 tareas bloqueadas", "Sin tareas abiertas").

**Sin siguiente paso claro** es un flag independiente de la salud: se activa cuando `next_step` está vacío **y** no hay tareas abiertas sin bloquear. Si no hay un siguiente paso escrito a mano, el sistema sugiere la tarea abierta de mayor prioridad y fecha más próxima, marcada como *sugerido*; el paso manual siempre manda sobre la sugerencia.

## Vistas

- `/` — panel operativo: KPIs clicables, "Requiere acción hoy" (top 5 por score), portafolio agrupado por tipo con filtros y búsqueda, y el popover "¿Cómo priorizamos?".
- `/proyecto/:project_code` — detalle editable de todos los campos, desglose del score y gestión de las tareas del proyecto.
- `/equipo` — carga por persona calculada en vivo, con detección de cuello de botella y sugerencia de rebalanceo.

## Cómo correr en local

```bash
npm i
npm run dev
```

Variables de entorno necesarias:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

El esquema completo, las políticas RLS y los triggers están en `supabase/migrations/`, así que la base se puede levantar desde cero sin depender de este proyecto.

**App publicada:** _(pendiente)_

## Supuestos

- Tasa fija **4.000 COP = 1 USD** para normalizar los valores de negocio. Está declarada como constante en `src/lib/ops.ts` y visible como nota al pie donde se muestran valores convertidos.
- **"Hoy" es la fecha local del navegador.** Las fechas se comparan siempre como cadenas `YYYY-MM-DD`, nunca como objetos `Date` en UTC — comparar en UTC corre el día y rompe el conteo de vencidas.
- Los datos semilla son el **dataset del reto**, cargado tal cual. Llega **sin ninguna tarea en estado `Hecha`** y con 17 de 22 proyectos bloqueados; ambas cosas afectan lo que se ve al abrir el panel por primera vez.

## Recortes deliberados

- **Sin autenticación.** Es una herramienta interna de un solo equipo, así que las políticas RLS son permisivas para el rol anónimo. La contrapartida es que cualquiera con la URL puede escribir; en un despliegue real esto se cierra con login antes que cualquier otra cosa.
- **Sin kanban con arrastrar y soltar.** El cambio de estado se hace desde el detalle del proyecto.
- **Sin sincronización con la API de origen.** Los datos se cargan una vez; no hay proceso de ingesta continua.
