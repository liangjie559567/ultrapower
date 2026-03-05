/**
 * Memory optimization utilities
 */

export function clearBuffer(buffer: string): string {
  return '';
}

export function limitArray<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(0, max) : arr;
}

export function pruneMap<K, V>(map: Map<K, V>, maxSize: number): void {
  if (map.size <= maxSize) return;
  const toDelete = map.size - maxSize;
  let count = 0;
  for (const key of map.keys()) {
    if (count++ >= toDelete) break;
    map.delete(key);
  }
}
