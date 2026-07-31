import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/ops/AppShell";
import { calcularCarga } from "@/lib/ops";
import { useProjects, useTasks, useTeam } from "@/lib/opsData";

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Carga del equipo — Aztec Ops" },
      {
        name: "description",
        content:
          "Carga real por persona: proyectos activos, tareas abiertas, tareas bloqueadas y cuellos de botella del equipo.",
      },
      { property: "og:title", content: "Carga del equipo — Aztec Ops" },
      {
        property: "og:description",
        content: "Distribución de carga calculada en vivo y sugerencia de rebalanceo.",
      },
    ],
  }),
  component: Equipo,
});

function Equipo() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: miembros = [] } = useTeam();

  const { filas, promedioAbiertas } = useMemo(
    () => calcularCarga(miembros, projects, tasks),
    [miembros, projects, tasks],
  );

  const max = Math.max(1, ...filas.map((f) => f.tareasAbiertas));
  const cuellos = filas.filter((f) => f.cuelloDeBotella);
  const menorCarga = [...filas].sort((a, b) => a.tareasAbiertas - b.tareasAbiertas)[0];

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Carga del equipo</h1>
      <p className="text-sm text-muted-foreground">
        Todo se calcula en vivo desde proyectos y tareas. Promedio de tareas abiertas por persona:{" "}
        {promedioAbiertas.toFixed(1)}. Se marca cuello de botella a quien supere 1,5× ese promedio.
      </p>

      {cuellos.length > 0 && menorCarga && (
        <div className="mt-4 rounded-lg border border-riesgo/40 bg-riesgo/10 p-4 text-sm text-riesgo-foreground">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" />
            {cuellos.map((c) => c.nombre).join(", ")} {cuellos.length > 1 ? "son cuellos" : "es cuello"} de
            botella.
          </p>
          <p className="mt-1">
            Sugerencia de rebalanceo: mover tareas críticas o altas de{" "}
            {cuellos[0].nombre} ({cuellos[0].tareasAbiertas} abiertas) hacia {menorCarga.nombre} (
            {menorCarga.tareasAbiertas} abiertas), empezando por las que no dependen de un bloqueo externo.
          </p>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-2">Persona</th>
              <th className="px-4 py-2">Proyectos activos</th>
              <th className="px-4 py-2">Tareas abiertas</th>
              <th className="px-4 py-2">Bloqueadas</th>
              <th className="px-4 py-2">Críticas + Altas</th>
              <th className="px-4 py-2 w-1/3">Carga</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{f.nombre}</div>
                  <div className="text-xs text-muted-foreground">{f.rol ?? "—"}</div>
                  {f.cuelloDeBotella && (
                    <span className="mt-1 inline-flex rounded bg-bloqueo/12 px-2 py-0.5 text-xs text-bloqueo-foreground">
                      Cuello de botella
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{f.proyectosActivos}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{f.tareasAbiertas}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{f.tareasBloqueadas}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{f.criticasAltas}</td>
                <td className="px-4 py-3">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={f.cuelloDeBotella ? "h-full rounded-full bg-bloqueo" : "h-full rounded-full bg-primary"}
                      style={{ width: `${(f.tareasAbiertas / max) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Cargando…</p>}
      </div>
    </AppShell>
  );
}
