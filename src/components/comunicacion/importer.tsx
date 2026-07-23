import { useMemo, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";

type Row = { phone: string; name?: string };

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  const rows: Row[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((s) => s.trim());
    const phone = parts.find((p) => /^\+?\d[\d\s-]{6,}$/.test(p));
    if (phone) rows.push({ phone: phone.replace(/\s|-/g, ""), name: parts[0] });
  }
  return rows;
}

export function Importer() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    if (!rows) return null;
    const seen = new Set<string>();
    let dup = 0, invalid = 0, valid = 0;
    for (const r of rows) {
      if (!/^\+?\d{7,15}$/.test(r.phone)) { invalid++; continue; }
      if (seen.has(r.phone)) { dup++; continue; }
      seen.add(r.phone); valid++;
    }
    return { total: rows.length, valid, dup, invalid };
  }, [rows]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    setRows(parseCsv(text));
    setProgress(0);
  };

  const importNow = () => {
    if (!stats?.valid) return toast.error("No hay contactos válidos");
    setProgress(1);
    const tick = () => {
      setProgress((p) => {
        if (p >= 100) { toast.success(`${formatNumber(stats.valid)} contactos importados`); return 100; }
        setTimeout(tick, 30);
        return Math.min(100, p + 4);
      });
    };
    tick();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Importar contactos (Excel / CSV)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition hover:bg-muted/50"
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Arrastra tu archivo aquí o haz clic para seleccionar</p>
            <p className="mt-1 text-xs text-muted-foreground">CSV, XLS, XLSX · hasta 20 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {fileName && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-medium">{fileName}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setRows(null); setFileName(""); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {progress > 0 && <Progress value={progress} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Análisis de deduplicación</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!stats ? (
            <p className="text-muted-foreground">Sube un archivo para ver el análisis.</p>
          ) : (
            <>
              <StatRow icon={<FileSpreadsheet className="h-4 w-4" />} label="Filas leídas" value={stats.total} />
              <StatRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Válidos únicos" value={stats.valid} tone="emerald" />
              <StatRow icon={<AlertCircle className="h-4 w-4 text-amber-600" />} label="Duplicados" value={stats.dup} tone="amber" />
              <StatRow icon={<AlertCircle className="h-4 w-4 text-destructive" />} label="Inválidos" value={stats.invalid} tone="rose" />
              <Button className="mt-2 w-full" onClick={importNow} disabled={!stats.valid}>
                Importar {formatNumber(stats.valid)} contactos
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatRow({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  const cls = tone === "emerald" ? "text-emerald-700 dark:text-emerald-400"
    : tone === "amber" ? "text-amber-700 dark:text-amber-400"
    : tone === "rose" ? "text-destructive" : "text-foreground";
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 p-2">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span>{label}</span></div>
      <span className={`font-semibold ${cls}`}>{formatNumber(value)}</span>
    </div>
  );
}
