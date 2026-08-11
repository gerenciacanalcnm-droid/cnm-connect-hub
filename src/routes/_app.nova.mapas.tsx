import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listConversationMaps, upsertConversationMap, deleteConversationMap } from '@/lib/platform.functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Play, Pause, Trash2, Map, ChevronRight, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

export const Route = createFileRoute('/_app/nova/mapas')({
  component: NovaMapsPage,
});

function NovaMapsPage() {
  const queryClient = useQueryClient();
  const { data: maps } = useSuspenseQuery({
    queryKey: ['conversation_maps'],
    queryFn: () => listConversationMaps(),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertConversationMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation_maps'] });
      toast.success('Mapa actualizado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversationMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation_maps'] });
      toast.success('Mapa eliminado');
    }
  });

  const handleToggleStatus = (map: any) => {
    const newStatus = map.status === 'ACTIVO' ? 'PAUSADO' : 'ACTIVO';
    upsertMutation.mutate({ data: { ...map, status: newStatus } } as any);
  };


  const handleCreate = () => {
    upsertMutation.mutate({
      data: {
        name: 'Nuevo Mapa de Conversación',
        description: 'Descripción del flujo',
        status: 'BORRADOR',
        nodes: [
          { id: 'node_1', type: 'MENSAJE', data: { text: 'Hola, ¿en qué podemos ayudarte?' } }
        ],
        edges: []
      }
    } as any);
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-nova-blue-light">Mapas de Conversación</h1>
          <p className="text-muted-foreground">Define el flujo de atención inteligente de CNM Nova.</p>
        </div>
        <Button onClick={handleCreate} className="bg-nova-blue hover:bg-nova-blue-dark">
          <Plus className="mr-2 h-4 w-4" /> Nuevo mapa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maps.map((map: any) => (
          <Card key={map.id} className="bg-nova-card border-nova-border/50 hover:border-nova-blue/30 transition-all group overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Map className="h-4 w-4 text-nova-blue" />
                {map.name}
              </CardTitle>
              <Badge 
                variant={map.status === 'ACTIVO' ? 'default' : 'secondary'}
                className={map.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
              >
                {map.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {map.description || 'Sin descripción.'}
              </p>
              
              <div className="flex items-center text-xs text-muted-foreground mb-6">
                <Badge variant="outline" className="mr-2">
                  {map.nodes?.length || 0} Nodos
                </Badge>
                <span>Actualizado: {format(new Date(map.updated_at), 'dd MMM, HH:mm', { locale: es })}</span>
              </div>

              <div className="flex justify-between items-center gap-2 pt-4 border-t border-nova-border/30">
                <Button variant="ghost" size="sm" className="hover:text-nova-blue" onClick={() => handleToggleStatus(map)}>
                  {map.status === 'ACTIVO' ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {map.status === 'ACTIVO' ? 'Pausar' : 'Activar'}
                </Button>
                
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-nova-blue">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => { if(confirm('¿Eliminar mapa?')) deleteMutation.mutate({ id: map.id }) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {maps.length === 0 && (
          <Card className="col-span-full border-dashed bg-transparent border-nova-border/50 py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-nova-blue/10 flex items-center justify-center mb-4">
                <Map className="h-6 w-6 text-nova-blue" />
              </div>
              <h3 className="text-lg font-medium">No hay mapas creados</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Comienza creando tu primer flujo de conversación para que Nova sepa cómo responder.
              </p>
              <Button onClick={handleCreate} variant="outline" className="mt-6 border-nova-blue text-nova-blue hover:bg-nova-blue/10">
                Crear primer mapa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
