import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ProyectoCalculado } from "@/lib/ops";
import { cn } from "@/lib/utils";

function Fila({ etiqueta, peso, valor }: { etiqueta: string; peso: number; valor: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 text-xs">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-foreground">{etiqueta}</span>
          <span className="font-mono text-muted-foreground">
            {valor.toFixed(2)} × {peso}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${valor * 100}%` }} />
        </div>
      </div>
      <span className="self-center font-mono tabular-nums text-foreground">
        {Math.round(valor * peso)}
      </span>
    </div>
  );
}

export function DesgloseScore({ p }: { p: ProyectoCalculado }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">Score {p.score.score}/100</span>
        <span className="text-xs text-muted-foreground">40·S + 30·U + 20·V + 10·P</span>
      </div>
      <div className="space-y-2">
        <Fila etiqueta="S · Severidad (salud)" peso={40} valor={p.score.S} />
        <Fila etiqueta="U · Urgencia (fecha límite)" peso={30} valor={p.score.U} />
        <Fila etiqueta="V · Valor relativo del portafolio" peso={20} valor={p.score.V} />
        <Fila etiqueta="P · Presión de tareas" peso={10} valor={p.score.P} />
      </div>
      {p.score.sinValorRegistrado && (
        <p className="text-xs text-riesgo-foreground">Valor sin registrar: V cuenta como 0.</p>
      )}
    </div>
  );
}

export function ScorePopover({ p }: { p: ProyectoCalculado }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-14 flex-col items-center rounded-md border border-border bg-card px-2.5 py-1 transition-colors hover:bg-accent",
          )}
          aria-label={`Ver desglose del score de ${p.project_code}`}
        >
          <span className="font-mono text-lg leading-none font-semibold tabular-nums">
            {p.score.score}
          </span>
          <span className="text-[10px] tracking-wide text-muted-foreground uppercase">score</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <DesgloseScore p={p} />
      </PopoverContent>
    </Popover>
  );
}
