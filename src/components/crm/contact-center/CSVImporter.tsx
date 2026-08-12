import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { analyzeContactImport, importContactsBatch } from "@/lib/import.functions";
import { listContactLists } from "@/lib/platform.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IMPORT_FIELDS,
  type ImportFieldKey,
  type PreparedRow,
  type RejectedRow,
  autoMapHeaders,
  buildErrorsCsv,
  parseCsv,
  validateRows,
} from "@/utils/csv-import";

const NONE = "__none__";
const BATCH_SIZE = 100;

type FinalResult = {
  created: number;
  updated: number;
  associated: number;
  errors: number;
  errorRows: RejectedRow[];
};

export function CSVImporter({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<ImportFieldKey, string>>({} as any);
  const [selectedListId, setSelectedListId] = useState("");
  const [analysis, setAnalysis] = useState<{ listName: string; existing: number; newContacts: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [result, setResult] = useState<FinalResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const analyzeFn = useServerFn(analyzeContactImport);
  const importFn = useServerFn(importContactsBatch);
  const listFn = useServerFn(listContactLists);
  const queryClient = useQueryClient();

  const { data: lists } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => listFn(),
    enabled: open,
  });

  const validation = useMemo(
    () => (rows.length ? validateRows(rows, mapping) : null),
    [rows, mapping],
  );

  const allRejected: RejectedRow[] = useMemo(
    () => (validation ? [...validation.rejected, ...validation.duplicates] : []),
    [validation],
  );

  const resetState = () => {
    setStep(1);
    setFileName("");
    setFileSize(0);
    setHeaders([]);
    setRows([]);
    setMapping({} as any);
    setSelectedListId("");
    setAnalysis(null);
    setProcessed(0);
    setResult(null);
    setShowErrors(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = parseCsv((event.target?.result as string) ?? "");
      if (parsed.rows.length === 0) {
        toast.error("El archivo no contiene filas de datos");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapHeaders(parsed.headers));
      setStep(2);
    };
    reader.readAsText(file, "utf-8");
  };

  const goToSummary = async () => {
    if (!selectedListId) return toast.error("Selecciona una lista de destino");
    if (!mapping.phone && !mapping.email) return toast.error("Debes mapear al menos Teléfono o Email");
    if (!validation || validation.valid.length === 0) return toast.error("No hay filas válidas para importar");

    setIsAnalyzing(true);
    try {
      const res = await analyzeFn({
        data: {
          list_id: selectedListId,
          rows: validation.valid.map(({ rowNumber, ...r }) => ({ rowNumber, ...r })),
        },
      });
      setAnalysis(res);
      setStep(3);
    } catch (e: any) {
      toast.error(e?.message ?? "No fue posible analizar el archivo");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeImport = async () => {
    if (!validation) return;
    setStep(4);
    setProcessed(0);
    const totals: FinalResult = { created: 0, updated: 0, associated: 0, errors: 0, errorRows: [] };
    const valid: PreparedRow[] = validation.valid;

    try {
      for (let i = 0; i < valid.length; i += BATCH_SIZE) {
        const batch = valid.slice(i, i + BATCH_SIZE);
        const res = await importFn({ data: { list_id: selectedListId, rows: batch } });
        totals.created += res.created;
        totals.updated += res.updated;
        totals.associated += res.associated;
        totals.errors += res.errors;
        for (const er of res.errorRows) {
          const src = batch.find((b) => b.rowNumber === er.rowNumber);
          totals.errorRows.push({
            rowNumber: er.rowNumber,
            first_name: src?.first_name ?? "",
            last_name: src?.last_name ?? "",
            phone: src?.phone ?? "",
            email: src?.email ?? "",
            reason: er.reason,
          });
        }
        setProcessed(Math.min(i + BATCH_SIZE, valid.length));
      }
      setResult(totals);
      setStep(5);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      queryClient.invalidateQueries({ queryKey: ["contact-center-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error durante la importación");
      setStep(3);
    }
  };

  const downloadErrors = () => {
    const all = [...allRejected, ...(result?.errorRows ?? [])];
    const blob = new Blob([buildErrorsCsv(all)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `errores-importacion-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPct = validation?.valid.length ? Math.round((processed / validation.valid.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar contactos desde CSV</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm mb-4 font-medium">Selecciona un archivo .csv</p>
            <Input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="max-w-xs" />
            <p className="text-xs text-muted-foreground mt-3">Detecta automáticamente coma, punto y coma y UTF-8</p>
          </div>
        )}

        {step === 2 && validation && (
          <div className="space-y-6">
            <div className="rounded-lg border p-3 text-sm">
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground"> · {validation.total} filas · {(fileSize / 1024).toFixed(1)} KB</span>
            </div>

            <div className="space-y-2">
              <Label>Lista de destino</Label>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger><SelectValue placeholder="Selecciona una lista" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(lists) ? lists : []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Mapeo de columnas</Label>
              <div className="grid grid-cols-2 gap-3">
                {IMPORT_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                    <Select
                      value={mapping[f.key] || NONE}
                      onValueChange={(v) => setMapping((p) => ({ ...p, [f.key]: v === NONE ? "" : v }))}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Sin asignar</SelectItem>
                        {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <Stat label="Total" value={validation.total} />
              <Stat label="Válidos" value={validation.valid.length} />
              <Stat label="Inválidos" value={validation.rejected.length} />
              <Stat label="Duplicados" value={validation.duplicates.length} />
            </div>

            {allRejected.length > 0 && (
              <div className="space-y-2">
                <button className="text-xs underline text-muted-foreground" onClick={() => setShowErrors((s) => !s)}>
                  {showErrors ? "Ocultar" : "Ver"} filas rechazadas ({allRejected.length})
                </button>
                {showErrors && (
                  <div className="max-h-40 overflow-auto border rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-muted"><tr><th className="p-2 text-left">Fila</th><th className="p-2 text-left">Teléfono</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Motivo</th></tr></thead>
                      <tbody className="divide-y">
                        {allRejected.map((r) => (
                          <tr key={`${r.rowNumber}-${r.reason}`}>
                            <td className="p-2">{r.rowNumber}</td><td className="p-2">{r.phone}</td><td className="p-2">{r.email}</td><td className="p-2">{r.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <Button className="w-full" onClick={goToSummary} disabled={!selectedListId || isAnalyzing}>
              {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continuar
            </Button>
          </div>
        )}

        {step === 3 && validation && analysis && (
          <div className="space-y-5">
            <div className="rounded-lg border p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Lista destino:</span> <strong>{analysis.listName}</strong></p>
              <p><span className="text-muted-foreground">Contactos nuevos:</span> <strong>{analysis.newContacts}</strong></p>
              <p><span className="text-muted-foreground">Contactos existentes:</span> <strong>{analysis.existing}</strong></p>
              <p><span className="text-muted-foreground">Contactos inválidos:</span> <strong>{validation.rejected.length}</strong></p>
              <p><span className="text-muted-foreground">Duplicados:</span> <strong>{validation.duplicates.length}</strong></p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep(2)}>Cancelar</Button>
              <Button onClick={executeImport}>Importar {validation.valid.length} contactos</Button>
            </div>
          </div>
        )}

        {step === 4 && validation && (
          <div className="space-y-4 py-6">
            <p className="text-sm font-medium">Importando...</p>
            <Progress value={progressPct} />
            <p className="text-sm text-muted-foreground">Procesados: {processed} / {validation.valid.length} ({progressPct}%)</p>
          </div>
        )}

        {step === 5 && result && validation && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Importación completada</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Archivo:</span> {fileName}</p>
              <p><span className="text-muted-foreground">Lista:</span> {analysis?.listName}</p>
              <p><span className="text-muted-foreground">Filas procesadas:</span> {validation.total}</p>
              <p><span className="text-muted-foreground">Contactos creados:</span> {result.created}</p>
              <p><span className="text-muted-foreground">Contactos actualizados:</span> {result.updated}</p>
              <p><span className="text-muted-foreground">Duplicados:</span> {validation.duplicates.length}</p>
              <p><span className="text-muted-foreground">Rechazados:</span> {validation.rejected.length + result.errors}</p>
              <p><span className="text-muted-foreground">Asociados a lista:</span> {result.associated}</p>
            </div>
            {(allRejected.length > 0 || result.errors > 0) && (
              <Button variant="outline" onClick={downloadErrors} className="w-full">
                <Download className="h-4 w-4 mr-2" /> Descargar errores CSV
              </Button>
            )}
            {result.errors > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {result.errors} filas fallaron al guardarse.
              </p>
            )}
            <Button className="w-full" onClick={() => { setOpen(false); resetState(); }}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
