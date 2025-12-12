import { random } from 'lodash-es'

export default function generateEmptyIndex(level: string): number[] {
  let numberOfEmpty = 25

  switch (level) {
    case 'easy':
      numberOfEmpty = 25
      break;
    case 'medium':
      numberOfEmpty = 35
      break;
    case 'hard':
      numberOfEmpty = 45
      break;
    default:
      numberOfEmpty = 25
  }

  let i = 1
  const emptyIndexes: number[] = []

  while (i <= numberOfEmpty) {
    const newRandomIndex = random(0, 80);
    if (!emptyIndexes.includes(newRandomIndex)) {
      emptyIndexes.push(newRandomIndex)
      i += 1
    }
  }


  return emptyIndexes
}
