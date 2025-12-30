import '@/games/snake/snake.css'
import type { Game } from '@/types/game'

interface Point {
  x: number
  y: number
}

export class SnakeGame implements Game {
  id = 'snake'
  name = 'Snake'
  private container: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  // Game config
  private readonly gridSize = 20
  private readonly tileCount = 20
  private gameSpeed = 100 // ms
  private difficulty = 'medium'

  private readonly speeds = {
    easy: 150,
    medium: 100,
    hard: 60
  }

  // Game state
  private snake: Point[] = []
  private food: Point = { x: 0, y: 0 }
  private velocity: Point = { x: 0, y: 0 }
  private nextVelocity: Point = { x: 0, y: 0 }
  private score = 0
  private highScore = 0
  private gameInterval: number | null = null
  private isPaused = false
  private isGameOver = false

  init(rootElement: HTMLElement): void {
    this.container = document.createElement('div')
    this.container.className = 'snake-container'

    // Header (Score + Difficulty)
    const header = document.createElement('div')
    header.className = 'snake-header'

    // Score Board
    const scoreBoard = document.createElement('div')
    scoreBoard.className = 'snake-score-board'
    scoreBoard.innerHTML = `
      <span>Score: <span id="snake-score">0</span></span>
      <span>High: <span id="snake-high-score">${this.getHighScore()}</span></span>
    `
    header.appendChild(scoreBoard)

    // Difficulty Select
    header.appendChild(this.createDifficultySelect())

    this.container.appendChild(header)

    // Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.gridSize * this.tileCount
    this.canvas.height = this.gridSize * this.tileCount
    this.canvas.className = 'snake-canvas'
    this.container.appendChild(this.canvas)

    // Controls Info
    const controls = document.createElement('div')
    controls.className = 'snake-controls'
    controls.textContent = 'Controls: Arrow Keys to move, Space to Pause/Resume'
    this.container.appendChild(controls)

    // Context
    this.ctx = this.canvas.getContext('2d')

    // Attach to root
    rootElement.appendChild(this.container)

    // Start Game
    this.resetGame()
    document.addEventListener('keydown', this.handleKeyInput)
  }

  destroy(): void {
    if (this.gameInterval) {
      clearInterval(this.gameInterval)
    }
    document.removeEventListener('keydown', this.handleKeyInput)
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }

  private createDifficultySelect(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'snake-difficulty'

    const label = document.createElement('span')
    label.className = 'snake-difficulty-label'
    label.textContent = 'LEVEL:'

    const select = document.createElement('select')
    select.className = 'snake-difficulty-select'

    const options = [
      { value: 'easy', text: 'Slow' },
      { value: 'medium', text: 'Normal' },
      { value: 'hard', text: 'Fast' }
    ]

    options.forEach(opt => {
      const option = document.createElement('option')
      option.value = opt.value
      option.textContent = opt.text
      select.appendChild(option)
    })

    // Load saved difficulty
    const savedDifficulty = localStorage.getItem('snake-difficulty')
    if (savedDifficulty && savedDifficulty in this.speeds) {
      this.difficulty = savedDifficulty
    }
    select.value = this.difficulty
    this.gameSpeed = this.speeds[this.difficulty as keyof typeof this.speeds]

    select.addEventListener('change', () => {
      this.difficulty = select.value
      localStorage.setItem('snake-difficulty', this.difficulty)
      this.gameSpeed = this.speeds[this.difficulty as keyof typeof this.speeds]

      // If game is running, restart timer with new speed
      if (this.gameInterval && !this.isPaused && !this.isGameOver) {
        clearInterval(this.gameInterval)
        this.gameInterval = window.setInterval(() => this.gameLoop(), this.gameSpeed)
      }

      // Remove focus so arrow keys work for game immediately
      select.blur()
    })

    wrap.appendChild(label)
    wrap.appendChild(select)
    return wrap
  }

  private handleKeyInput = (e: KeyboardEvent) => {
    // Prevent default scrolling for arrow keys and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault()
    }

