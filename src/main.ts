import '@/style.css'
import { SudokuGame } from '@/sudokuGame'
import { SnakeGame } from '@/snakeGame'
import type { Game } from '@/game'

const gameList = document.getElementById('game-list')
const contentDiv = document.getElementById('game-content')
const menuToggle = document.getElementById('menu-toggle')
const sideMenu = document.getElementById('side-menu')

if (menuToggle && sideMenu) {
  menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('open')
  })

  // Close menu when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sideMenu.classList.contains('open') &&
        !sideMenu.contains(e.target as Node) &&
        !menuToggle.contains(e.target as Node)) {
      sideMenu.classList.remove('open')
    }
  })
}

if (gameList && contentDiv) {
  let activeGame: Game | null = null

  const games: Game[] = [
    new SudokuGame(),
    new SnakeGame(),
  ]

  const switchGame = (game: Game) => {
    if (activeGame === game) return

    if (activeGame) {
      activeGame.destroy()
    }
    contentDiv.innerHTML = ''
    activeGame = game
    activeGame.init(contentDiv)
  }

  games.forEach(game => {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.textContent = game.name
    button.className = 'game-menu-btn'
    button.onclick = () => {
      document.querySelectorAll('.game-menu-btn').forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')
      switchGame(game)

      // Close menu on mobile selection
      if (window.innerWidth <= 768 && sideMenu) {
        sideMenu.classList.remove('open')
      }
    }
    item.appendChild(button)
    gameList.appendChild(item)
  })

  // Initialize with the first game
  if (games.length > 0) {
    // Select the first game by default
    const firstGameBtn = gameList.querySelector('.game-menu-btn') as HTMLElement
    if (firstGameBtn) {
      firstGameBtn.click()
    }
  }
}
