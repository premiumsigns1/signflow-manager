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
  'Quoted/Awaiting',
  'Ready for Proofing',
  'Awaiting Proof Approval',
  'Order Materials',
  'Manufacturing/Production',
  'Ready for Dispatch/Installation',
  'Completed/Delivered',
];

export const STATUS_COLORS: Record<string, string> = {
  'Quote/Pending': 'bg-warning/10 text-warning border-warning/20',
  'Quoted/Awaiting': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'Ready for Proofing': 'bg-primary/10 text-primary border-primary/20',
  'Awaiting Proof Approval': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'Order Materials': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'Manufacturing/Production': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'Ready for Dispatch/Installation': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'Completed/Delivered': 'bg-success/10 text-success border-success/20',
};

export const PAYMENT_STATUSES = ['Owed in Full', 'Deposit Paid', 'Paid in Full'];

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  'Owed in Full': 'bg-danger/10 text-danger border-danger/20',
  'Deposit Paid': 'bg-warning/10 text-warning border-warning/20',
  'Paid in Full': 'bg-success/10 text-success border-success/20',
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  'Quote/Pending': 'border-l-warning',
  'Quoted/Awaiting': 'border-l-yellow-500',
  'Ready for Proofing': 'border-l-primary',
  'Awaiting Proof Approval': 'border-l-violet-500',
  'Order Materials': 'border-l-cyan-500',
  'Manufacturing/Production': 'border-l-pink-500',
  'Ready for Dispatch/Installation': 'border-l-orange-500',
  'Completed/Delivered': 'border-l-success',
};
