import '@/styles/main.css'
import { SudokuGame } from '@/games/sudoku/sudokuGame'
import { SnakeGame } from '@/games/snake/snakeGame'
import { SudokuHistoryPage } from '@/games/sudokuHistory/sudokuHistoryPage'
import { GoogleAuth } from '@/auth/googleAuth'
import { showLoginGate } from '@/auth/loginGate'
import type { Game } from '@/types/game'

const gameList = document.getElementById('game-list')
const contentDiv = document.getElementById('game-content')
const menuToggle = document.getElementById('menu-toggle')
const sideMenu = document.getElementById('side-menu')

// Initialize Auth
const auth = new GoogleAuth('user-section')

let gamesInitialized = false
let loginGateOpen = false
let activeGame: Game | null = null
let rerenderRoute: null | (() => void) = null

const initGames = () => {
  if (gamesInitialized) return
  gamesInitialized = true

  if (!gameList || !contentDiv) return

  const games: Game[] = [new SudokuGame(), new SudokuHistoryPage(), new SnakeGame()]

  const switchGame = (game: Game) => {
    if (activeGame === game) return

    if (activeGame) {
      activeGame.destroy()
    }
    contentDiv.innerHTML = ''
    activeGame = game
    activeGame.init(contentDiv)

    // Update active menu item
    document.querySelectorAll('.game-menu-btn').forEach((btn) => {
      if (btn.getAttribute('data-game-id') === game.id) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })

    // Close menu on mobile
    if (window.innerWidth <= 768 && sideMenu && sideMenu.classList.contains('open')) {
      sideMenu.classList.remove('open')
    }
  }

  const handleRouting = () => {
    const hash = window.location.hash.slice(1) // remove '#'
    const targetGame = games.find((g) => g.id === hash) || games[0]

    if (targetGame) {
      switchGame(targetGame)
    }
  }

  // Bind routing events
  window.addEventListener('hashchange', handleRouting)
  rerenderRoute = handleRouting

  // Initialize current route immediately
  if (!window.location.hash && games.length > 0) {
    window.location.hash = games[0].id
  } else {
    handleRouting()
  }

  games.forEach((game) => {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.textContent = game.name
    button.className = 'game-menu-btn'
    button.setAttribute('data-game-id', game.id)
    button.onclick = () => {
      window.location.hash = game.id
    }
    item.appendChild(button)
    gameList.appendChild(item)
  })
}

window.addEventListener('load', () => {
  auth.init()

  auth.onLogout(() => {
    if (loginGateOpen) return

    if (activeGame) {
      activeGame.destroy()
      activeGame = null
    }

    if (contentDiv) contentDiv.innerHTML = ''
    document.querySelectorAll('.game-menu-btn').forEach((btn) => btn.classList.remove('active'))

    if (sideMenu && sideMenu.classList.contains('open')) {
      sideMenu.classList.remove('open')
    }

    loginGateOpen = true

    showLoginGate({
      auth,
      onAuthenticated: () => {
        loginGateOpen = false
        auth.init()
        initGames()
        rerenderRoute?.()
      },
    })
  })

  window.addEventListener('auth:expired', () => {
    auth.handleLogout()
  })

  if (auth.isAuthenticated()) {
    initGames()
    return
  }

  loginGateOpen = true
  showLoginGate({
    auth,
    onAuthenticated: () => {
      loginGateOpen = false
      auth.init()
      initGames()
      rerenderRoute?.()
    },
  })
})

if (menuToggle && sideMenu) {
  menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('open')
  })

  // Close menu when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 768 &&
      sideMenu.classList.contains('open') &&
      !sideMenu.contains(e.target as Node) &&
      !menuToggle.contains(e.target as Node)
    ) {
      sideMenu.classList.remove('open')
    }
  })
}
