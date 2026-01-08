import { Request, Response } from 'express';
import { prisma } from '@/prismaInstance';

export const getSnakeGameScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    let snakeGame = await prisma.snakeGame.findUnique({
      where: { userId },
    });

    if (!snakeGame) {
      // If no record exists, create one with default values
      snakeGame = await prisma.snakeGame.create({
        data: {
          userId,
          highestScore: 0,
          currentScore: 0,
        },
      });
    }

    res.json(snakeGame);
  } catch (error) {
    console.error('Error fetching snake game score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSnakeGameScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentScore, highestScore, level, snakeLength, snakePosition, foodPosition } = req.body;

    const existingRecord = await prisma.snakeGame.findUnique({
      where: { userId },
    });

    if (existingRecord) {
      res.status(400).json({ error: 'Snake game record already exists for this user' });
      return;
    }

    const snakeGame = await prisma.snakeGame.create({
      data: {
        userId,
        currentScore,
        highestScore,
        level,
        snakeLength,
        snakePosition,
        foodPosition,
      },
    });

    res.status(201).json(snakeGame);
  } catch (error) {
    console.error('Error creating snake game score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSnakeGameScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentScore, level, snakePosition, foodPosition } = req.body;

    if (
      currentScore !== undefined &&
      (typeof currentScore !== 'number' || !Number.isFinite(currentScore))
    ) {
      res.status(400).json({ error: 'Invalid currentScore' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (currentScore !== undefined) updateData.currentScore = currentScore;
    if (level !== undefined) updateData.level = level;
    if (snakePosition !== undefined) {
      updateData.snakePosition = snakePosition;
      updateData.snakeLength = Array.isArray(snakePosition) ? snakePosition.length : undefined;
    }
    if (foodPosition !== undefined) updateData.foodPosition = foodPosition;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const snakeGame = await prisma.$transaction(async (tx) => {
      await tx.snakeGame.update({
        where: { userId },
        data: updateData,
      });

      if (typeof currentScore === 'number' && Number.isFinite(currentScore)) {
        await tx.snakeGame.updateMany({
          where: {
            userId,
            highestScore: {
              lt: currentScore,
            },
          },
          data: {
            highestScore: currentScore,
          },
        });
      }

      return tx.snakeGame.findUnique({ where: { userId } });
    });

    if (!snakeGame) {
      res.status(404).json({ error: 'Snake game record not found' });
      return;
    }

    res.json(snakeGame);
  } catch (error) {
    console.error('Error updating snake game score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
