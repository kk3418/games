import { api } from '@/utilities/api';

export interface SnakeGameData {
  highestScore: number;
  currentScore: number;
  level: string;
  foodPosition: { x: number; y: number };
  snakePosition: { x: number; y: number }[];
  snakeLength: number;
}

export const getSnakeGame = async (): Promise<SnakeGameData> => {
  return await api.get<SnakeGameData>('/snake-game');
};

export const updateSnakeGame = async (data: Partial<SnakeGameData>): Promise<SnakeGameData> => {
  return await api.patch<SnakeGameData>('/snake-game', data);
};
