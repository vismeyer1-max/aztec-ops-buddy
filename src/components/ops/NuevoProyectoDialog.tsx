import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PRIORIDADES, TIPOS, type Project, type TeamMember } from "@/lib/ops";
import { useCrearProyecto } from "@/lib/opsData";

const SIN = "__sin__";

export function NuevoProyectoDialog({
  proyectos,
  equipo,
}: {
  proyectos: Project[];
  equipo: TeamMember[];
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    project_code: "",
    name: "",
    client: "",
    engagement_type: "",
    owner: SIN,
    priority: SIN,
    status: "Activo",
    start_date: "",
    target_date: "",
    business_value: "",
    currency: "USD",
    next_step: "",
    notes: "",
  });
  const crear = useCrearProyecto();

  const codigoRepetido = proyectos.some(
    (p) => p.project_code.toLowerCase() === f.project_code.trim().toLowerCase(),
  );
  const valido = f.project_code.trim() !== "" && f.name.trim() !== "" && f.engagement_type !== "" && !codigoRepetido;

  const avisos: string[] = [];
  if (!f.target_date && f.engagement_type !== "Mantenimiento o recurrente")
    avisos.push("Sin fecha límite: nacerá marcado En riesgo.");
  if (!f.next_step.trim()) avisos.push("Sin siguiente paso: nacerá marcado como Sin siguiente paso.");

  const guardar = async () => {
    if (!valido) return;
    try {
      await crear.mutateAsync({
        project_code: f.project_code.trim(),
        name: f.name.trim(),
        client: f.client.trim() || null,
        engagement_type: f.engagement_type,
        owner: f.owner === SIN ? null : f.owner,
        owner_role: equipo.find((m) => m.name === f.owner)?.role ?? null,
        priority: f.priority === SIN ? null : f.priority,
        status: f.status,
        start_date: f.start_date || null,
        target_date: f.target_date || null,
        business_value: f.business_value ? Number(f.business_value) : null,
        currency: f.currency,
        next_step: f.next_step.trim() || null,
        notes: f.notes.trim() || null,
      } as Partial<Project>);
      toast.success(`Proyecto ${f.project_code} creado`);
      setOpen(false);
      setF({ ...f, project_code: "", name: "", client: "", next_step: "", notes: "" });
    } catch (e) {
      toast.error("No se pudo crear el proyecto", { description: (e as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo proyecto</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>El código y el tipo son obligatorios. La prioridad es opcional.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Código *</Label>
            <Input
              value={f.project_code}
              onChange={(e) => setF({ ...f, project_code: e.target.value })}
              placeholder="PRJ-23"
            />
            {codigoRepetido && <p className="text-xs text-destructive">Ese código ya existe.</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de trabajo *</Label>
            <Select value={f.engagement_type} onValueChange={(v) => setF({ ...f, engagement_type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Select value={f.owner} onValueChange={(v) => setF({ ...f, owner: v })}>
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
            <Label>Prioridad manual</Label>
            <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN}>Sin prioridad</SelectItem>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              value={f.start_date}
              onChange={(e) => setF({ ...f, start_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha límite</Label>
            <Input
              type="date"
              value={f.target_date}
              onChange={(e) => setF({ ...f, target_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor de negocio</Label>
            <Input
              type="number"
              value={f.business_value}
              onChange={(e) => setF({ ...f, business_value: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="COP">COP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Siguiente paso</Label>
            <Input value={f.next_step} onChange={(e) => setF({ ...f, next_step: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notas</Label>
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
        </div>

        {avisos.length > 0 && (
          <div className="rounded-md border border-riesgo/40 bg-riesgo/10 p-3 text-xs text-riesgo-foreground">
            {avisos.map((a) => (
              <p key={a}>⚠ {a}</p>
            ))}
            <p className="mt-1">Puedes guardar de todas formas.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!valido || crear.isPending}>
            {crear.isPending ? "Guardando…" : "Crear proyecto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
