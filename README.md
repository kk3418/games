# Games Monorepo (Vanilla TS + Express + Prisma)

這是一個小型的「多遊戲」專案：

- `frontend/`: Vite + TypeScript（不使用 React/Vue 等框架），以「模組化 + lifecycle」方式組合遊戲頁面
- `backend/`: Node.js + Express + Prisma（SQLite），提供登入/驗證與遊戲資料存取 API

本文件**以技術架構為主**，開發/啟動指令只保留必要資訊。

## 專案目錄

```txt
/games
  /backend
    /prisma
    /src
      /controllers
      /middleware
      /routes
      index.ts
      prismaInstance.ts
  /frontend
    /src
      /auth
      /components
      /games
      /styles
      /types
      /utilities
      main.ts
```

## 技術架構總覽

### 前端（無框架）如何模組化

這個前端的核心想法是：

- **每一個「頁面/遊戲」是一個模組**，提供一致的 `init()` / `destroy()` lifecycle
- **路由只是切換 active module**（Hash routing），切換時負責：清空容器、呼叫 `destroy()`、再呼叫新 module 的 `init()`
- **跨模組共用能力放到 utilities/components**（例如 API client、debounce、modal 等），避免把共用邏輯散落在各遊戲中

#### 1) Module = `Game` 介面（lifecycle）

入口型別在 `frontend/src/types/game.ts`：

- `id`: hash route 對應的識別（例如 `sudoku`）
- `name`: 側邊選單顯示名稱
- `init(container)`: 建立 DOM、掛事件、載入資料
- `destroy()`: 移除 DOM、解除事件、清理 state（避免 memory leak）

這個介面讓「頁面切換」不需要依賴任何框架，也可以保持乾淨的邊界。

#### 2) Hash routing + module switch

在 `frontend/src/main.ts`：

- 建立 `games: Game[] = [new SudokuGame(), new SudokuHistoryPage()]`
- 監聽 `hashchange`
- `switchGame(game)` 會：
  - 如果有 `activeGame`：先 `activeGame.destroy()`
  - 清空 `contentDiv`
  - 設定 `activeGame = game` 後 `activeGame.init(contentDiv)`

這種做法的好處：

- 可以把每個遊戲視為「可插拔的 feature module」
- 模組彼此不需要知道彼此存在
- 切換時的清理邏輯集中在同一個地方，避免事件/DOM 殘留

#### 3) UI 建構：直接用 DOM API（可測、可拆）

以 `Sudoku` 為例：

- `sudokuGame.ts` 負責組合流程（載入/建立遊戲、掛事件、更新資料）
- UI 元件拆在 `sudokuUI.ts`（例如 `createSudokuTable`, `createKeypad`, `createDifficultySelect`）

建議的依賴方向（已大致符合現況）：

- `main.ts` -> `games/*` -> `utilities/*` / `components/*` / `types/*`
- 避免 `utilities` 反向依賴 `games`

#### 4) 狀態管理：localStorage（短期）+ backend（長期）

目前前端狀態來源主要有兩種：

- **localStorage**：例如 Sudoku 的 `input-{r}-{c}`、遊戲難度、部分 UI 狀態
- **backend**：登入後用 token 存取 `sudoku-game` / `sudoku-history`

做法上偏向「localStorage 做 UI/互動即時狀態，後端做持久化」：

- Sudoku：
  - 初次進入：若後端 `GET /sudoku-game` 404，前端生成 puzzle，然後 `POST /sudoku-game` 建立
  - 遊玩中：輸入觸發 `window` event（如 `sudoku:cell-change`），再用 `debounce` 做 `PATCH /sudoku-game`
  - 里程碑：結束/重置時寫入 `POST /sudoku-history`

#### 5) API client：集中處理 token / refresh / auth expired

`frontend/src/utilities/api.ts` 統一封裝 `fetch`：

- 自動在 request header 加上 `Authorization: Bearer <token>`
- 若後端在 response header 回 `X-New-Token`，前端自動更新 localStorage token
- 若遇到 `401/403`，dispatch `auth:expired` 事件，讓 `main.ts` 觸發登出流程

> 這個設計把「驗證/續期」邏輯集中起來，讓各遊戲 API module（例如 `sudokuApi`）只要關心資料本身。

#### 6) Auth UI：Login Gate 以 Modal 形式隔離

`frontend/src/auth/loginGate.ts`：

- 用一個不可關閉（closeable false）的 modal，封裝 login/register/Google sign-in UI
- login 成功後呼叫 `GoogleAuth.handleLoginSuccess()`，並透過 listener 回呼通知外部

