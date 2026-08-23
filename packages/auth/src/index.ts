export type AuthSession={authenticated:boolean;subject?:string;};
export interface AuthProvider{login():Promise<void>;logout():Promise<void>;accessToken():Promise<string|null>;session():Promise<AuthSession>;}
export const AUTH_IMPLEMENTATION_STATUS="NOT_IMPLEMENTED";
