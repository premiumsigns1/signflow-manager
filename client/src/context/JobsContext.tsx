import React, { createContext, useContext, useState, useCallback } from 'react';

const API_BASE = '/api';

// Types
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
  paymentStatus: string | null;
  sortOrder: number;
  assignedTo: string | null;
  proofLink: string | null;
  materialsNeeded: string | null;
  installationDate: string | null;
  notes: string | null;
  startDate: string | null;
  finishDate: string | null;
  archived: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobData {
  clientName?: string | null;
  clientContact?: string | null;
  jobDescription?: string | null;
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
  paymentStatus?: string | null;
  assignedTo?: string | null;
  proofLink?: string | null;
  materialsNeeded?: string | null;
  installationDate?: string | null;
  notes?: string | null;
  startDate?: string | null;
  finishDate?: string | null;
  archived?: number;
  archivedAt?: string | null;
}

export interface JobStats {
  totalJobs: number;
  completedJobs: number;
  awaitingApproval: number;
  overdueJobs: number;
  jobsThisMonth: number;
  statusBreakdown: { status: string; count: number }[];
}

interface JobsContextType {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  stats: JobStats | null;
  isLoading: boolean;
  error: string | null;
  fetchJobs: (params?: { status?: string; search?: string; assignedTo?: string; includeArchived?: boolean }) => Promise<void>;
  archiveJob: (id: string, shouldArchive: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  createJob: (data: CreateJobData) => Promise<Job>;
  updateJob: (id: string, data: UpdateJobData) => Promise<Job>;
  updateJobStatus: (id: string, status: string) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async (params?: { status?: string; search?: string; assignedTo?: string; includeArchived?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.status && params.status !== 'all') qs.set('status', params.status);
      if (params?.search) qs.set('search', params.search);
      if (params?.assignedTo && params.assignedTo !== 'all') qs.set('assignedTo', params.assignedTo);
      if (params?.includeArchived) qs.set('includeArchived', 'true');

      const query = qs.toString();
      const data = await apiFetch<Job[]>(`/jobs${query ? `?${query}` : ''}`);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch<JobStats>('/jobs/stats/overview');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createJob = async (data: CreateJobData): Promise<Job> => {
    const job = await apiFetch<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setJobs(prev => [job, ...prev]);
    return job;
  };

  const updateJob = async (id: string, data: UpdateJobData): Promise<Job> => {
    const job = await apiFetch<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setJobs(prev => prev.map(j => j.id === id ? job : j));
    return job;
  };

  const updateJobStatus = async (id: string, currentStatus: string): Promise<Job> => {
    const job = await apiFetch<Job>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ currentStatus }),
    });
    setJobs(prev => prev.map(j => j.id === id ? job : j));
    return job;
  };

  const deleteJob = async (id: string) => {
    await apiFetch(`/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const archiveJob = async (id: string, shouldArchive: boolean) => {
    const job = await apiFetch<Job>(`/jobs/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archive: shouldArchive }),
    });
    setJobs(prev => prev.map(j => j.id === id ? job : j));
    if (selectedJob?.id === id) setSelectedJob(job);
  };

  return (
    <JobsContext.Provider
      value={{
        jobs,
        setJobs,
        stats,
        isLoading,
        error,
        fetchJobs,
        fetchStats,
        createJob,
        updateJob,
        updateJobStatus,
        deleteJob,
        archiveJob,
        selectedJob,
        setSelectedJob,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}
