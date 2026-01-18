export function clone2DArray<T>(arr: T[][]): T[][] {
  return arr.map((row) => [...row])
}
