// ---------------------------------------------------------------------------
// Aztec Ops — lógica derivada del portafolio.
// Todo aquí es puro y determinista: mismas filas -> mismo resultado.
// Nunca se persiste salud ni score; siempre se calculan desde datos vivos.
// ---------------------------------------------------------------------------

/** Supuesto documentado: tasa fija de conversión COP -> USD usada en todo el sistema. */
export const TASA_COP_USD = 4000;

export type Prioridad = "Critica" | "Alta" | "Media" | "Baja";
export type EstadoProyecto = "Activo" | "Pausado" | "Cerrado";
export type TipoEngagement = "Proyecto" | "Diagnostico" | "Mantenimiento o recurrente";
export type EstadoTarea = "Por hacer" | "En progreso" | "En revision" | "Bloqueada" | "Hecha";
export type Salud = "Bloqueado" | "En riesgo" | "Sano";

export const TIPOS: TipoEngagement[] = ["Proyecto", "Diagnostico", "Mantenimiento o recurrente"];
export const PRIORIDADES: Prioridad[] = ["Critica", "Alta", "Media", "Baja"];
export const ESTADOS_PROYECTO: EstadoProyecto[] = ["Activo", "Pausado", "Cerrado"];
export const ESTADOS_TAREA: EstadoTarea[] = [
  "Por hacer",
  "En progreso",
  "En revision",
  "Bloqueada",
  "Hecha",
];

