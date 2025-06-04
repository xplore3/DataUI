export interface ResponseData<T> {
  data: T;
  message: string;
  success: boolean;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface Tag {
  id: string;
}

export interface UserProfile {
  userId: string;
  taskId: string;
  gender: string
  password:string
  username: string;
  agentname: string;
  address: string;
  bio?: string | string[];
  points?: number;
  agentCfg?: {
    enabled: boolean;
    interval: string;
    imitate: string;
  };
  style?: {
    all: string[];
    chat: string[];
    post: string[];
  };
  adjectives?: string[];
  lore?: string[];
  knowledge?: string[];
  topics?: string[];
}

export interface LoginForm {
  username: string;
  password: string;
  email: string;
}

export interface AgentConfig {
  styles: string[];
  kols: string[];
  quote: string;
}

export interface ProfileUpdateRequest {
  agentId: string;
  profile: UserProfile;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    profile: UserProfile;
  };
}

export interface ProfileQueryResponse {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    profile: UserProfile;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