`main.ts`：

- 初次載入如果未登入：開 login gate
- 偵測 `auth:expired` 或使用者登出：清理 active game，回到 login gate

---

### 後端（Express + Prisma）分層

後端以典型 Express 結構組織：

- `src/index.ts`：Express app 入口，掛載 middleware、routes
- `src/routes/*`：宣告路由與 middleware chain
- `src/controllers/*`：處理 request/response、呼叫 Prisma
- `src/middleware/*`：例如
  - `authMiddleware.ts`：JWT 驗證、token refresh（`X-New-Token`）
  - `headerCheckMiddleware.ts`：要求 `Content-Type: application/json`
- `src/prismaInstance.ts`：集中建立 PrismaClient（adapter + `DATABASE_URL`）

#### 1) Routes -> Middleware -> Controller

以 Sudoku 為例：

- `routes/sudokuGameRoutes.ts`
  - `GET /sudoku-game`：`authenticateToken`
  - `POST /sudoku-game`：`authenticateToken` + `validateJsonHeader`
  - `PATCH /sudoku-game`：`authenticateToken` + `validateJsonHeader`

這種拆分讓：

- middleware 專注在橫切關注點（auth/header validation）
- controller 專注在資料 CRUD 與錯誤處理

#### 2) Auth：JWT + Google OAuth

`controllers/authController.ts`：

- `POST /login`：email/password -> JWT
- `POST /register`：建立帳號
- `POST /oauth`：Google credential -> verify -> 建/綁定 user -> JWT
- `GET /me`：使用 `authenticateWithTokenRefresh`，允許 token 過期時自動 refresh，回 `X-New-Token`

本專案的面試 demo 路線以 **email/password** 為主（更適合 Web + App 同時跑通）；Google OAuth 可作為加分項保留，但不作為兩週內的主交付。

前端配合點：

- `utilities/api.ts` 自動吸收 `X-New-Token`
- `401/403` 觸發 `auth:expired`

#### 3) Prisma schema 與資料模型

`backend/prisma/schema.prisma` 主要模型：

- `User`
  - one-to-one: `SudokuGame`
  - one-to-many: `SudoKuHistory[]`
- `SudokuGame`：保存 puzzle/board/level/initialPuzzle（Json）
- `SudoKuHistory`：保存每次紀錄的 puzzle/board/level/isComplete

---

## 開發與啟動（最小指南）

### Backend

```bash
npm install
npm run dev
```

需要環境變數（建議用 `.env`）：

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `PORT`（可選，預設 3000）

### Frontend

```bash
npm install
npm run dev
```

需要 `frontend/.env`（Vite）：

- `VITE_BACKEND_URL`
- `VITE_GOOGLE_CLIENT_ID`

---

## 未來可優化項目

### Frontend

- **Router 抽象化**：把 hash routing 從 `main.ts` 抽出去，做成 `Router` + `GameRegistry`
- **資料存取層**：讓 `games/*` 依賴更高層的 `repository` 介面，而不是直接呼叫 `api.*`
- **EventBus 抽象**：將 `window.dispatchEvent` 包成 `eventBus`，讓測試更容易、避免全域事件散落
- **StorageAdapter**：封裝 localStorage（統一 keys、可替換成 Capacitor Preferences），避免跨模組散落存取
- **同步狀態與離線策略**：針對 Sudoku 加入 `saving/saved/failed` UI 狀態、retry/queue（建議放在 repository/service）
- **ModalManager**：集中管理 modal lifecycle（login gate / end game），避免殘留與互相干擾
- **Game layering（MVP/Presenter）**：將 Sudoku 的 state/sync 與 DOM UI 組裝拆分，讓邏輯可測/可維護

### App（Capacitor）

- **環境切換**：App build-time 注入 backend URL（或 runtime config），避免 hardcode
- **CORS/Origin 策略**：後端 allowlist web domain + Capacitor origin（例如 `capacitor://localhost`）
- **Network 狀態偵測**：Web 使用 online/offline；App 使用 Capacitor Network plugin
- **Storage 策略**：token/user 儲存改用 Preferences/secure storage（時間允許）
- **Release pipeline**：iOS TestFlight + Android APK/internal testing 的打包與驗收流程

### Backend

- **Service/Repository 分層**：將 controller 的資料存取與業務規則抽到 `services/*`，controller 僅負責 HTTP 層
- **共用錯誤處理**：統一錯誤格式與 status code（例如集中化 error handler middleware）
- **Request schema validation**：為主要 API 加上 request body/params 驗證，避免 controller 內散落型別檢查