export type Project = {
  id: string;
  project_code: string;
  name: string;
  client: string | null;
  engagement_type: string;
  project_type_api: string | null;
  stage: string | null;
  status: string;
  priority: string | null;
  owner: string | null;
  owner_role: string | null;
  start_date: string | null;
  target_date: string | null;
  business_value: number | null;
  currency: string | null;
  next_step: string | null;
  blockers: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Task = {
  id: string;
  task_code: string;
  project_code: string;
  title: string;
  detail: string | null;
  assignee: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  dependency: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TeamMember = { id: string; name: string; role: string | null };

// --------------------------- Fechas (siempre 'YYYY-MM-DD' locales) ---------

/** Fecha de "hoy" = fecha local del navegador, como string YYYY-MM-DD. */
export function hoyISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function aFechaLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Diferencia en días entre iso y hoy (positivo = falta, negativo = vencido). */
export function diasHasta(iso: string | null, hoy: string = hoyISO()): number | null {
  if (!iso) return null;
  const ms = aFechaLocal(iso).getTime() - aFechaLocal(hoy).getTime();
  return Math.round(ms / 86400000);
}

/** Formato es-CO: "12 jul 2026". */
export function fmtFecha(iso: string | null): string {
  if (!iso) return "—";
  return aFechaLocal(iso)
    .toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
    .replace(/\./g, "");
}

export function etiquetaVencimiento(iso: string | null, hoy: string = hoyISO()): string {
  const d = diasHasta(iso, hoy);
  if (d === null) return "Sin fecha límite";
  if (d < 0) return `vencido hace ${Math.abs(d)} días`;
  if (d === 0) return "vence hoy";
  return `vence en ${d} días`;
}

// --------------------------- Valor -----------------------------------------

/** Valor normalizado a USD (COP se divide por la tasa fija). */
export function valorUSD(p: Pick<Project, "business_value" | "currency">): number | null {
  if (p.business_value === null || p.business_value === undefined) return null;
  return p.currency === "COP" ? p.business_value / TASA_COP_USD : p.business_value;
}

export function fmtUSD(v: number | null): string {
  if (v === null) return "Sin valor";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

export function fmtMoneda(v: number | null, currency: string | null): string {
  if (v === null) return "Sin valor";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency === "COP" ? "COP" : "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

// --------------------------- Tareas ----------------------------------------

export const esAbierta = (t: Task) => t.status !== "Hecha";
export const esVencida = (t: Task, hoy: string = hoyISO()) =>
  esAbierta(t) && !!t.due_date && t.due_date < hoy;

export function tareasDe(tasks: Task[], code: string): Task[] {
  return tasks.filter((t) => t.project_code === code);
}

const ordenPrioridad: Record<string, number> = { Critica: 0, Alta: 1, Media: 2, Baja: 3 };

// --------------------------- Salud -----------------------------------------

export type Diagnostico = {
  salud: Salud;
  razones: string[];
  abiertas: Task[];
  vencidas: Task[];
  bloqueadas: Task[];
  sinSiguientePaso: boolean;
  siguientePaso: string | null;
  siguientePasoEsSugerido: boolean;
};

export function diagnosticar(p: Project, tasksProyecto: Task[], hoy: string = hoyISO()): Diagnostico {
  const abiertas = tasksProyecto.filter(esAbierta);
  const vencidas = tasksProyecto.filter((t) => esVencida(t, hoy));
  const bloqueadas = abiertas.filter((t) => t.status === "Bloqueada");
  const tieneBlockers = !!p.blockers && p.blockers.trim() !== "";

  const razones: string[] = [];
  let salud: Salud;

  if (tieneBlockers || bloqueadas.length >= 1) {
    salud = "Bloqueado";
    if (tieneBlockers) razones.push("Dependencia externa registrada");
    if (bloqueadas.length === 1) razones.push("1 tarea bloqueada");
    else if (bloqueadas.length > 1) razones.push(`${bloqueadas.length} tareas bloqueadas`);
  } else {
    const enRiesgo: string[] = [];
    if (vencidas.length > 0)
      enRiesgo.push(vencidas.length === 1 ? "1 tarea vencida" : `${vencidas.length} tareas vencidas`);
    if (p.target_date && p.target_date < hoy && p.status === "Activo") {
      enRiesgo.push(`Fecha límite vencida hace ${Math.abs(diasHasta(p.target_date, hoy)!)} días`);
    }
    // Un servicio continuo no exige fecha límite: su cadencia se vigila por tareas.
    if (!p.target_date && p.engagement_type !== "Mantenimiento o recurrente") {
      enRiesgo.push("Sin fecha límite definida");
    }
    if (abiertas.length === 0 && p.status === "Activo") enRiesgo.push("Sin tareas abiertas");

    if (enRiesgo.length > 0) {
      salud = "En riesgo";
      razones.push(...enRiesgo);
    } else {
      salud = "Sano";
    }
  }

  const noBloqueadasAbiertas = abiertas.filter((t) => t.status !== "Bloqueada");
  const nextManual = p.next_step && p.next_step.trim() !== "" ? p.next_step.trim() : null;
  const sinSiguientePaso = !nextManual && noBloqueadasAbiertas.length === 0;

  let siguientePaso = nextManual;
  let siguientePasoEsSugerido = false;
  if (!siguientePaso) {
    const candidatas = [...abiertas].sort((a, b) => {
      const pa = ordenPrioridad[a.priority ?? ""] ?? 4;
      const pb = ordenPrioridad[b.priority ?? ""] ?? 4;
      if (pa !== pb) return pa - pb;
      if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return a.task_code < b.task_code ? -1 : 1;
    });
    if (candidatas.length > 0) {
      siguientePaso = candidatas[0].title;
      siguientePasoEsSugerido = true;
    }
  }

  return {
    salud,
    razones,
    abiertas,
    vencidas,
    bloqueadas,
    sinSiguientePaso,
    siguientePaso,
    siguientePasoEsSugerido,
  };
}

// --------------------------- Score -----------------------------------------

export type Score = {
  score: number;
  S: number;
  U: number;
  V: number;
  P: number;
  sinValorRegistrado: boolean;
};

export function urgencia(target: string | null, hoy: string = hoyISO()): number {
  const d = diasHasta(target, hoy);
  if (d === null) return 0.5;
  if (d < 0) return 1;
  if (d <= 7) return 0.8;
  if (d <= 14) return 0.6;
  if (d <= 30) return 0.4;
  return 0.2;
}

export function calcularScore(
  p: Project,
  diag: Diagnostico,
  maxValorUSD: number,
  hoy: string = hoyISO(),
): Score {
  const S = diag.salud === "Bloqueado" ? 1 : diag.salud === "En riesgo" ? 0.6 : 0;
  const U = urgencia(p.target_date, hoy);
  const v = valorUSD(p);
  const V = v !== null && maxValorUSD > 0 ? v / maxValorUSD : 0;
  const criticasAltas = diag.abiertas.filter(
    (t) => t.priority === "Critica" || t.priority === "Alta",
  ).length;
  const P = Math.min(1, (criticasAltas + diag.vencidas.length) / 6);
  return {
    score: Math.round(40 * S + 30 * U + 20 * V + 10 * P),
    S,
    U,
    V,
    P,
    sinValorRegistrado: v === null,
  };
}

export type ProyectoCalculado = Project & {
  diag: Diagnostico;
  score: Score;
  valor_usd: number | null;
  discrepanciaPrioridad: boolean;
};

/**
 * Calcula y ordena el portafolio. El orden es determinista:
 * score desc -> valorUSD desc -> target_date asc (nulos al final) -> project_code asc.
 */
export function calcularPortafolio(
  projects: Project[],
  tasks: Task[],
  hoy: string = hoyISO(),
): ProyectoCalculado[] {
  const activos = projects.filter((p) => p.status === "Activo");
  const maxValor = activos.reduce((m, p) => Math.max(m, valorUSD(p) ?? 0), 0);

  const calculados = projects.map((p) => {
    const diag = diagnosticar(p, tareasDe(tasks, p.project_code), hoy);
    const score = calcularScore(p, diag, maxValor, hoy);
    const discrepanciaPrioridad =
      ((p.priority === "Critica" || p.priority === "Alta") && score.score < 40) ||
      (p.priority === "Baja" && score.score >= 70);
    return { ...p, diag, score, valor_usd: valorUSD(p), discrepanciaPrioridad };
  });

  return calculados.sort(comparar);
}

export function comparar(a: ProyectoCalculado, b: ProyectoCalculado): number {
  if (b.score.score !== a.score.score) return b.score.score - a.score.score;
  const va = a.valor_usd ?? -1;
  const vb = b.valor_usd ?? -1;
  if (vb !== va) return vb - va;
  const ta = a.target_date ?? "9999-12-31";
  const tb = b.target_date ?? "9999-12-31";
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.project_code < b.project_code ? -1 : 1;
}

/** Los proyectos Pausado/Cerrado no entran al ranking de "requiere acción". */
export function enRanking(p: ProyectoCalculado) {
  return p.status === "Activo";
}

// --------------------------- Carga del equipo -------------------------------

export type CargaPersona = {
  nombre: string;
  rol: string | null;
  proyectosActivos: number;
  tareasAbiertas: number;
  tareasBloqueadas: number;
  criticasAltas: number;
  cuelloDeBotella: boolean;
};

export function calcularCarga(
  miembros: TeamMember[],
  projects: Project[],
  tasks: Task[],
): { filas: CargaPersona[]; promedioAbiertas: number } {
  const nombres = new Set<string>(miembros.map((m) => m.name));
  for (const p of projects) if (p.owner) nombres.add(p.owner);
  for (const t of tasks) if (t.assignee) nombres.add(t.assignee);

  const base = [...nombres].map((nombre) => {
    const rol = miembros.find((m) => m.name === nombre)?.role ?? null;
    const suyas = tasks.filter((t) => t.assignee === nombre);
    const abiertas = suyas.filter(esAbierta);
    return {
      nombre,
      rol,
      proyectosActivos: projects.filter((p) => p.owner === nombre && p.status === "Activo").length,
      tareasAbiertas: abiertas.length,
      tareasBloqueadas: abiertas.filter((t) => t.status === "Bloqueada").length,
      criticasAltas: abiertas.filter((t) => t.priority === "Critica" || t.priority === "Alta").length,
      cuelloDeBotella: false,
    };
  });

  const promedio =
    base.length > 0 ? base.reduce((s, f) => s + f.tareasAbiertas, 0) / base.length : 0;

  const filas = base
    .map((f) => ({ ...f, cuelloDeBotella: promedio > 0 && f.tareasAbiertas > 1.5 * promedio }))
    .sort((a, b) => b.tareasAbiertas - a.tareasAbiertas || a.nombre.localeCompare(b.nombre));

  return { filas, promedioAbiertas: promedio };
}
