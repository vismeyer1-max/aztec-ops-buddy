import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Salud } from "@/lib/ops";

export function BadgeSalud({ salud }: { salud: Salud }) {
  const estilos: Record<Salud, string> = {
    Bloqueado: "bg-bloqueo/12 text-bloqueo-foreground border-bloqueo/35",
    "En riesgo": "bg-riesgo/18 text-riesgo-foreground border-riesgo/40",
    Sano: "bg-sano/14 text-sano-foreground border-sano/35",
  };
  const punto: Record<Salud, string> = {
    Bloqueado: "bg-bloqueo",
    "En riesgo": "bg-riesgo",
    Sano: "bg-sano",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        estilos[salud],
      )}
    >
      <span className={cn("size-2 rounded-full", punto[salud])} />
      {salud}
    </span>
  );
}

export function BadgeTipo({ tipo }: { tipo: string }) {
  const corto =
    tipo === "Mantenimiento o recurrente" ? "Mantenimiento" : tipo === "Diagnostico" ? "Diagnóstico" : tipo;
  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      {corto}
    </Badge>
  );
}

export function BadgePrioridad({ prioridad }: { prioridad: string | null }) {
  if (!prioridad) return null;
  const estilos: Record<string, string> = {
    Critica: "bg-bloqueo/12 text-bloqueo-foreground border-bloqueo/35",
    Alta: "bg-riesgo/18 text-riesgo-foreground border-riesgo/40",
    Media: "bg-secondary text-secondary-foreground border-border",
    Baja: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        estilos[prioridad] ?? estilos.Media,
      )}
    >
      Prioridad {prioridad === "Critica" ? "Crítica" : prioridad}
    </span>
  );
}

export function Chip({
  children,
  tono = "neutro",
}: {
  children: React.ReactNode;
  tono?: "neutro" | "alerta" | "aviso";
}) {
  const estilos = {
    neutro: "bg-muted text-muted-foreground",
    alerta: "bg-bloqueo/10 text-bloqueo-foreground",
    aviso: "bg-riesgo/15 text-riesgo-foreground",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs", estilos[tono])}>
      {children}
    </span>
  );
}
