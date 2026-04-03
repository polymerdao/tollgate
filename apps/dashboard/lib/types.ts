export interface User {
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface SessionData {
  user: User;
  raw: Record<string, unknown> | null;
}

export interface SessionState {
  data: SessionData | null;
  isPending: boolean;
  error: Error | null;
}

export function getUserFromSession(state: SessionState): User | null {
  return state.data?.user ?? null;
}
