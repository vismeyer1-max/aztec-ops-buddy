import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, User } from "lucide-react";
import { BadgePrioridad, BadgeSalud, BadgeTipo, Chip } from "@/components/ops/Badges";
import { ScorePopover } from "@/components/ops/ScorePopover";
import { etiquetaVencimiento, fmtFecha, fmtUSD, type ProyectoCalculado } from "@/lib/ops";

export function ProyectoCard({ p }: { p: ProyectoCalculado }) {
  const vencido = p.target_date ? p.target_date < new Date().toISOString().slice(0, 10) : false;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{p.project_code}</span>
            <Link
              to="/proyecto/$project_code"
              params={{ project_code: p.project_code }}
              className="truncate font-semibold text-foreground hover:underline"
            >
              {p.name}
            </Link>
            <BadgeTipo tipo={p.engagement_type} />
            <BadgePrioridad prioridad={p.priority} />
            <BadgeSalud salud={p.diag.salud} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{p.client ?? "Sin cliente"}</span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3" /> {p.owner ?? "Sin responsable"}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3" />
              {fmtFecha(p.target_date)} · {etiquetaVencimiento(p.target_date)}
            </span>
            <span>{fmtUSD(p.valor_usd)}{p.currency === "COP" ? " (convertido)" : ""}</span>
          </div>

          <div className="mt-2 text-sm">
            {p.diag.sinSiguientePaso ? (
              <span className="inline-flex items-center gap-1 font-medium text-riesgo-foreground">
                <AlertTriangle className="size-3.5" /> Sin siguiente paso
              </span>
            ) : (
              <span className={p.diag.siguientePasoEsSugerido ? "text-muted-foreground italic" : ""}>
                {p.diag.siguientePaso}
                {p.diag.siguientePasoEsSugerido && (
                  <span className="ml-1 rounded bg-muted px-1 text-[10px] not-italic">sugerido</span>
                )}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.diag.razones.map((r) => (
              <Chip key={r} tono={p.diag.salud === "Bloqueado" ? "alerta" : "aviso"}>
                {r}
              </Chip>
            ))}
            {p.discrepanciaPrioridad && <Chip tono="aviso">Prioridad manual difiere del score</Chip>}
            {vencido && p.status !== "Activo" && <Chip>{p.status}</Chip>}
            {p.status !== "Activo" && <Chip>{p.status} · fuera del ranking</Chip>}
          </div>
        </div>

        <ScorePopover p={p} />
      </div>
    </div>
  );
}
