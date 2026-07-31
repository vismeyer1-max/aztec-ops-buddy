import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Users } from "lucide-react";
import { TASA_COP_USD } from "@/lib/ops";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded bg-primary font-mono text-sm text-primary-foreground">
              A
            </span>
            <span className="font-semibold tracking-tight">Aztec Ops</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Gestión operativa de proyectos
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary"
            >
              <LayoutDashboard className="size-4" /> Panel
            </Link>
            <Link
              to="/equipo"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary"
            >
              <Users className="size-4" /> Carga del equipo
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted-foreground">
        Los valores en COP se muestran normalizados a USD con una tasa fija de{" "}
        {TASA_COP_USD.toLocaleString("es-CO")} COP por USD (supuesto del sistema). "Hoy" = fecha local
        del navegador.
      </footer>
    </div>
  );
}
