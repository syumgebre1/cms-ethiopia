import axios from 'axios';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  Report,
  CreateReportInput,
  User,
} from '../types';

// ==================== Axios Instance ====================
const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// ==================== Request Interceptor ====================
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== Response Interceptor ====================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if ([401, 403].includes(status) && !url.includes('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================
export const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const res = await API.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const res = await API.post<AuthResponse>('/auth/login', data);
    return res.data;
  },
  me: async (): Promise<{ data: { user: User } }> => {
    const res = await API.get('/auth/me');
    return res.data;
  },
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const res = await API.patch('/auth/change-password', data);
    return res.data;
  },
};

// ==================== Report APIs ====================
export const reportApi = {
  create: async (
    data: CreateReportInput
  ): Promise<{ data: { report: Report } }> => {
    const res = await API.post('/reports', data);
    return res.data;
  },
  createAnonymous: async (data: {
    crime_type: string;
    description: string;
    location: string;
    urgency: string;
  }): Promise<{
    data: {
      report: { id: string; crime_type: string; reference: string };
    };
  }> => {
    const res = await API.post('/reports/anonymous', data);
    return res.data;
  },
  getMine: async (): Promise<{ data: { reports: Report[] } }> => {
    const res = await API.get('/reports/me');
    return res.data;
  },
  getAll: async (): Promise<{ data: { reports: Report[] } }> => {
    const res = await API.get('/reports/all');
    return res.data;
  },
  getById: async (id: string): Promise<{ data: { report: Report } }> => {
    const res = await API.get(`/reports/${id}`);
    return res.data;
  },
  updateStatus: async (
    id: string,
    status: string
  ): Promise<{ message: string; data: { report: Report } }> => {
    const res = await API.patch(`/reports/${id}/status`, { status });
    return res.data;
  },
};

// ==================== Admin APIs ====================
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'officer' | 'detective' | 'admin';
  is_verified: boolean;
  is_locked: boolean;
  createdAt: string;
}

export interface AuditConversation {
  id: string;
  user1: { id: string; full_name: string; email: string; role: string };
  user2: { id: string; full_name: string; email: string; role: string };
  last_message: Message | null;
  message_count: number;
  last_message_at: string | null;
}

