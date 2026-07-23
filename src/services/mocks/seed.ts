/**
 * Deterministic mock helpers.
 * All mocks derive from these so datasets are stable between renders.
 */
let seed = 0xC0FFEE;
function rand(): number {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
export function resetSeed(s = 0xC0FFEE) {
  seed = s;
}
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}
export function int(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
export function float(min: number, max: number, decimals = 2): number {
  return Number((rand() * (max - min) + min).toFixed(decimals));
}
export function id(prefix: string): string {
  return `${prefix}_${Math.floor(rand() * 1_000_000).toString(36)}`;
}
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
export function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3_600_000).toISOString();
}
export function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

const FIRST_NAMES = [
  "María", "Juan", "Sofía", "Carlos", "Lucía", "Diego", "Ana", "Miguel",
  "Valentina", "Andrés", "Camila", "Sebastián", "Isabella", "Mateo",
  "Daniela", "Nicolás", "Paula", "Alejandro", "Gabriela", "Ricardo",
];
const LAST_NAMES = [
  "García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez",
  "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz",
  "Morales", "Ortiz", "Reyes", "Jiménez", "Álvarez", "Vargas",
];
const COMPANIES = [
  "Distribuidora Norte", "Tech Solutions MX", "Servicios Andinos",
  "Farmacias Vitanova", "Grupo Constructor CNM", "Logística Global",
  "Consultora Meridian", "Educa Plus", "Retail Prime", "Salud Integral",
];
const TAGS = ["VIP", "Prospecto", "Nuevo", "Fidelizado", "Inactivo", "Empresa", "Referido"];

export function fullName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
export function firstName(): string {
  return pick(FIRST_NAMES);
}
export function lastName(): string {
  return pick(LAST_NAMES);
}
export function companyName(): string {
  return pick(COMPANIES);
}
export function tag(): string {
  return pick(TAGS);
}
export function tags(count = 2): string[] {
  const set = new Set<string>();
  while (set.size < count) set.add(tag());
  return [...set];
}
export function phone(): string {
  const countries = ["+52", "+57", "+34", "+51", "+56"];
  const cc = pick(countries);
  return `${cc}${int(1_000_000_000, 9_999_999_999)}`;
}
export function email(name: string, i: number): string {
  return `${name.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${i}@example.com`;
}
export function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  };
}
