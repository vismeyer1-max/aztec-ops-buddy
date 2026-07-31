-- projects
DROP POLICY IF EXISTS projects_open ON public.projects;
REVOKE ALL ON public.projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
CREATE POLICY projects_select_authenticated ON public.projects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY projects_insert_authenticated ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY projects_update_authenticated ON public.projects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY projects_delete_authenticated ON public.projects FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- tasks
DROP POLICY IF EXISTS tasks_open ON public.tasks;
REVOKE ALL ON public.tasks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
CREATE POLICY tasks_select_authenticated ON public.tasks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY tasks_insert_authenticated ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY tasks_update_authenticated ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY tasks_delete_authenticated ON public.tasks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- team_members
DROP POLICY IF EXISTS team_members_open ON public.team_members;
REVOKE ALL ON public.team_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
CREATE POLICY team_members_select_authenticated ON public.team_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY team_members_insert_authenticated ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY team_members_update_authenticated ON public.team_members FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY team_members_delete_authenticated ON public.team_members FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);