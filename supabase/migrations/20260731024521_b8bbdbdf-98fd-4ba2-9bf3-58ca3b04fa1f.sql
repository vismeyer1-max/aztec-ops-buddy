CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code text UNIQUE NOT NULL,
  name text NOT NULL,
  client text,
  engagement_type text NOT NULL,
  project_type_api text,
  stage text,
  status text NOT NULL DEFAULT 'Activo',
  priority text,
  owner text,
  owner_role text,
  start_date date,
  target_date date,
  business_value numeric,
  currency text DEFAULT 'USD',
  next_step text,
  blockers text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code text UNIQUE NOT NULL,
  project_code text NOT NULL REFERENCES public.projects(project_code) ON UPDATE CASCADE ON DELETE CASCADE,
  title text NOT NULL,
  detail text,
  assignee text,
  priority text,
  status text,
  due_date date,
  dependency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_open" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tasks_open" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "team_members_open" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.team_members (name, role) VALUES
 ('Camila Torres','Delivery'),
 ('Daniel Rojas','Commercial / Delivery'),
 ('Laura Gomez','Delivery'),
 ('Mateo Ruiz','Delivery'),
 ('Santiago Vera','Delivery'),
 ('Andrea Molina','Delivery');

INSERT INTO public.projects (project_code, engagement_type, client, name, project_type_api, stage, status, owner, owner_role, priority, start_date, target_date, business_value, currency, next_step, blockers, notes) VALUES
('PRJ-01','Proyecto','Atlas Foods','Global Contract Management','Automatizacion','Ejecucion','Activo','Daniel Rojas','Commercial / Delivery',NULL,NULL,NULL,28000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Plataforma integral de gestión de contratos para el equipo legal global.'),
('PRJ-02','Mantenimiento o recurrente','Astera Ops','Observability Hub','Consultoria','Ejecucion','Activo','Daniel Rojas','Commercial / Delivery',NULL,NULL,NULL,8000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara. Este servicio exige seguimiento continuo y depuración periódica.','Sistema de observabilidad multicliente (salud + adopción).'),
('PRJ-03','Mantenimiento o recurrente','Lunara Health','Patient Care Assistant','Automatizacion','Ejecucion','Activo','Camila Torres','Delivery',NULL,'2026-03-02','2026-03-02',14000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara. Este servicio exige seguimiento continuo y depuración periódica.','Sistema de reservas y chatbot.'),
('PRJ-04','Proyecto','Pioneer Insurance','Quotation Engine','Automatizacion','Ejecucion','Activo','Camila Torres','Delivery',NULL,'2026-03-02','2026-03-05',25000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Automatización de slips de cotización.'),
('PRJ-05','Mantenimiento o recurrente','Orion Mobility','Multi-Brand Sales Assistant','Automatizacion','Ejecucion','Activo','Laura Gomez','Delivery',NULL,'2026-02-25','2026-03-16',3000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara. Este servicio exige seguimiento continuo y depuración periódica.','Proyecto creado vía API.'),
('PRJ-06','Mantenimiento o recurrente','Nova Recovery','Recovery and Compensation Ops','Automatizacion','Ejecucion','Activo','Laura Gomez','Delivery',NULL,'2026-02-27','2026-03-16',30000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara. Este servicio exige seguimiento continuo y depuración periódica.','Proyecto creado vía API.'),
('PRJ-07','Proyecto','Velora Credit','Credit Assistant','Consultoria','Ejecucion','Activo','Camila Torres','Delivery',NULL,'2026-04-08','2026-04-13',NULL,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (SUE).'),
('PRJ-08','Proyecto','Vector Partners','Messaging Qualification Engine','Consultoria','Ejecucion','Activo','Camila Torres','Delivery',NULL,NULL,'2026-04-27',35000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (QUI).'),
('PRJ-09','Proyecto','Ferroline Industrial','Industrial OCR Quoter','Consultoria','Ejecucion','Activo','Camila Torres','Delivery',NULL,NULL,'2026-05-13',22000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (TMX).'),
('PRJ-10','Proyecto','Pulse Creative','Commercial Image Pipeline','Consultoria','Ejecucion','Activo','Camila Torres','Delivery',NULL,NULL,'2026-05-15',18000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (NEQ).'),
('PRJ-11','Proyecto','Civica Regional','Public Service Desk','Consultoria','Ejecucion','Activo','Laura Gomez','Delivery',NULL,NULL,'2026-05-21',15000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (GOB).'),
('PRJ-12','Proyecto','Northfield Proteins','Plant Operations Automation','Consultoria','Ejecucion','Activo','Mateo Ruiz','Delivery',NULL,NULL,'2026-05-22',9000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (NTB).'),
('PRJ-13','Diagnostico','HelioGrid Energy','Commercial Automation Discovery','Consultoria','Descubrimiento','Activo','Santiago Vera','Delivery',NULL,NULL,'2026-05-22',12000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (SVT).'),
('PRJ-14','Diagnostico','Orion Mobility','Vehicle Photography Platform','Automatizacion','Descubrimiento','Activo','Mateo Ruiz','Delivery',NULL,'2026-04-16',NULL,2000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Plataforma para que concesionarios tomen fotos y reciban fotos profesionales.'),
('PRJ-15','Diagnostico','Orion Mobility','Legal Documents Assistant','Automatizacion','Descubrimiento','Activo','Laura Gomez','Delivery',NULL,'2026-04-16',NULL,1000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto creado vía API.'),
('PRJ-16','Diagnostico','Orion Mobility','Lead Acquisition System','Automatizacion','Descubrimiento','Activo','Mateo Ruiz','Delivery',NULL,'2026-04-16',NULL,1000,'USD',NULL,'Hay tareas vencidas sin una ruta de cierre clara.','Proyecto creado vía API.'),
('PRJ-17','Mantenimiento o recurrente','Astera Ops','Billing Reconciliation Bot','Automatizacion','Ejecucion','Activo','Daniel Rojas','Commercial / Delivery',NULL,'2026-03-02','2026-08-28',11000,'USD',NULL,NULL,'Conciliación automática de facturación contra el ERP del cliente.'),
('PRJ-18','Proyecto','Andes Retail','Inventory Forecasting','Automatizacion','Ejecucion','Activo','Mateo Ruiz','Delivery',NULL,'2026-05-04','2026-09-12',85000000,'COP',NULL,NULL,'Pronóstico de inventario por punto de venta con reposición sugerida.'),
('PRJ-19','Proyecto','Meridian Legal','Contract Clause Extractor','Consultoria','Ejecucion','Activo','Andrea Molina','Delivery',NULL,'2026-06-01','2026-09-30',19000,'USD',NULL,NULL,'Extracción de cláusulas y obligaciones desde contratos en PDF.'),
('PRJ-20','Mantenimiento o recurrente','Nova Recovery','Claims Status Notifier','Automatizacion','Ejecucion','Activo','Laura Gomez','Delivery',NULL,'2026-04-20','2026-10-15',120000000,'COP',NULL,NULL,'Notificación automática de estado de reclamaciones por WhatsApp.'),
('PRJ-21','Proyecto','Cobalt Logistics','Route Optimization Pilot','Consultoria','Ejecucion','Activo','Santiago Vera','Delivery',NULL,'2025-11-10','2026-02-10',16000,'USD',NULL,NULL,'Piloto de optimización de rutas para flota regional.'),
('PRJ-22','Proyecto','Vector Partners','Messaging Qualification Engine (Fase 2)','Consultoria','Ejecucion','Activo','Camila Torres','Delivery',NULL,NULL,'2026-04-27',38000,'USD',NULL,'Hay dependencias externas o accesos pendientes. Hay tareas vencidas sin una ruta de cierre clara.','Proyecto sincronizado desde la plataforma de desarrollo (QUI).');