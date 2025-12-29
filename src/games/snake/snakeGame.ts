import type { Game } from '@/types/game'

export class SnakeGame implements Game {
  id = 'snake'
  name = 'Snake - coming soon'
  private container: HTMLElement | null = null

  init(rootElement: HTMLElement): void {
    this.container = document.createElement('div')
    this.container.className = 'container'

    const title = document.createElement('h1')
    title.textContent = 'Snake Game'
    title.style.textAlign = 'center'
    title.style.width = '100%'

    this.container.appendChild(title)
    rootElement.appendChild(this.container)
  }

  destroy(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }
}
