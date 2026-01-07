import { Request, Response } from 'express';
import { prisma } from '@/prismaInstance';

export const getSudokuGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const sudokuGame = await prisma.sudokuGame.findUnique({
      where: { userId },
    });

    if (!sudokuGame) {
      res.status(404).json({ error: 'Sudoku game record not found' });
      return;
    }

    res.json(sudokuGame);
  } catch (error) {
    console.error('Error fetching sudoku game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSudokuGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { puzzle, board, level } = req.body;

    const existingRecord = await prisma.sudokuGame.findUnique({
      where: { userId },
    });

    if (JSON.stringify(existingRecord?.puzzle) === JSON.stringify(puzzle)) {
      res.status(400).json({ error: 'This puzzle already exists for this user' });
      return;
    }

    const sudokuGame = await prisma.sudokuGame.create({
      data: {
        userId,
        puzzle,
        board,
        level,
      },
    });

    res.status(201).json(sudokuGame);
  } catch (error) {
    console.error('Error creating sudoku game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSudokuGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const keys = Object.keys(req.body ?? {});
    const allowedKeys = new Set(['board']);
    const hasDisallowedKey = keys.some((k) => !allowedKeys.has(k));

    if (hasDisallowedKey) {
      res.status(400).json({ error: 'Only board can be updated' });
      return;
    }

    if (!('board' in (req.body ?? {}))) {
      res.status(400).json({ error: 'Missing board' });
      return;
    }

    const { board } = req.body;

    const existingRecord = await prisma.sudokuGame.findUnique({
      where: { userId },
    });

    if (!existingRecord) {
      res.status(404).json({ error: 'Sudoku game record not found' });
      return;
    }

    const sudokuGame = await prisma.sudokuGame.update({
      where: { userId },
      data: { board },
    });

    res.json(sudokuGame);
  } catch (error) {
    console.error('Error updating sudoku game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
