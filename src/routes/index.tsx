import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, HelpCircle, Search } from "lucide-react";
import { AppShell } from "@/components/ops/AppShell";
import { NuevoProyectoDialog } from "@/components/ops/NuevoProyectoDialog";
import { ProyectoCard } from "@/components/ops/ProyectoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcularPortafolio, PRIORIDADES, TIPOS, type ProyectoCalculado } from "@/lib/ops";
import { useProjects, useTasks, useTeam } from "@/lib/opsData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel operativo — Aztec Ops" },
      {
        name: "description",
        content:
          "Panel operativo diario: qué está bloqueado, qué está en riesgo y a qué dedicar el día en el portafolio de proyectos de automatización con IA.",
      },
      { property: "og:title", content: "Panel operativo — Aztec Ops" },
      {
        property: "og:description",
        content: "Panel operativo diario: qué está bloqueado, qué está en riesgo y a qué dedicar el día en el portafolio de proyectos de automatización con IA.",
      },
    ],
  }),
  component: Panel,
});

type FiltroKPI = "todos" | "activos" | "bloqueados" | "riesgo" | "vencidas" | "sin-paso";

function KPI({
  etiqueta,
  valor,
  activo,
  onClick,
  tono,
}: {
  etiqueta: string;
  valor: number;
  activo: boolean;
  onClick: () => void;
  tono?: "alerta" | "aviso";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/60",
        activo ? "border-primary ring-1 ring-primary" : "border-border",
      )}
    >
      <div
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          tono === "alerta" && "text-bloqueo",
          tono === "aviso" && "text-riesgo-foreground",
        )}
      >
        {valor}
      </div>
      <div className="text-xs text-muted-foreground">{etiqueta}</div>
    </button>
  );
}

