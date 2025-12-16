export type WeightedItem<T> = T & { weight: number };

export function pickWeightedRandom<T extends { weight: number }>(
  items: T[],
): T | null {
  if (!items.length) return null;
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) return items[0];

  let r = Math.random() * totalWeight;
  for (const item of items) {
    const w = Math.max(0, item.weight);
    if (w === 0) continue;
    if (r < w) return item;
    r -= w;
  }
  return items[items.length - 1];
}


