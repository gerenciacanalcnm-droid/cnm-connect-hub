import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { processContactImportBatch } from "@/lib/import.functions";

export function CSVImporter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const processImport = useServerFn(processContactImportBatch);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {} as any);
      });
      setData(rows.filter(r => r.nombre || r.phone));
      setStep(2);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    try {
      const contacts = data.map(r => ({
        first_name: r.nombre || r.first_name || "Sin nombre",
        last_name: r.apellido || r.last_name || "",
        phone: r.telefono || r.phone || "",
        email: r.email || "",
      })).filter(c => c.phone);

      const res = await processImport({ data: { contacts } });
      toast.success(`Importación completada: ${res.imported} nuevos/actualizados`);
      setOpen(false);
      setStep(1);
    } catch {
      toast.error("Error en la importación");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Importar Contactos (CSV)</DialogTitle></DialogHeader>
        
        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm mb-4">Selecciona un archivo .csv</p>
            <Input type="file" accept=".csv" onChange={handleFileUpload} className="max-w-xs" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Se detectaron {data.length} registros. Confirmar importación:</p>
            <div className="max-h-60 overflow-auto border rounded-md p-2">
               <table className="w-full text-xs">
                 <thead><tr>{Object.keys(data[0] || {}).map(h => <th key={h} className="text-left p-1">{h}</th>)}</tr></thead>
                 <tbody>{data.slice(0, 5).map((r, i) => <tr key={i}>{Object.values(r).map((v: any, j) => <td key={j} className="p-1">{v}</td>)}</tr>)}</tbody>
               </table>
            </div>
            <Button onClick={executeImport} className="w-full">Iniciar Importación</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
