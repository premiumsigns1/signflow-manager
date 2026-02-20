import { useState } from 'react';
import { useJobs } from '@/context/JobsContext';
import { X, Calendar, User, FileText } from 'lucide-react';

interface CreateJobModalProps {
  onClose: () => void;
}

export default function CreateJobModal({ onClose }: CreateJobModalProps) {
  const { createJob, fetchStats } = useJobs();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    clientContact: '',
    jobDescription: '',
    targetDate: '',
    assignedTo: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await createJob({
        clientName: formData.clientName || null,
        clientContact: formData.clientContact || null,
        jobDescription: formData.jobDescription || null,
        targetDate: formData.targetDate || undefined,
        assignedTo: formData.assignedTo || undefined,
        notes: formData.notes || undefined,
      });
      fetchStats();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Create New Job</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg">
            <X className="w-5 h-5 text-secondary-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="label flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Client Name
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="input"
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label className="label">
              Client Contact
            </label>
            <input
              type="text"
              value={formData.clientContact}
              onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })}
              className="input"
              placeholder="Phone or email"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Job Description
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              className="input min-h-[100px]"
              placeholder="Describe the sign job..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label flex items-center gap-1">
                <User className="w-4 h-4" />
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="input"
                placeholder="Team member name"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-secondary-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