export const adminApi = {
  listUsers: async (): Promise<{ data: { users: AdminUser[] } }> => {
    const res = await API.get('/admin/users');
    return res.data;
  },
  createUser: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    national_id?: string;
    role: 'officer' | 'detective' | 'admin';
  }): Promise<{ message: string; data: { user: AdminUser } }> => {
    const res = await API.post('/admin/users', data);
    return res.data;
  },
  updateUser: async (
    id: string,
    data: {
      role?: 'citizen' | 'officer' | 'detective' | 'admin';
      is_locked?: boolean;
      is_verified?: boolean;
    }
  ): Promise<{ message: string; data: { user: AdminUser } }> => {
    const res = await API.patch(`/admin/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const res = await API.delete(`/admin/users/${id}`);
    return res.data;
  },
  resetPassword: async (
    id: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const res = await API.patch(`/admin/users/${id}/reset-password`, {
      newPassword,
    });
    return res.data;
  },
  listAllConversations: async (search?: string): Promise<{
    data: { conversations: AuditConversation[] };
  }> => {
    const res = await API.get('/admin/conversations', {
      params: search ? { search } : {},
    });
    return res.data;
  },
  getConversationMessages: async (
    id: string
  ): Promise<{
    data: {
      conversation: {
        id: string;
        user1: { id: string; full_name: string; email: string };
        user2: { id: string; full_name: string; email: string };
      };
      messages: Message[];
    };
  }> => {
    const res = await API.get(`/admin/conversations/${id}`);
    return res.data;
  },
};

// ==================== Messaging Types ====================
export interface Contact {
  id: string;
  full_name: string;
  email: string;
  role: 'citizen' | 'officer' | 'detective' | 'admin';
  is_online: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  is_read: boolean;
  is_deleted: boolean;
  createdAt: string;
  sender?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface ConversationSummary {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    role: string;
    is_online: boolean;
  };
  last_message: Message | null;
  unread_count: number;
  last_message_at: string | null;
}

// ==================== Messaging APIs ====================
export const messageApi = {
  getContacts: async (): Promise<{ data: { contacts: Contact[] } }> => {
    const res = await API.get('/messages/contacts');
    return res.data;
  },
  listConversations: async (): Promise<{
    data: { conversations: ConversationSummary[] };
  }> => {
    const res = await API.get('/messages/conversations');
    return res.data;
  },
  startConversation: async (
    otherUserId: string
  ): Promise<{
    data: {
      conversation: {
        id: string;
        other_user: Contact;
      };
    };
  }> => {
    const res = await API.post('/messages/conversations', { otherUserId });
    return res.data;
  },
  getMessages: async (
    conversationId: string
  ): Promise<{
    data: {
      conversation: { id: string; other_user: Contact };
      messages: Message[];
    };
  }> => {
    const res = await API.get(`/messages/conversations/${conversationId}`);
    return res.data;
  },
  sendMessage: async (
    conversationId: string,
    body: string
  ): Promise<{ data: { message: Message } }> => {
    const res = await API.post(`/messages/conversations/${conversationId}`, {
      body,
    });
    return res.data;
  },
  sendAttachment: async (
    conversationId: string,
    file: File,
    caption?: string
  ): Promise<{ data: { message: Message } }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);

    const res = await API.post(
      `/messages/conversations/${conversationId}/attachment`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
  deleteMessage: async (messageId: string): Promise<{ message: string }> => {
    const res = await API.delete(`/messages/${messageId}`);
    return res.data;
  },
};

// ==================== Alert Types ====================
export type AlertType = 'fugitive' | 'missing' | 'wanted' | 'announcement';
export type AlertStatus = 'active' | 'caught' | 'found' | 'archived';

export interface PublicAlert {
  id: string;
  type: AlertType;
  title: string;
  full_name: string | null;
  age: number | null;
  description: string;
  photo_url: string | null;
  last_seen_location: string | null;
  reward: string | null;
  status: AlertStatus;
  posted_by: string;
  poster?: { id: string; full_name: string; role: string };
  createdAt: string;
}

// ==================== Alert APIs ====================
export const alertApi = {
  getPublic: async (params?: {
    type?: AlertType;
    search?: string;
  }): Promise<{ data: { alerts: PublicAlert[] } }> => {
    const res = await API.get('/alerts/public', { params });
    return res.data;
  },
  list: async (): Promise<{ data: { alerts: PublicAlert[] } }> => {
    const res = await API.get('/alerts');
    return res.data;
  },
  create: async (data: {
    type: AlertType;
    title: string;
    full_name?: string;
    age?: number;
    description: string;
    last_seen_location?: string;
    reward?: string;
    status?: AlertStatus;
    photo?: File;
  }): Promise<{ message: string; data: { alert: PublicAlert } }> => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.full_name) formData.append('full_name', data.full_name);
    if (data.age !== undefined) formData.append('age', String(data.age));
    if (data.last_seen_location)
      formData.append('last_seen_location', data.last_seen_location);
    if (data.reward) formData.append('reward', data.reward);
    if (data.status) formData.append('status', data.status);
    if (data.photo) formData.append('photo', data.photo);

    const res = await API.post('/alerts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  update: async (
    id: string,
    data: Partial<{
      type: AlertType;
      title: string;
      full_name: string;
      age: number;
      description: string;
      last_seen_location: string;
      reward: string;
      status: AlertStatus;
      photo: File;
    }>
  ): Promise<{ message: string; data: { alert: PublicAlert } }> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'photo' && value instanceof File) {
          formData.append('photo', value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const res = await API.patch(`/alerts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await API.delete(`/alerts/${id}`);
    return res.data;
  },
};

export default API;