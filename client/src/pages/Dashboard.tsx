import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useJobs } from '@/context/JobsContext';
import { cn, STATUS_COLORS, formatDate } from '@/lib/utils';
import {
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';

export default function Dashboard() {
  const { stats, jobs, fetchStats, isLoading } = useJobs();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const recentJobs = jobs.slice(0, 5);

  const statCards = [
    {
      name: 'Total Active Jobs',
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      color: 'bg-primary',
      textColor: 'text-primary',
    },
    {
      name: 'Jobs This Month',
      value: stats?.jobsThisMonth || 0,
      icon: Clock,
      color: 'bg-violet-500',
      textColor: 'text-violet-600',
    },
    {
      name: 'Awaiting Approval',
      value: stats?.awaitingApproval || 0,
      icon: AlertTriangle,
      color: 'bg-warning',
      textColor: 'text-warning',
    },
    {
      name: 'Completed',
      value: stats?.completedJobs || 0,
      icon: CheckCircle,
      color: 'bg-success',
      textColor: 'text-success',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-500 mt-1">Overview of your sign business</p>
        </div>
        <Link to="/jobs" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                <p className="text-sm text-secondary-500">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {stats && stats.overdueJobs > 0 && (
        <div className="card p-4 bg-danger/5 border-danger/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <div>
              <p className="font-medium text-danger">Overdue Jobs</p>
              <p className="text-sm text-secondary-600">
                You have {stats.overdueJobs} job{stats.overdueJobs > 1 ? 's' : ''} past the target date
              </p>
            </div>
            <Link to="/jobs?status=overdue" className="ml-auto btn-secondary text-sm">
              View All
            </Link>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && stats.statusBreakdown.length > 0 && (
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Jobs by Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {stats.statusBreakdown.map((item) => (
              <div
                key={item.status}
                className={cn(
                  'p-3 rounded-lg border',
                  STATUS_COLORS[item.status] || 'bg-secondary-100 text-secondary-600'
                )}
              >
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs font-medium truncate">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Jobs</h2>
          <Link to="/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500">No jobs yet. Create your first job to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{job.displayId}</span>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{job.clientName}</p>
                    <p className="text-sm text-secondary-500 truncate max-w-xs">
                      {job.jobDescription}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      'badge',
                      STATUS_COLORS[job.currentStatus] || 'bg-secondary-100 text-secondary-600'
                    )}
                  >
                    {job.currentStatus}
                  </span>
                  {job.targetDate && (
                    <span className="text-sm text-secondary-500 whitespace-nowrap">
                      {formatDate(job.targetDate)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
