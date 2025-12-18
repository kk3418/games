export function getAllInput() {
  const all = Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, i) => {
      const k = localStorage.key(i)!;
      return [k, localStorage.getItem(k)];
    })
  )

  const inputs = Object.fromEntries(
    Object.entries(all)
      .filter(([k]) => k.startsWith("input-"))
      .map(([k, v]) => [k.replace("input-", ""), v])
  )

  return inputs
}
