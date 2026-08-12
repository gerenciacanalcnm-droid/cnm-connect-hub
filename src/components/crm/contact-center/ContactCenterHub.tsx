import React from "react";
import { PageHeader } from "@/components/common/page-header";
import { ContactsTable } from "@/components/crm/contacts-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Download, Upload, Filter, Search, ShieldCheck, Mail, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ContactListManager } from "./ContactListManager";
import { Badge } from "@/components/ui/badge";
import { ContactFormDialog } from "./ContactFormDialog";
import { CSVImporter } from "./CSVImporter";
import { useServerFn } from "@tanstack/react-start";
import { exportContacts } from "@/lib/contacts.functions";
import { toast } from "sonner";



export function ContactCenterHub() {
  const exportFn = useServerFn(exportContacts);

  const handleExport = async () => {
    try {
      const csv = await exportFn();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contactos-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success("Exportación iniciada");
    } catch {
      toast.error("Error al exportar contactos");
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de Contactos"
        description="Gestión centralizada de identidad y preferencias multicanal."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <CSVImporter>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Button>
            </CSVImporter>
            <ContactFormDialog>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Contacto
              </Button>
            </ContactFormDialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Estadísticas Rápidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contactos</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">0</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp Activos</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">0</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SMS Disponibles</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">0</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opt-out Total</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground text-destructive">0</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">Contactos</TabsTrigger>
            <TabsTrigger value="lists">Listas</TabsTrigger>
            <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
            <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
            <TabsTrigger value="whatsapp">Preferencias WhatsApp</TabsTrigger>
            <TabsTrigger value="sms">Preferencias SMS</TabsTrigger>
            <TabsTrigger value="email">Preferencias Email</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar contactos..." className="pl-8" />
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0 border-none p-0">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <ContactsTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="whatsapp" className="mt-0">
           <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Identidades WhatsApp</CardTitle>
                <CardDescription>Contactos con número normalizado y verificado para Meta Cloud API.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-primary/5 text-primary border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Validación E.164 Activa
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <ContactsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists" className="mt-0">
           <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <ContactListManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="segmentos" className="mt-0">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Segmentos Inteligentes</CardTitle>
              <CardDescription>Segmentación dinámica basada en comportamiento y atributos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Badge>Etiqueta = CLIENTE</Badge>
                  <span className="text-xs text-muted-foreground">AND</span>
                  <Badge variant="outline">Ciudad = Tunja</Badge>
                  <Button size="xs" variant="ghost" className="ml-auto text-xs">Calcular</Button>
                </div>
                <div className="flex flex-col items-center justify-center py-6 text-center border rounded-md border-dashed">
                  <h3 className="text-sm font-semibold">Resultados del segmento</h3>
                  <p className="text-xs text-muted-foreground mt-1">0 contactos cumplen los criterios seleccionados.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etiquetas" className="mt-0">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Gestión de Etiquetas</CardTitle>
              <CardDescription>Organiza tus contactos con etiquetas personalizadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["CLIENTE", "PROSPECTO", "VIP", "INACTIVO"].map(tag => (
                  <div key={tag} className="flex items-center justify-between p-2 border rounded-md group">
                    <span className="text-sm font-medium">{tag}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Nueva etiqueta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="mt-0">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Preferencias SMS</CardTitle>
              <CardDescription>Gestión de Opt-in/Opt-out para el canal SMS.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Preferencias Email</CardTitle>
              <CardDescription>Gestión de suscripciones y limpieza de listas de Email.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Preferencias de Email</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Módulo de Email Marketing en desarrollo.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