    switch (e.key) {
      case 'ArrowUp':
        if (this.velocity.y !== 1) this.nextVelocity = { x: 0, y: -1 }
        break
      case 'ArrowDown':
        if (this.velocity.y !== -1) this.nextVelocity = { x: 0, y: 1 }
        break
      case 'ArrowLeft':
        if (this.velocity.x !== 1) this.nextVelocity = { x: -1, y: 0 }
        break
      case 'ArrowRight':
        if (this.velocity.x !== -1) this.nextVelocity = { x: 1, y: 0 }
        break
      case ' ':
        if (this.isGameOver) {
          this.resetGame()
        } else {
          this.isPaused = !this.isPaused
          // Force a redraw to show/hide pause menu immediately
          this.draw()
        }
        break
    }

    // Start game on first move if stationary
    if (this.velocity.x === 0 && this.velocity.y === 0 &&
       (this.nextVelocity.x !== 0 || this.nextVelocity.y !== 0) &&
       !this.isGameOver && !this.isPaused) {
      this.velocity = this.nextVelocity
    }
  }

  private resetGame() {
    this.snake = [{ x: 10, y: 10 }]
    this.velocity = { x: 0, y: 0 }
    this.nextVelocity = { x: 0, y: 0 }
    this.score = 0
    this.isGameOver = false
    this.isPaused = false
    this.updateScore()
    this.spawnFood()

    if (this.gameInterval) clearInterval(this.gameInterval)
    this.gameInterval = window.setInterval(() => this.gameLoop(), this.gameSpeed)

    // Initial draw
    requestAnimationFrame(() => this.draw())
  }

  private spawnFood() {
    let newFood: Point
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      }
      // Check if food spawns on snake
      const onSnake = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
      if (!onSnake) break
    }
    this.food = newFood
  }

  private gameLoop() {
    if (this.isPaused || this.isGameOver) {
      // Still draw to show pause/gameover screens
      // But don't update
      return
    }

    this.update()
    this.draw()
  }

  private update() {
    // Apply next velocity (prevents multiple direction changes in one tick)
    this.velocity = this.nextVelocity

    if (this.velocity.x === 0 && this.velocity.y === 0) return

    const head = { ...this.snake[0] }
    head.x += this.velocity.x
    head.y += this.velocity.y

    // Wall Collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver()
      return
    }

    // Self Collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver()
      return
    }

    this.snake.unshift(head)

    // Eat Food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10
      this.updateScore()
      this.spawnFood()
    } else {
      this.snake.pop()
    }
  }

  private draw() {
    if (!this.ctx || !this.canvas) return

    // Clear background
    this.ctx.fillStyle = '#222'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw Food
    this.ctx.fillStyle = '#ff4444'
    this.ctx.beginPath()
    const foodX = this.food.x * this.gridSize + 1
    const foodY = this.food.y * this.gridSize + 1
    const size = this.gridSize - 2
    this.ctx.roundRect(foodX, foodY, size, size, 4)
    this.ctx.fill()

    // Draw Snake
    this.snake.forEach((segment, index) => {
      // Head is slightly different color
      if (index === 0) this.ctx!.fillStyle = '#66ff66'
      else this.ctx!.fillStyle = '#44ff44'

      const x = segment.x * this.gridSize + 1
      const y = segment.y * this.gridSize + 1
      const size = this.gridSize - 2

      this.ctx!.beginPath()
      this.ctx!.roundRect(x, y, size, size, 4)
      this.ctx!.fill()
    })

    // Game Over / Pause Overlay
    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = 'white'
      this.ctx.font = '30px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 20)

      this.ctx.font = '16px Arial'
      this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 20)
    } else if (this.isPaused) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = 'white'
      this.ctx.font = '30px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2)
    }
  }

  private updateScore() {
    const scoreEl = document.getElementById('snake-score')
    if (scoreEl) scoreEl.textContent = this.score.toString()

    if (this.score > this.highScore) {
      this.highScore = this.score
      this.saveHighScore()
      const highScoreEl = document.getElementById('snake-high-score')
      if (highScoreEl) highScoreEl.textContent = this.highScore.toString()
    }
  }

  private gameOver() {
    this.isGameOver = true
    this.draw() // Draw game over screen immediately
  }

  private getHighScore(): number {
    return parseInt(localStorage.getItem('snake-highscore') || '0', 10)
  }

  private saveHighScore() {
    localStorage.setItem('snake-highscore', this.highScore.toString())
  }
}
