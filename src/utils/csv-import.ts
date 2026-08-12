/**
 * Utilidades cliente para la importación CSV del Centro de Contactos.
 * No contiene lógica de servidor: sólo parseo, normalización y validación.
 */

export type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
  delimiter: string;
};

export const IMPORT_FIELDS = [
  { key: "first_name", label: "Nombre" },
  { key: "last_name", label: "Apellido" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Email" },
  { key: "city", label: "Ciudad" },
  { key: "company", label: "Empresa" },
  { key: "notes", label: "Notas" },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

const HEADER_HINTS: Record<ImportFieldKey, string[]> = {
  first_name: ["nombre", "first_name", "firstname", "nombres", "name"],
  last_name: ["apellido", "last_name", "lastname", "apellidos"],
  phone: ["telefono", "teléfono", "phone", "celular", "movil", "móvil", "whatsapp", "numero", "número"],
  email: ["email", "correo", "e-mail", "mail"],
  city: ["ciudad", "city", "municipio"],
  company: ["empresa", "company", "compania", "compañía", "organizacion"],
  notes: ["notas", "notes", "observaciones", "comentarios"],
};

function stripAccents(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = headerLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((v) => v.trim().replace(/^"|"$/g, "").trim());
}

export function parseCsv(text: string): CsvParseResult {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], delimiter: "," };

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map((h) => h || "columna");
  const rows = lines.slice(1).map((line) => {
    const values = splitLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
  return { headers, rows, delimiter };
}

export function autoMapHeaders(headers: string[]): Record<ImportFieldKey, string> {
  const map = {} as Record<ImportFieldKey, string>;
  for (const field of IMPORT_FIELDS) {
    const hints = HEADER_HINTS[field.key];
    const found = headers.find((h) => {
      const norm = stripAccents(h.toLowerCase().trim());
      return hints.some((hint) => norm === stripAccents(hint));
    });
    map[field.key] = found ?? "";
  }
  return map;
}

/** Normaliza a E.164 sin "+": Colombia por defecto (10 dígitos -> 57XXXXXXXXXX). */
export function normalizeImportPhone(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits;
}

export function isValidImportPhone(normalized: string): boolean {
  return /^[1-9]\d{9,14}$/.test(normalized);
}

export function normalizeEmail(input: string): string {
  return (input || "").replace(/\s+/g, "").toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(email);
}

export type PreparedRow = {
  rowNumber: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  company: string;
  notes: string;
};

export type RejectedRow = {
  rowNumber: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  reason: string;
};

export type ValidationResult = {
  valid: PreparedRow[];
  rejected: RejectedRow[];
  duplicates: RejectedRow[];
  total: number;
};

export function validateRows(
  rows: Record<string, string>[],
  mapping: Record<ImportFieldKey, string>,
): ValidationResult {
  const valid: PreparedRow[] = [];
  const rejected: RejectedRow[] = [];
  const duplicates: RejectedRow[] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // 1 = encabezados
    const get = (key: ImportFieldKey) => (mapping[key] ? (row[mapping[key]] ?? "").trim() : "");

    const rawPhone = get("phone");
    const rawEmail = get("email");
    const first_name = get("first_name");
    const last_name = get("last_name");

    const phone = normalizeImportPhone(rawPhone);
    const email = normalizeEmail(rawEmail);

    if (!rawPhone && !rawEmail) {
      rejected.push({ rowNumber, first_name, last_name, phone: rawPhone, email: rawEmail, reason: "El contacto necesita teléfono o email." });
      return;
    }
    if (rawPhone && !isValidImportPhone(phone)) {
      rejected.push({ rowNumber, first_name, last_name, phone: rawPhone, email: rawEmail, reason: "Teléfono inválido" });
      return;
    }
    if (rawEmail && !isValidEmail(email)) {
      rejected.push({ rowNumber, first_name, last_name, phone: rawPhone, email: rawEmail, reason: "Email inválido" });
      return;
    }

    const key = phone ? `p:${phone}` : `e:${email}`;
    if (seen.has(key)) {
      duplicates.push({ rowNumber, first_name, last_name, phone, email, reason: "Duplicado dentro del archivo" });
      return;
    }
    seen.add(key);

    valid.push({
      rowNumber,
      first_name,
      last_name,
      phone,
      email,
      city: get("city"),
      company: get("company"),
      notes: get("notes"),
    });
  });

  return { valid, rejected, duplicates, total: rows.length };
}

export function buildErrorsCsv(rows: RejectedRow[]): string {
  const header = "fila,nombre,apellido,telefono,email,motivo";
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const body = rows
    .map((r) => [String(r.rowNumber), r.first_name, r.last_name, r.phone, r.email, r.reason].map(esc).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
