export interface AuthServiceResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    _id: string;
    email: string;
    username: string;
    role: string;
  };
  error?: string;
}
