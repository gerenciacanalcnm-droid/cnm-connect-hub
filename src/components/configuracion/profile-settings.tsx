import { useState } from "react";
import { toast } from "sonner";
import { Camera, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-users";
import { Loader } from "@/components/common/loader";

export function ProfileSettings() {
  const { data: user, isLoading } = useCurrentUser();
  const [saving, setSaving] = useState(false);

  if (isLoading || !user) return <Loader />;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Perfil actualizado");
    }, 600);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-2xl gradient-brand text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center">
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>
            Estos datos aparecerán en tus reportes y notificaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nombre completo</Label>
                <Input id="p-name" defaultValue={user.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Correo electrónico</Label>
                <Input id="p-email" type="email" defaultValue={user.email} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Teléfono</Label>
                <Input id="p-phone" placeholder="+52 55 0000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-role">Cargo</Label>
                <Input id="p-role" placeholder="Marketing Manager" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-bio">Bio</Label>
              <Textarea id="p-bio" rows={3} placeholder="Cuéntanos sobre ti..." />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
