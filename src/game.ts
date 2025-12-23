export interface Game {
  name: string;
  init(container: HTMLElement): void;
  destroy(): void;
}
