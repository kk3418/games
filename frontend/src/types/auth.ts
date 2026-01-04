export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
