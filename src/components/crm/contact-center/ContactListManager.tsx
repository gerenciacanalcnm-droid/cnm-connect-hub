import React from "react";
import { Plus, Users, MoreVertical, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { listContactLists } from "@/lib/platform.functions";
import { useServerFn } from "@tanstack/react-start";
import { Skeleton } from "@/components/ui/skeleton";

export function ContactListManager() {
  const listFn = useServerFn(listContactLists);
  
  const { data: lists, isLoading } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => listFn(),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar listas..." className="pl-8" />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Lista
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists?.map((list: any) => (
          <Card key={list.id} className="overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: list.color || '#3b82f6' }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="mt-4 text-lg">{list.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {list.description || "Sin descripción"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">Omnicanal</Badge>
                  <Badge variant="outline" className="text-[10px]">Activa</Badge>
                </div>
                <span className="text-muted-foreground font-medium">0 contactos</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Download className="mr-2 h-3 w-3" /> Exportar
                </Button>
                <Button size="sm" className="w-full text-xs">Ver lista</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
