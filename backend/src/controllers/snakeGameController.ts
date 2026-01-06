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
    const { currentScore, highestScore, level, snakeLength, snakePosition, foodPosition } = req.body;

    const updateData: any = {};
    if (currentScore !== undefined) updateData.currentScore = currentScore;
    if (highestScore !== undefined) updateData.highestScore = highestScore;
    if (level !== undefined) updateData.level = level;
    if (snakeLength !== undefined) updateData.snakeLength = snakeLength;
    if (snakePosition !== undefined) updateData.snakePosition = snakePosition;
    if (foodPosition !== undefined) updateData.foodPosition = foodPosition;

    const snakeGame = await prisma.snakeGame.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    res.json(snakeGame);
  } catch (error) {
    console.error('Error updating snake game score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
