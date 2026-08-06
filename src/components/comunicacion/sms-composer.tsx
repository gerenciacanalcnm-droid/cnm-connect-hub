import { smsStats } from "@/lib/sms-utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SmsComposer({
  value,
  onChange,
  label = "Mensaje",
  placeholder = "Escribe tu mensaje…",
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}) {
  const s = smsStats(value);
  const warn = s.parts > 1;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="font-mono text-sm"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-muted px-2 py-0.5 font-medium">{s.encoding}</span>
          <span>
            <strong className="text-foreground">{s.units}</strong> / {s.cap} caracteres
          </span>
          <span>
            Partes:{" "}
            <strong className={cn(warn && "text-amber-600 dark:text-amber-400")}>{s.parts}</strong>
          </span>
        </div>
        {warn && (
          <span className="text-amber-600 dark:text-amber-400">Se enviará como {s.parts} SMS</span>
        )}
      </div>
    </div>
  );
}
