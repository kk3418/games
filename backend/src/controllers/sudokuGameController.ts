import { Request, Response } from 'express';
import { prisma } from '@/prismaInstance';

export const getSudokuGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const sudokuGame = await prisma.sudokuGame.findFirst({
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
    const { puzzle, initialPuzzle, board, level } = req.body;

    const existingRecord = await prisma.sudokuGame.findFirst({
      where: { userId, initialPuzzle },
    });

    if (existingRecord) {
      return res.status(400).json({ error: 'Sudoku game record already exists for this user' });
    }

    const sudokuGame = await prisma.sudokuGame.create({
      data: {
        userId,
        puzzle,
        initialPuzzle,
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

    const { puzzle, initialPuzzle, board, level, id, isComplete, isInProgress } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Id is required' });
    }

    const updateData: Record<string, unknown> = {};
    if (puzzle !== undefined) updateData.puzzle = puzzle;
    if (initialPuzzle !== undefined) updateData.initialPuzzle = initialPuzzle;
    if (board !== undefined) updateData.board = board;
    if (level !== undefined) updateData.level = level;
    if (isComplete !== undefined) updateData.isComplete = isComplete;
    if (isInProgress !== undefined) updateData.isInProgress = isInProgress;

    const updateResult = await prisma.sudokuGame.update({
      where: { id },
      data: updateData,
    });

    if (!updateResult) {
      res.status(404).json({ error: 'Sudoku game record not found' });
      return;
    }

    res.json(updateResult);
  } catch (error) {
    console.error('Error updating sudoku game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
