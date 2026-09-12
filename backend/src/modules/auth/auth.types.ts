export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
}
