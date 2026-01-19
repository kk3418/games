# Frontend Modularization & Design Pattern Suggestions

This note summarizes frontend improvement ideas for the Games project (vanilla TypeScript + Vite) so future AI agents can quickly understand potential refactors.

## 1. Routing / Navigation Abstraction (Strategy + Router Module)
- Extract hash-based routing logic from `main.ts` into a dedicated `router/` module.
- Define a `RouteStrategy` interface (e.g., `HashRouteStrategy`) and a `GameRegistry` to map routes to games.
- Benefit: reduces `main.ts` responsibilities and makes routing replaceable (hash vs. history API).

## 2. Game Layering (Presenter / Adapter)
- Split each Game class into:
  - `GameState` (pure logic and data)
  - `GameView` (DOM creation + rendering)
  - `GamePresenter` (coordinates state + view)
- Benefit: smaller files, easier testing, clearer separation of concerns.

## 3. API Repository Layer
- Move API access into `src/api/` and add `src/repositories/` that expose domain methods.
- Games depend on repository interfaces rather than direct HTTP.
- Benefit: consistent API usage, easier mocking/testing.

## 4. Event Bus (Observer Pattern)
- Replace `window.dispatchEvent` usage with a simple `EventBus` abstraction.
- Benefit: decoupled event handling, testable, less reliance on globals.

## 5. Modal / Dialog Manager (Factory + Singleton)
- Introduce a `ModalManager` that creates/modifies dialogs based on config.
- `showLoginGate` returns a `ModalHandle` (open/close/update) rather than directly manipulating DOM.
- Benefit: consistent modal patterns and easier reuse.

## 6. Storage Adapter (Adapter Pattern)
- Wrap `localStorage` in a `StorageAdapter` with a consistent API.
- Benefit: can swap to memory/indexedDB later; centralizes key naming & cleanup.

## 7. UI Components Decomposition (Composite)
- Extract repeated DOM creation into component factories (e.g., snake header, score board, controls).
- Benefit: reduces massive game files and improves reuse.

## 8. Dependency Injection (DI) for Testability
- Add a lightweight `GameContext` with dependencies (`api`, `storage`, `eventBus`).
- Games receive dependencies via constructor or init.
- Benefit: easier to mock in tests and decouple from direct imports.

## 9. Domain vs API Types
- Separate types into `src/types/domain` and `src/types/api`.
- Benefit: avoid direct coupling between UI logic and API response shapes.
