-- CreateTable
CREATE TABLE "SnakeGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "highestScore" INTEGER,
    "currentScore" INTEGER,
    "level" TEXT,
    "foodPosition" JSONB,
    "snakePosition" JSONB,
    "snakeLength" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SnakeGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SnakeGame_userId_key" ON "SnakeGame"("userId");
