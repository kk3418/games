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

export const updateSnakeGameScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentScore, highestScore } = req.body;

    const updateData: any = {};
    if (currentScore !== undefined) updateData.currentScore = currentScore;
    if (highestScore !== undefined) updateData.highestScore = highestScore;

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
