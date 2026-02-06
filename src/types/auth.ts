export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  turnstileToken: string;
}

export interface LoginData {
  email: string;
  password: string;
  turnstileToken: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  error?: string;
}

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}
