const dutchNames = ["een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien"] as const;

export function dutchQuantityName(quantity: number): string {
  const index = Math.max(1, Math.min(10, Math.round(quantity))) - 1;
  return dutchNames[index];
}
