import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNovaSettings, saveNovaSettings, getNovaKnowledge, saveNovaKnowledge } from "@/lib/platform.functions";
import { toast } from "sonner";

export function useNovaSettings() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["nova", "settings"],
    queryFn: () => getNovaSettings(),
  });

  const mutation = useMutation({
    mutationFn: saveNovaSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nova", "settings"] });
      toast.success("Configuración de Nova guardada");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return { ...query, save: mutation.mutate, isSaving: mutation.isPending };
}

export function useNovaKnowledge() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["nova", "knowledge"],
    queryFn: () => getNovaKnowledge(),
  });

  const mutation = useMutation({
    mutationFn: saveNovaKnowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nova", "knowledge"] });
      toast.success("Base de conocimiento actualizada");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return { ...query, save: mutation.mutate, isSaving: mutation.isPending };
}

// Mock hook for backward compatibility with NovaDrawer
export function useNova() {
  return {
    data: [
      "¿Cómo va mi saldo?",
      "Crear una campaña SMS",
      "Analizar últimos mensajes"
    ]
  };
}

