const API_BASE = '/api';

interface ApiError {
  error: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, name: string) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  // Jobs
  async getJobs(params?: { status?: string; search?: string; assignedTo?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo);
    
    const query = searchParams.toString();
    return this.request<Job[]>(`/jobs${query ? `?${query}` : ''}`);
  }

  async getJob(id: string) {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(data: CreateJobData) {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: UpdateJobData) {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateJobStatus(id: string, currentStatus: string) {
    return this.request<Job>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ currentStatus }),
    });
  }

  async deleteJob(id: string) {
    return this.request<{ message: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats() {
    return this.request<JobStats>('/jobs/stats/overview');
  }
}

export const api = new ApiClient();

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface Job {
  id: string;
  displayId: string;
  clientName: string;
  clientContact: string;
  jobDescription: string;
  orderDate: string;
  paymentDate: string | null;
  targetDate: string | null;
  currentStatus: string;
  assignedTo: string | null;
  proofLink: string | null;
  materialsNeeded: string | null;
  installationDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateJobData {
  clientName: string;
  clientContact: string;
  jobDescription: string;
  targetDate?: string;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateJobData {
  clientName?: string;
  clientContact?: string;
  jobDescription?: string;
  targetDate?: string | null;
  paymentDate?: string | null;
  currentStatus?: string;
  assignedTo?: string | null;
  proofLink?: string | null;
  materialsNeeded?: string | null;
  installationDate?: string | null;
  notes?: string | null;
}

export interface JobStats {
  totalJobs: number;
  completedJobs: number;
  awaitingApproval: number;
  overdueJobs: number;
  jobsThisMonth: number;
  statusBreakdown: { status: string; count: number }[];
}