function Panel() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: equipo = [] } = useTeam();

  const [kpi, setKpi] = useState<FiltroKPI>("todos");
  const [salud, setSalud] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [prioridad, setPrioridad] = useState("todas");
  const [responsable, setResponsable] = useState("todos");
  const [q, setQ] = useState("");

  const portafolio = useMemo(() => calcularPortafolio(projects, tasks), [projects, tasks]);
  const activos = portafolio.filter((p) => p.status === "Activo");

  const kpis = {
    activos: activos.length,
    bloqueados: activos.filter((p) => p.diag.salud === "Bloqueado").length,
    riesgo: activos.filter((p) => p.diag.salud === "En riesgo").length,
    vencidas: activos.filter((p) => p.diag.vencidas.length > 0).length,
    sinPaso: activos.filter((p) => p.diag.sinSiguientePaso).length,
  };

  const filtrados = portafolio.filter((p) => {
    if (kpi === "activos" && p.status !== "Activo") return false;
    if (kpi === "bloqueados" && !(p.status === "Activo" && p.diag.salud === "Bloqueado")) return false;
    if (kpi === "riesgo" && !(p.status === "Activo" && p.diag.salud === "En riesgo")) return false;
    if (kpi === "vencidas" && !(p.status === "Activo" && p.diag.vencidas.length > 0)) return false;
    if (kpi === "sin-paso" && !(p.status === "Activo" && p.diag.sinSiguientePaso)) return false;
    if (salud !== "todas" && p.diag.salud !== salud) return false;
    if (tipo !== "todos" && p.engagement_type !== tipo) return false;
    if (prioridad !== "todas" && p.priority !== prioridad) return false;
    if (responsable !== "todos" && p.owner !== responsable) return false;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      const campos = `${p.name} ${p.client ?? ""} ${p.project_code}`.toLowerCase();
      if (!campos.includes(t)) return false;
    }
    return true;
  });

  const top5 = portafolio.filter((p) => p.status === "Activo").slice(0, 5);

  const grupos = TIPOS.map((t) => ({
    tipo: t,
    items: filtrados.filter((p) => p.engagement_type === t),
  })).filter((g) => g.items.length > 0);

  const otros = filtrados.filter((p) => !TIPOS.includes(p.engagement_type as never));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel operativo</h1>
          <p className="text-sm text-muted-foreground">
            Qué está bloqueado, qué está en riesgo y a qué dedicar el día.
          </p>
        </div>
        <NuevoProyectoDialog proyectos={projects} equipo={equipo} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPI
          etiqueta="Activos"
          valor={kpis.activos}
          activo={kpi === "activos"}
          onClick={() => setKpi(kpi === "activos" ? "todos" : "activos")}
        />
        <KPI
          etiqueta="Bloqueados"
          valor={kpis.bloqueados}
          tono="alerta"
          activo={kpi === "bloqueados"}
          onClick={() => setKpi(kpi === "bloqueados" ? "todos" : "bloqueados")}
        />
        <KPI
          etiqueta="En riesgo"
          valor={kpis.riesgo}
          tono="aviso"
          activo={kpi === "riesgo"}
          onClick={() => setKpi(kpi === "riesgo" ? "todos" : "riesgo")}
        />
        <KPI
          etiqueta="Con tareas vencidas"
          valor={kpis.vencidas}
          activo={kpi === "vencidas"}
          onClick={() => setKpi(kpi === "vencidas" ? "todos" : "vencidas")}
        />
        <KPI
          etiqueta="Sin siguiente paso"
          valor={kpis.sinPaso}
          activo={kpi === "sin-paso"}
          onClick={() => setKpi(kpi === "sin-paso" ? "todos" : "sin-paso")}
        />
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="size-4 text-riesgo-foreground" /> Requiere acción hoy
        </h2>
        <p className="text-sm text-muted-foreground">Top 5 del portafolio activo por score.</p>
        <div className="mt-3 space-y-2">
          {top5.map((p) => (
            <ProyectoCard key={p.id} p={p} />
          ))}
          {isLoading && <p className="text-sm text-muted-foreground">Cargando portafolio…</p>}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Portafolio completo</h2>
          <ComoPriorizamos activos={activos} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar nombre, cliente o código"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={salud} onValueChange={setSalud}>
            <SelectTrigger>
              <SelectValue placeholder="Salud" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda salud</SelectItem>
              <SelectItem value="Bloqueado">Bloqueado</SelectItem>
              <SelectItem value="En riesgo">En riesgo</SelectItem>
              <SelectItem value="Sano">Sano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo tipo</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prioridad} onValueChange={setPrioridad}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda prioridad manual</SelectItem>
              {PRIORIDADES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={responsable} onValueChange={setResponsable}>
            <SelectTrigger>
              <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo responsable</SelectItem>
              {equipo.map((m) => (
                <SelectItem key={m.id} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(kpi !== "todos" ||
          salud !== "todas" ||
          tipo !== "todos" ||
          prioridad !== "todas" ||
          responsable !== "todos" ||
          q) && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setKpi("todos");
              setSalud("todas");
              setTipo("todos");
              setPrioridad("todas");
              setResponsable("todos");
              setQ("");
            }}
          >
            Limpiar filtros ({filtrados.length} de {portafolio.length})
          </Button>
        )}

        <div className="mt-4 space-y-8">
          {grupos.map((g) => (
            <div key={g.tipo}>
              <h3 className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {g.tipo} · {g.items.length}
              </h3>
              <div className="space-y-2">
                {g.items.map((p) => (
                  <ProyectoCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          ))}
          {otros.length > 0 && (
            <div className="space-y-2">
              {otros.map((p) => (
                <ProyectoCard key={p.id} p={p} />
              ))}
            </div>
          )}
          {!isLoading && filtrados.length === 0 && (
            <p className="text-sm text-muted-foreground">Ningún proyecto coincide con los filtros.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function ComoPriorizamos({ activos }: { activos: ProyectoCalculado[] }) {
  const bloqueados = activos.filter((p) => p.diag.salud === "Bloqueado").length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="size-4" /> ¿Cómo priorizamos?
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 text-sm leading-relaxed">
        <p className="font-semibold">El criterio, en corto</p>
        <p className="mt-2 text-muted-foreground">
          Cada proyecto activo recibe un score de 0 a 100 que combina cuatro cosas: qué tan mal está hoy
          (severidad: bloqueado pesa más que en riesgo), qué tan cerca está su fecha límite (urgencia),
          cuánto dinero hay en juego frente al proyecto más grande del portafolio (valor, normalizado a
          USD) y cuánta presión de trabajo acumula (tareas críticas o altas abiertas y tareas vencidas).
          La fórmula es 40·S + 30·U + 20·V + 10·P. Nada de esto se guarda: se recalcula con los datos
          vivos cada vez que abres el panel. La prioridad manual del equipo se muestra al lado, pero no
          altera el cálculo: es el juicio humano junto a la recomendación del sistema.
        </p>
        <p className="mt-3 text-muted-foreground">
          Hoy {bloqueados} de {activos.length} proyectos activos están bloqueados, así que la severidad
          casi no diferencia: el orden lo terminan decidiendo la urgencia, el valor y la presión de
          tareas. Por eso el desglose S/U/V/P está a la vista y el desempate es explícito (a igual score:
          mayor valor, luego fecha límite más próxima, luego código).
        </p>
      </PopoverContent>
    </Popover>
  );
}
