export interface Game {
  id: string
  name: string
  init(container: HTMLElement): void
  destroy(): void
}
