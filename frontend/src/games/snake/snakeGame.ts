import '@/games/snake/snake.css'
import type { Game } from '@/types/game'
import { getSnakeGame, updateSnakeGame } from './snakeApi'
import { debounce } from '@/utilities/debounce'

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

  private debouncedUpdateGame = debounce(this.saveGameState.bind(this), 1000)

  async init(rootElement: HTMLElement): Promise<void> {
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
      <span>High: <span id="snake-high-score">0</span></span>
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

    // Load game data from backend
    await this.loadInitialData()

    // Start Game
    this.resetGame()
    document.addEventListener('keydown', this.handleKeyInput)
  }

  private async loadInitialData() {
    try {
      const gameData = await getSnakeGame()
      this.highScore = gameData.highestScore || 0
      this.difficulty = gameData.level || 'medium'
      
      // Could potentially resume game from here
      // For now, we'll just use high score and difficulty
      
      this.updateHighScoreDisplay()
      
      const select = this.container?.querySelector('.snake-difficulty-select') as HTMLSelectElement
      if (select) {
        select.value = this.difficulty
        this.gameSpeed = this.speeds[this.difficulty as keyof typeof this.speeds]
      }
      
    } catch (error) {
      console.error('Failed to load snake game data:', error)
      // Use local high score as fallback? For now, we'll just start fresh.
      this.highScore = 0
    }
  }
  
  private updateHighScoreDisplay() {
    const highScoreEl = document.getElementById('snake-high-score')
    if (highScoreEl) highScoreEl.textContent = this.highScore.toString()
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

    select.value = this.difficulty
    this.gameSpeed = this.speeds[this.difficulty as keyof typeof this.speeds]

    select.addEventListener('change', () => {
      this.difficulty = select.value
      this.gameSpeed = this.speeds[this.difficulty as keyof typeof this.speeds]
      
      updateSnakeGame({ level: this.difficulty })

      if (this.gameInterval && !this.isPaused && !this.isGameOver) {
        clearInterval(this.gameInterval)
        this.gameInterval = window.setInterval(() => this.gameLoop(), this.gameSpeed)
      }

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
          this.draw()
        }
        break
    }

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

    requestAnimationFrame(() => this.draw())
  }

  private spawnFood() {
    let newFood: Point
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      }
      const onSnake = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
      if (!onSnake) break
    }
    this.food = newFood
  }

  private gameLoop() {
    if (this.isPaused || this.isGameOver) {
      return
    }

    this.update()
    this.draw()
  }

  private update() {
    this.velocity = this.nextVelocity

    if (this.velocity.x === 0 && this.velocity.y === 0) return

    const head = { ...this.snake[0] }
    head.x += this.velocity.x
    head.y += this.velocity.y

    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver()
      return
    }

    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver()
      return
    }

    this.snake.unshift(head)

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10
      this.updateScore()
      this.spawnFood()
    } else {
      this.snake.pop()
    }

    this.debouncedUpdateGame()
  }
  
  private async saveGameState() {
    try {
      await updateSnakeGame({
        currentScore: this.score,
        snakePosition: this.snake,
        foodPosition: this.food,
        level: this.difficulty,
      })
    } catch (error) {
      console.error('Failed to save game state:', error)
    }
  }

  private draw() {
    if (!this.ctx || !this.canvas) return

    this.ctx.fillStyle = '#222'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#ff4444'
    this.ctx.beginPath()
    const foodX = this.food.x * this.gridSize + 1
    const foodY = this.food.y * this.gridSize + 1
    const size = this.gridSize - 2
    this.ctx.roundRect(foodX, foodY, size, size, 4)
    this.ctx.fill()

    this.snake.forEach((segment, index) => {
      if (index === 0) this.ctx!.fillStyle = '#66ff66'
      else this.ctx!.fillStyle = '#44ff44'

      const x = segment.x * this.gridSize + 1
      const y = segment.y * this.gridSize + 1
      const size = this.gridSize - 2

      this.ctx!.beginPath()
      this.ctx!.roundRect(x, y, size, size, 4)
      this.ctx!.fill()
    })

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
      this.updateHighScoreDisplay()
    }
  }

  private async gameOver() {
    this.isGameOver = true
    if (this.gameInterval) {
      clearInterval(this.gameInterval)
      this.gameInterval = null
    }
    
    try {
        const finalState = await updateSnakeGame({
            currentScore: this.score,
            snakePosition: this.snake,
            foodPosition: this.food,
        });
        if (finalState.highestScore && finalState.highestScore > this.highScore) {
            this.highScore = finalState.highestScore;
            this.updateHighScoreDisplay();
        }
    } catch (error) {
        console.error('Failed to update score on game over:', error);
    }

    this.draw()
  }
}
