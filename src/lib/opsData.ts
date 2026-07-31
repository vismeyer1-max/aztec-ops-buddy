import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project, Task, TeamMember } from "@/lib/ops";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("project_code");
      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("task_code");
      if (error) throw error;
      return (data ?? []) as unknown as Task[];
    },
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as TeamMember[];
    },
  });
}

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };
}

export function useActualizarProyecto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async ({ code, cambios }: { code: string; cambios: Partial<Project> }) => {
      const { error } = await supabase
        .from("projects")
        .update(cambios as never)
        .eq("project_code", code);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useCrearProyecto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (nuevo: Partial<Project>) => {
      const { error } = await supabase.from("projects").insert(nuevo as never);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useActualizarTarea() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: Partial<Task> }) => {
      const { error } = await supabase
        .from("tasks")
        .update(cambios as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useCrearTarea() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (nueva: Partial<Task>) => {
      const { error } = await supabase.from("tasks").insert(nueva as never);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}
