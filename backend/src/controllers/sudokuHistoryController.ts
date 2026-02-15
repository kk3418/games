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
    const { puzzle, board, level, isComplete = false } = req.body

    if (!puzzle || !board || !level) {
      res.status(400).json({ error: 'puzzle, board, and level are required' })
      return
    }

    const history = await prisma.sudokuGame.create({
      data: {
        user: {
          connect: { id: userId },
        },
        puzzle,
        initialPuzzle: puzzle,
        board,
        level,
        isComplete: Boolean(isComplete),
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
    const { isComplete } = req.body

    if (Number.isNaN(historyId)) {
      res.status(400).json({ error: 'Invalid history id' })
      return
    }

    if (typeof isComplete !== 'boolean') {
      res.status(400).json({ error: 'isComplete must be boolean' })
      return
    }

    const updateResult = await prisma.sudokuGame.updateMany({
      where: { id: historyId, userId },
      data: { isComplete },
    })

    if (updateResult.count === 0) {
      res.status(404).json({ error: 'History record not found' })
      return
    }

    const history = await prisma.sudokuGame.findUnique({ where: { id: historyId } })
    res.json(history)
  } catch (error: any) {
    console.error('Error updating sudoku history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
