# AI Memory File: Games Project

This file contains context and architectural details for the "Games" project to assist AI agents in understanding the codebase.

## 1. Project Overview

This is a monorepo-style project containing a backend API (Express/Node.js) and a frontend web application (Vanilla TypeScript/Vite). The project hosts multiple browser-based games, currently **Snake** and **Sudoku**.

### 1.1 Tech Stack

*   **Backend**: Node.js, Express, Prisma (ORM), SQLite (dev), TypeScript.
*   **Frontend**: Vite, TypeScript (Vanilla, no UI framework like React/Vue), CSS modules (imported in TS).
*   **Authentication**: Custom JWT-based auth + Google OAuth.
*   **Package Manager**: pnpm (implied by `pnpm-lock.yaml`).

## 2. Backend Architecture (`/backend`)

### 2.1 Database Schema (Prisma)

The database models are defined in `@/backend/prisma/schema.prisma`.

*   **User**: Stores auth info (email, password, googleId) and relations to game data.
*   **SnakeGame**: Stores user's Snake game state (score, level, positions). One-to-one with User.
*   **SudokuGame**: Stores user's current Sudoku game state (puzzle, board, level). One-to-one with User.
*   **SudoKuHistory**: Stores completed Sudoku games. One-to-many with User.

### 2.2 API Routes (`/backend/src/routes`)

*   **Auth** (`/`):
    *   `POST /register`: User registration.
    *   `POST /login`: Email/password login.
    *   `POST /oauth`: Google login.
    *   `GET /me`: Get current user info.
    *   `DELETE /account`: Delete user account.
*   **Snake** (`/snake-game`):
    *   `GET /`: Get saved game state.
    *   `POST /`: Create new game state.
    *   `PATCH /`: Update existing game state.
*   **Sudoku** (`/sudoku-game`):
    *   `GET /`: Get saved game state.
    *   `POST /`: Create new game.
    *   `PATCH /`: Update game progress.
*   **Sudoku History** (`/sudoku-history`):
    *   (Inferred) endpoints to list and manage past games.

### 2.3 Authentication

*   Uses JWT (JSON Web Tokens).
*   Middleware: `authMiddleware.ts` handles token verification (`authenticateToken` and `authenticateWithTokenRefresh`).
*   Google Auth Library is used for validating Google tokens on the backend.

## 3. Frontend Architecture (`/frontend`)

### 3.1 Core Structure

*   **Entry Point**: `src/main.ts` - Handles initialization, routing (hash-based), and global auth state.
*   **Routing**: Custom hash-based routing.
    *   `#snake` -> SnakeGame
    *   `#sudoku` -> SudokuGame
    *   `#history` -> SudokuHistoryPage (inferred)
*   **Components**: No framework. Components are classes or functions that manipulate the DOM directly.
    *   `Game` Interface: All games implement `init(rootElement)` and `destroy()`.

### 3.2 Game Implementations

*   **Snake** (`src/games/snake`):
    *   Logic: `snakeGame.ts` (Class `SnakeGame`).
    *   Canvas-based rendering.
    *   State: Managed locally and synced to backend via `snakeApi.ts`.
*   **Sudoku** (`src/games/sudoku`):
    *   Logic: `sudokuGame.ts` (Class `SudokuGame`).
    *   DOM-based rendering (grid of inputs).
    *   Generation: `generateSudoku.ts`.
    *   State: Debounced updates to backend via `sudokuApi.ts`.

### 3.3 Utilities

*   **API Client** (`src/utilities/api.ts`):
    *   Wrapper around `fetch`.
    *   Automatically handles `Authorization` header injection.
    *   Handles token updates from `X-New-Token` header.
    *   Dispatches `auth:expired` event on 401/403.
*   **Auth** (`src/auth`):
    *   `googleAuth.ts`: Manages Google Sign-In flow.
    *   `loginGate.ts`: UI modal for forcing login.

## 4. Key Development Patterns

1.  **State Sync**: Games use a `debounce` utility to periodically save state to the backend to avoid flooding the API.
2.  **Auth Flow**:
    *   App checks for token on load.
    *   If no token, shows `LoginGate`.
    *   If token expires (401), logs out and shows `LoginGate`.
3.  **CSS**: Styles are imported directly in TS files (e.g., `import '@/styles/main.css'`).

## 5. Directory Map

```text
/backend
  /src
    /controllers    # Logic for request handling
    /middleware     # Auth and validation
    /routes         # API endpoint definitions
    /prisma         # Database schema
/frontend
  /src
    /games          # Game-specific logic (snake, sudoku)
    /auth           # Auth UI and logic
    /utilities      # Shared helpers (api, debounce)
    main.ts         # App entry point
```

## 6. TODO / Optimizations

*   **Backend testing setup** (pick one):
    *   Vitest + Supertest (fast, TS-friendly)
    *   Jest + Supertest (most common, more setup)
    *   node:test + Supertest (lightweight, Node built-in)
