// ==================== User ====================
export type UserRole = 'citizen' | 'officer' | 'detective' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

// ==================== Auth ====================
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  national_id?: string;
}

export interface AuthResponse {
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// ==================== Report ====================
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'escalated'
  | 'resolved'
  | 'rejected';

export interface Report {
  id: string;
  crime_type: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  urgency: Urgency;
  status: ReportStatus;
  is_anonymous: boolean;
  user_id: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

export interface CreateReportInput {
  crime_type: string;
  description: string;
  location: string;
  urgency: Urgency;
  is_anonymous?: boolean;
  latitude?: number;
  longitude?: number;
}