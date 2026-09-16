export type PullableItem = { id: string; probability: number };

export function pickWeightedItem<T extends PullableItem>(
  items: T[],
  rng: () => number = Math.random
): T {
  if (items.length === 0) {
    throw new Error("No items to pick from");
  }
  const total = items.reduce((sum, item) => sum + item.probability, 0);
  if (total <= 0) {
    throw new Error("Total probability must be positive");
  }
  let roll = rng() * total;
  for (const item of items) {
    if (roll < item.probability) {
      return item;
    }
    roll -= item.probability;
  }
  return items[items.length - 1];
}

export function calculateDuplicateRefund(price: number): number {
  return Math.floor(price * 0.5);
}
