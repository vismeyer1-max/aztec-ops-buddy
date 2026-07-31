import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/ops/AppShell";
import { BadgePrioridad, BadgeSalud, BadgeTipo, Chip } from "@/components/ops/Badges";
import { DesgloseScore } from "@/components/ops/ScorePopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calcularPortafolio,
  ESTADOS_PROYECTO,
  ESTADOS_TAREA,
  etiquetaVencimiento,
  fmtFecha,
  fmtMoneda,
  fmtUSD,
  PRIORIDADES,
  TASA_COP_USD,
  type Project,
  type Task,
} from "@/lib/ops";
import {
  useActualizarProyecto,
  useActualizarTarea,
  useCrearTarea,
  useProjects,
  useTasks,
  useTeam,
} from "@/lib/opsData";

export const Route = createFileRoute("/proyecto/$project_code")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.project_code} — Aztec Ops` },
      {
        name: "description",
        content: `Detalle operativo del proyecto ${params.project_code}: salud, score, tareas y siguiente paso.`,
      },
      { property: "og:title", content: `${params.project_code} — Aztec Ops` },
      {
        property: "og:description",
        content: "Detalle operativo: salud derivada, desglose del score y tareas del proyecto.",
      },
    ],
  }),
  component: DetalleProyecto,
});

const SIN = "__sin__";

function DetalleProyecto() {
  const { project_code } = Route.useParams();
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: equipo = [] } = useTeam();

  const portafolio = useMemo(() => calcularPortafolio(projects, tasks), [projects, tasks]);
  const p = portafolio.find((x) => x.project_code === project_code);
  const tareas = tasks.filter((t) => t.project_code === project_code);

  const actualizar = useActualizarProyecto();
  const [form, setForm] = useState<Partial<Project> | null>(null);

  useEffect(() => {
    if (p && !form) {
      setForm({
        owner: p.owner,
        status: p.status,
        priority: p.priority,
        start_date: p.start_date,
        target_date: p.target_date,
        business_value: p.business_value,
        currency: p.currency,
        next_step: p.next_step,
        blockers: p.blockers,
        notes: p.notes,
      });
    }
  }, [p, form]);

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Cargando proyecto…</p>
      </AppShell>
    );
  }

  if (!p || !form) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">No existe el proyecto {project_code}.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-primary underline">
          Volver al panel
        </Link>
      </AppShell>
    );
  }

  const guardar = async () => {
    try {
      await actualizar.mutateAsync({
        code: p.project_code,
        cambios: {
          ...form,
          owner_role: equipo.find((m) => m.name === form.owner)?.role ?? null,
          business_value:
            form.business_value === null || form.business_value === undefined || form.business_value === ("" as never)
              ? null
              : Number(form.business_value),
        },
      });
      toast.success("Cambios guardados. Salud y score recalculados.");
    } catch (e) {
      toast.error("No se pudo guardar", { description: (e as Error).message });
    }
  };

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">{p.project_code}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
        <BadgeTipo tipo={p.engagement_type} />
        <BadgePrioridad prioridad={p.priority} />
        <BadgeSalud salud={p.diag.salud} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {p.client ?? "Sin cliente"} · {fmtFecha(p.target_date)} · {etiquetaVencimiento(p.target_date)} ·
        Última actualización {p.updated_at ? fmtFecha(p.updated_at.slice(0, 10)) : "—"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.diag.razones.map((r) => (
          <Chip key={r} tono={p.diag.salud === "Bloqueado" ? "alerta" : "aviso"}>
            {r}
          </Chip>
        ))}
        {p.diag.sinSiguientePaso && <Chip tono="aviso">Sin siguiente paso</Chip>}
        {p.discrepanciaPrioridad && <Chip tono="aviso">Prioridad manual difiere del score</Chip>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Ficha del proyecto</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Responsable</Label>
              <Select
                value={form.owner ?? SIN}
                onValueChange={(v) => setForm({ ...form, owner: v === SIN ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN}>Sin asignar</SelectItem>
                  {equipo.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status ?? "Activo"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_PROYECTO.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridad manual</Label>
              <Select
                value={form.priority ?? SIN}
                onValueChange={(v) => setForm({ ...form, priority: v === SIN ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN}>Sin prioridad</SelectItem>
                  {PRIORIDADES.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de inicio</Label>
              <Input
                type="date"
                value={form.start_date ?? ""}
                onChange={(e) => setForm({ ...form, start_date: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha límite</Label>
              <Input
                type="date"
                value={form.target_date ?? ""}
                onChange={(e) => setForm({ ...form, target_date: e.target.value || null })}
              />
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <div className="space-y-1.5">
                <Label>Valor de negocio</Label>
                <Input
                  type="number"
                  value={form.business_value ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, business_value: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select value={form.currency ?? "USD"} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="COP">COP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Siguiente paso</Label>
              <Input
                value={form.next_step ?? ""}
                placeholder={
                  p.diag.siguientePasoEsSugerido && p.diag.siguientePaso
                    ? `Sugerido: ${p.diag.siguientePaso}`
                    : "Define el siguiente paso"
                }
                onChange={(e) => setForm({ ...form, next_step: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bloqueos</Label>
              <Textarea
                value={form.blockers ?? ""}
                onChange={(e) => setForm({ ...form, blockers: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notas</Label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={guardar} disabled={actualizar.isPending}>
              {actualizar.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Metadatos de origen: {p.project_type_api ?? "—"} · etapa {p.stage ?? "—"}
            </span>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <DesgloseScore p={p} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h3 className="font-semibold">Valor</h3>
            <p className="mt-1 text-muted-foreground">
              Registrado: {fmtMoneda(p.business_value, p.currency)}
            </p>
            <p className="text-muted-foreground">Normalizado: {fmtUSD(p.valor_usd)}</p>
            {p.currency === "COP" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Convertido a la tasa fija de {TASA_COP_USD.toLocaleString("es-CO")} COP/USD.
              </p>
            )}
          </div>
        </aside>
      </div>

      <TareasProyecto codigo={p.project_code} tareas={tareas} equipo={equipo.map((m) => m.name)} />
    </AppShell>
  );
}

function TareasProyecto({
  codigo,
  tareas,
  equipo,
}: {
  codigo: string;
  tareas: Task[];
  equipo: string[];
}) {
  const actualizar = useActualizarTarea();
  const crear = useCrearTarea();
  const [nueva, setNueva] = useState({ title: "", assignee: SIN, priority: "Media", due_date: "" });

  const cambiar = async (id: string, cambios: Partial<Task>) => {
    try {
      await actualizar.mutateAsync({ id, cambios });
    } catch (e) {
      toast.error("No se pudo actualizar la tarea", { description: (e as Error).message });
    }
  };

  const agregar = async () => {
    if (!nueva.title.trim()) return;
    const codigoTarea = `${codigo}-T${Date.now().toString().slice(-6)}`;
    try {
      await crear.mutateAsync({
        task_code: codigoTarea,
        project_code: codigo,
        title: nueva.title.trim(),
        assignee: nueva.assignee === SIN ? null : nueva.assignee,
        priority: nueva.priority,
        status: "Por hacer",
        due_date: nueva.due_date || null,
      });
      setNueva({ title: "", assignee: SIN, priority: "Media", due_date: "" });
      toast.success("Tarea creada");
    } catch (e) {
      toast.error("No se pudo crear la tarea", { description: (e as Error).message });
    }
  };

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-semibold">Tareas ({tareas.length})</h2>

      <div className="mt-3 space-y-2">
        {tareas.map((t) => (
          <div
            key={t.id}
            className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center"
          >
            <div className="min-w-0">
              <p className={t.status === "Hecha" ? "text-muted-foreground line-through" : "font-medium"}>
                {t.title}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{t.task_code}</span> · {t.assignee ?? "Sin asignar"}
                {t.dependency ? ` · depende de ${t.dependency}` : ""}
              </p>
            </div>
            <Select value={t.status ?? "Por hacer"} onValueChange={(v) => cambiar(t.id, { status: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_TAREA.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={t.priority ?? "Media"} onValueChange={(v) => cambiar(t.id, { priority: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-40"
              value={t.due_date ?? ""}
              onChange={(e) => cambiar(t.id, { due_date: e.target.value || null })}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={t.status === "Hecha"}
              onClick={() => cambiar(t.id, { status: "Hecha" })}
            >
              <Check className="size-4" /> Hecha
            </Button>
          </div>
        ))}
        {tareas.length === 0 && (
          <p className="text-sm text-muted-foreground">Este proyecto no tiene tareas registradas.</p>
        )}
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
        <Input
          placeholder="Nueva tarea"
          value={nueva.title}
          onChange={(e) => setNueva({ ...nueva, title: e.target.value })}
        />
        <Select value={nueva.assignee} onValueChange={(v) => setNueva({ ...nueva, assignee: v })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN}>Sin asignar</SelectItem>
            {equipo.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={nueva.priority} onValueChange={(v) => setNueva({ ...nueva, priority: v })}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORIDADES.map((x) => (
              <SelectItem key={x} value={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-40"
          value={nueva.due_date}
          onChange={(e) => setNueva({ ...nueva, due_date: e.target.value })}
        />
        <Button onClick={agregar} disabled={crear.isPending || !nueva.title.trim()}>
          <Plus className="size-4" /> Agregar
        </Button>
      </div>
    </section>
  );
}
