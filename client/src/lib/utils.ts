import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const STATUSES = [
  'Quote/Pending',
  'Ready for Proofing',
  'Awaiting Proof Approval',
  'Materials Ordered',
  'Manufacturing/Production',
  'Ready for Dispatch/Installation',
  'Completed/Delivered',
];

export const STATUS_COLORS: Record<string, string> = {
  'Quote/Pending': 'bg-warning/10 text-warning border-warning/20',
  'Ready for Proofing': 'bg-primary/10 text-primary border-primary/20',
  'Awaiting Proof Approval': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'Materials Ordered': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'Manufacturing/Production': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'Ready for Dispatch/Installation': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'Completed/Delivered': 'bg-success/10 text-success border-success/20',
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  'Quote/Pending': 'border-l-warning',
  'Ready for Proofing': 'border-l-primary',
  'Awaiting Proof Approval': 'border-l-violet-500',
  'Materials Ordered': 'border-l-cyan-500',
  'Manufacturing/Production': 'border-l-pink-500',
  'Ready for Dispatch/Installation': 'border-l-orange-500',
  'Completed/Delivered': 'border-l-success',
};
