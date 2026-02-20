import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// API_BASE would be used for cloud storage

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
  assignedTo: string | null;
  proofLink: string | null;
  materialsNeeded: string | null;
  installationDate: string | null;
  notes: string | null;
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

interface JobsContextType {
  jobs: Job[];
  stats: JobStats | null;
  isLoading: boolean;
  error: string | null;
  fetchJobs: (params?: { status?: string; search?: string; assignedTo?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  createJob: (data: CreateJobData) => Promise<Job>;
  updateJob: (id: string, data: UpdateJobData) => Promise<Job>;
  updateJobStatus: (id: string, status: string) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const STORAGE_KEY = 'signflow_jobs';
let jobCounter = 1;

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getNextDisplayId(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const jobs: Job[] = JSON.parse(stored);
    if (jobs.length > 0) {
      const maxNum = jobs.reduce((max, job) => {
        const num = parseInt(job.displayId.replace('SIGN-', ''));
        return num > max ? num : max;
      }, 0);
      jobCounter = maxNum + 1;
    }
  }
  const id = `SIGN-${String(jobCounter).padStart(3, '0')}`;
  jobCounter++;
  return id;
}

function calculateStats(jobs: Job[]): JobStats {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.currentStatus === 'Completed/Delivered').length;
  const awaitingApproval = jobs.filter(j => j.currentStatus === 'Awaiting Proof Approval').length;
  const overdueJobs = jobs.filter(j => 
    j.targetDate && new Date(j.targetDate) < now && j.currentStatus !== 'Completed/Delivered'
  ).length;
  const jobsThisMonth = jobs.filter(j => new Date(j.createdAt) >= startOfMonth).length;
  
  const statusCounts: Record<string, number> = {};
  jobs.forEach(job => {
    statusCounts[job.currentStatus] = (statusCounts[job.currentStatus] || 0) + 1;
  });
  
  const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));
  
  return {
    totalJobs,
    completedJobs,
    awaitingApproval,
    overdueJobs,
    jobsThisMonth,
    statusBreakdown,
  };
}

function saveJobs(jobs: Job[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const jobsData = JSON.parse(stored);
        setJobs(jobsData);
        setStats(calculateStats(jobsData));
      } catch (e) {
        console.error('Failed to parse stored jobs:', e);
      }
    }
  }, []);

  const fetchJobs = useCallback(async (params?: { status?: string; search?: string; assignedTo?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let jobsData: Job[] = stored ? JSON.parse(stored) : [];
      
      if (params?.status && params.status !== 'all') {
        jobsData = jobsData.filter(j => j.currentStatus === params.status);
      }
      
      if (params?.assignedTo && params.assignedTo !== 'all') {
        jobsData = jobsData.filter(j => j.assignedTo === params.assignedTo);
      }
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        jobsData = jobsData.filter(j => 
          j.clientName.toLowerCase().includes(search) ||
          j.displayId.toLowerCase().includes(search) ||
          j.jobDescription.toLowerCase().includes(search)
        );
      }
      
      jobsData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setJobs(jobsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const jobsData: Job[] = stored ? JSON.parse(stored) : [];
      setStats(calculateStats(jobsData));
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createJob = async (data: CreateJobData): Promise<Job> => {
    const now = new Date();
    const nowStr = now.toISOString();
    
    const newJob: Job = {
      id: generateId(),
      displayId: getNextDisplayId(),
      clientName: data.clientName || '',
      clientContact: data.clientContact || '',
      jobDescription: data.jobDescription || '',
      orderDate: nowStr,
      paymentDate: null,
      targetDate: data.targetDate || null,
      assignedTo: data.assignedTo || null,
      proofLink: null,
      materialsNeeded: null,
      installationDate: null,
      notes: data.notes || null,
      currentStatus: 'Quote/Pending',
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const jobsData: Job[] = stored ? JSON.parse(stored) : [];
    jobsData.unshift(newJob);
    saveJobs(jobsData);
    
    setJobs(jobsData);
    return newJob;
  };

  const updateJob = async (id: string, data: UpdateJobData): Promise<Job> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const jobsData: Job[] = stored ? JSON.parse(stored) : [];
    
    const index = jobsData.findIndex(j => j.id === id);
    if (index === -1) throw new Error('Job not found');
    
    const updatedJob: Job = {
      ...jobsData[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    jobsData[index] = updatedJob;
    saveJobs(jobsData);
    setJobs(jobsData);
    return updatedJob;
  };

  const updateJobStatus = async (id: string, currentStatus: string): Promise<Job> => {
    return updateJob(id, { currentStatus });
  };

  const deleteJob = async (id: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const jobsData: Job[] = stored ? JSON.parse(stored) : [];
    
    const filteredJobs = jobsData.filter(j => j.id !== id);
    saveJobs(filteredJobs);
    setJobs(filteredJobs);
  };

  return (
    <JobsContext.Provider
      value={{
        jobs,
        stats,
        isLoading,
        error,
        fetchJobs,
        fetchStats,
        createJob,
        updateJob,
        updateJobStatus,
        deleteJob,
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
