import { random } from 'lodash-es'

export default function shuffleArray(arr: number[]) {
  for (let i = 0; i < arr.length; i++) {
    const switchIndex = random(0, arr.length - 1)
    const tmp = arr[i]
    arr[i] = arr[switchIndex]
    arr[switchIndex] = tmp
  }

  return arr
}
