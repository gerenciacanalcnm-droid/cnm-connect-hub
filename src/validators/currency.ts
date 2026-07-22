export function isPositiveAmount(value: number, min = 0): boolean {
  return Number.isFinite(value) && value >= min;
}
