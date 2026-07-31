-- projects
DROP POLICY IF EXISTS projects_select_authenticated ON public.projects;
DROP POLICY IF EXISTS projects_insert_authenticated ON public.projects;
DROP POLICY IF EXISTS projects_update_authenticated ON public.projects;
DROP POLICY IF EXISTS projects_delete_authenticated ON public.projects;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
CREATE POLICY projects_open ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- tasks
DROP POLICY IF EXISTS tasks_select_authenticated ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_authenticated ON public.tasks;
DROP POLICY IF EXISTS tasks_update_authenticated ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_authenticated ON public.tasks;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon, authenticated;
GRANT ALL ON public.tasks TO service_role;
CREATE POLICY tasks_open ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- team_members
DROP POLICY IF EXISTS team_members_select_authenticated ON public.team_members;
DROP POLICY IF EXISTS team_members_insert_authenticated ON public.team_members;
DROP POLICY IF EXISTS team_members_update_authenticated ON public.team_members;
DROP POLICY IF EXISTS team_members_delete_authenticated ON public.team_members;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO service_role;
CREATE POLICY team_members_open ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);