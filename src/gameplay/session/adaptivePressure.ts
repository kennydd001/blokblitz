export function adaptivePressureMultiplier(displayTimeMs: number): number {
  const safeDisplayTime = Math.max(400, displayTimeMs);
  return Math.max(0.65, Math.min(1.35, 1400 / safeDisplayTime));
}

export function adaptiveProgressRate(baseRate: number, displayTimeMs: number): number {
  return baseRate * adaptivePressureMultiplier(displayTimeMs);
}
