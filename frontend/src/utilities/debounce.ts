export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 500
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = undefined;
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait) as unknown as number;
  };
}
