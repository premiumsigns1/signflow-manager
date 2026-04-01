import { Job } from '@/context/JobsContext';
import { cn, STATUS_BORDER_COLORS, PAYMENT_STATUS_COLORS, formatDate } from '@/lib/utils';
import { Calendar, User } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  const isOverdue = job.targetDate && new Date(job.targetDate) < new Date() && job.currentStatus !== 'Completed/Delivered';

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-secondary-200 p-3 cursor-pointer hover:shadow-md transition-all',
        STATUS_BORDER_COLORS[job.currentStatus]
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {job.displayId}
        </span>
        {isOverdue && (
          <span className="text-xs text-danger bg-danger/10 px-2 py-0.5 rounded font-medium">
            Overdue
          </span>
        )}
      </div>

      <p className="font-medium text-secondary-900 text-sm mb-1 line-clamp-1">
        {job.clientName}
      </p>

      <p className="text-xs text-secondary-500 line-clamp-2 mb-3">
        {job.jobDescription}
      </p>

      <div className="flex items-center justify-between gap-1 flex-wrap text-xs text-secondary-500">
        {job.targetDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(job.targetDate)}
          </span>
        )}
        {job.assignedTo && (
          <span className="flex items-center gap-1 bg-secondary-100 px-2 py-0.5 rounded">
            <User className="w-3 h-3" />
            {job.assignedTo}
          </span>
        )}
      </div>

      {job.paymentStatus && (
        <div className="mt-2 pt-2 border-t border-secondary-100">
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded border',
            PAYMENT_STATUS_COLORS[job.paymentStatus] || 'bg-secondary-100 text-secondary-600 border-secondary-200'
          )}>
            {job.paymentStatus}
          </span>
        </div>
      )}
    </div>
  );
}
