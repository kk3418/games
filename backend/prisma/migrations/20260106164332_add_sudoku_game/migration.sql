-- CreateTable
CREATE TABLE "SudokuGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "puzzle" JSONB NOT NULL,
    "board" JSONB NOT NULL,
    "level" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SudokuGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SudokuGame_userId_key" ON "SudokuGame"("userId");
