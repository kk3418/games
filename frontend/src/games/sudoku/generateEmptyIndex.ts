import { random } from 'lodash-es'

export default function generateEmptyIndex(level: string): number[] {
  let numberOfEmpty = 30

  switch (level) {
    case 'easy':
      numberOfEmpty = 30
      break
    case 'medium':
      numberOfEmpty = 40
      break
    case 'hard':
      numberOfEmpty = 50
      break
    default:
      numberOfEmpty = 30
  }

  let i = 1
  const emptyIndexes: number[] = []

  while (i <= numberOfEmpty) {
    const newRandomIndex = random(0, 80)
    if (!emptyIndexes.includes(newRandomIndex)) {
      emptyIndexes.push(newRandomIndex)
      i += 1
    }
  }

  return emptyIndexes
}
