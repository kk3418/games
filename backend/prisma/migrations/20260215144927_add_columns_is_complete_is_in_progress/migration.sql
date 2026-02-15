-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SudokuGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "puzzle" JSONB NOT NULL,
    "board" JSONB NOT NULL,
    "level" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "initialPuzzle" JSONB NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isInProgress" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SudokuGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SudokuGame" ("board", "createdAt", "id", "initialPuzzle", "level", "puzzle", "updatedAt", "userId") SELECT "board", "createdAt", "id", "initialPuzzle", "level", "puzzle", "updatedAt", "userId" FROM "SudokuGame";
DROP TABLE "SudokuGame";
ALTER TABLE "new_SudokuGame" RENAME TO "SudokuGame";
CREATE UNIQUE INDEX "SudokuGame_userId_key" ON "SudokuGame"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
