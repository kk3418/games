-- CreateTable
CREATE TABLE "SnakeGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "highestScore" INTEGER,
    "currentScore" INTEGER,
    "userId" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SnakeGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SnakeGame_userId_key" ON "SnakeGame"("userId");
