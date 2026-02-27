import { Request, Response } from 'express'
import { prisma } from '@/prismaInstance'

// Get all history records for the authenticated user
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId

    const histories = await prisma.sudokuGame.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    res.json(histories)
  } catch (error) {
    console.error('Error fetching sudoku history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Create a new history record
export const createHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { initialPuzzle, puzzle, board, level, isComplete, isInProgress } = req.body

    if (!initialPuzzle || !puzzle || !board || !level || typeof isComplete !== 'boolean' || typeof isInProgress !== 'boolean') {
      res.status(400).json({ error: 'Fields are missing' })
      return
    }

    const history = await prisma.sudokuGame.create({
      data: {
        userId,
        puzzle,
        initialPuzzle,
        board,
        level,
        isComplete,
        isInProgress,
      },
    })

    res.status(201).json(history)
  } catch (error) {
    console.error('Error creating sudoku history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update only isComplete for a history record owned by the user
export const updateHistoryStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const historyId = Number(req.params.id)
    const { isInProgress } = req.body

    if (Number.isNaN(historyId)) {
      res.status(400).json({ error: 'Invalid history id' })
      return
    }

    if ( typeof isInProgress !== 'boolean') {
      res.status(400).json({ error: 'Fields are missing' })
      return
    }

    const updateResult = await prisma.sudokuGame.updateMany({
      where: { id: historyId, userId, isComplete: false },
      data: { isInProgress },
    })

    if (updateResult.count === 0) {
      res.status(404).json({ error: 'History record not found' })
      return
    }

    res.json(updateResult)
  } catch (error: any) {
    console.error('Error updating sudoku history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
