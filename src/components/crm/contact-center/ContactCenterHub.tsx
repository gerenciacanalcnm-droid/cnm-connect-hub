import React from "react";
import { PageHeader } from "@/components/common/page-header";
import { ContactsTable } from "@/components/crm/contacts-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Download, Upload, Filter, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ContactListManager } from "./ContactListManager";
import { Badge } from "@/components/ui/badge";



export function ContactCenterHub() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de Contactos"
        description="Gestión centralizada de identidad y preferencias multicanal."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Contacto
            </Button>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Filter className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Módulo de Segmentos</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Próximamente: Filtros avanzados y audiencias dinámicas.</p>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Badge variant="outline" className="h-12 w-12 rounded-full flex items-center justify-center mb-4">
                  #
                </Badge>
                <h3 className="text-lg font-semibold">Gestión de Etiquetas</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Próximamente: Editor centralizado de etiquetas multicanal.</p>
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
