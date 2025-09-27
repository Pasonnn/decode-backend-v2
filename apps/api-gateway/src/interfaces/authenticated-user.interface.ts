export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
}
