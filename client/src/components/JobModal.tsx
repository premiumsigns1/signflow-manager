import { useState } from 'react';
import { Job, useJobs } from '@/context/JobsContext';
import { cn, STATUSES, STATUS_COLORS, formatDate } from '@/lib/utils';
import { X, Calendar, User, FileText, Link as LinkIcon, Package, Clock, CheckCircle, CreditCard, Archive, RotateCcw, Flag } from 'lucide-react';
import { PAYMENT_STATUSES } from '@/lib/utils';

interface JobModalProps {
  job: Job;
  onClose: () => void;
  showArchiveControls?: boolean;
}

export default function JobModal({ job, onClose, showArchiveControls = false }: JobModalProps) {
  const { updateJob, updateJobStatus, archiveJob, deleteJob, fetchStats } = useJobs();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({
    ...job,
    targetDate: job.targetDate ? job.targetDate.split('T')[0] : '',
    paymentDate: job.paymentDate ? job.paymentDate.split('T')[0] : '',
    installationDate: job.installationDate ? job.installationDate.split('T')[0] : '',
  });

  const handleSave = async () => {
    try {
      const updated = await updateJob(job.id, {
        ...editData,
        targetDate: editData.targetDate ? new Date(editData.targetDate).toISOString() : null,
        paymentDate: editData.paymentDate ? new Date(editData.paymentDate).toISOString() : null,
        installationDate: editData.installationDate ? new Date(editData.installationDate).toISOString() : null,
      });
      setEditData({
        ...updated,
        targetDate: updated.targetDate ? updated.targetDate.split('T')[0] : '',
        paymentDate: updated.paymentDate ? updated.paymentDate.split('T')[0] : '',
        installationDate: updated.installationDate ? updated.installationDate.split('T')[0] : '',
      });
      setIsEditing(false);
      fetchStats();
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateJobStatus(job.id, newStatus);
      setEditData({ ...editData, currentStatus: newStatus });
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary">{job.displayId}</span>
            <span className={cn('badge', STATUS_COLORS[job.currentStatus])}>
              {job.currentStatus}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg">
            <X className="w-5 h-5 text-secondary-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase">Client Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.clientName}
                  onChange={(e) => setEditData({ ...editData, clientName: e.target.value })}
                  className="input mt-1"
                />
              ) : (
                <p className="font-medium text-secondary-900">{job.clientName}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase">Contact</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.clientContact}
                  onChange={(e) => setEditData({ ...editData, clientContact: e.target.value })}
                  className="input mt-1"
                />
              ) : (
                <p className="text-secondary-700">{job.clientContact}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-secondary-500 uppercase">Status</label>
            <select
              value={editData.currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input mt-1"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Payment Status
            </label>
            <select
              value={editData.paymentStatus || ''}
              onChange={async (e) => {
                const val = e.target.value;
                setEditData({ ...editData, paymentStatus: val });
                try {
                  await updateJob(job.id, { paymentStatus: val });
                } catch (err) {
                  console.error('Failed to update payment status:', err);
                }
              }}
              className="input mt-1"
            >
              <option value="">Not set</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editData.jobDescription}
                onChange={(e) => setEditData({ ...editData, jobDescription: e.target.value })}
                className="input mt-1 min-h-[80px]"
              />
            ) : (
              <p className="text-secondary-700 mt-1">{job.jobDescription}</p>
            )}
          </div>

          {/* Target & Payment Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Target Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.targetDate}
                  onChange={(e) => setEditData({ ...editData, targetDate: e.target.value })}
                  className="input mt-1"
                />
              ) : (
                <p className="text-secondary-700 mt-1">
                  {job.targetDate ? formatDate(job.targetDate) : 'Not set'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Payment Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.paymentDate}
                  onChange={(e) => setEditData({ ...editData, paymentDate: e.target.value })}
                  className="input mt-1"
                />
              ) : (
                <p className="text-secondary-700 mt-1">
                  {job.paymentDate ? formatDate(job.paymentDate) : 'Not paid'}
                </p>
              )}
            </div>
          </div>

          {/* Start / Finish Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
                <Flag className="w-3 h-3" />
                Start Date
              </label>
              <p className="text-secondary-700 mt-1">
                {job.startDate ? formatDate(job.startDate) : 'Not recorded'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Finish Date
              </label>
              <p className="text-secondary-700 mt-1">
                {job.finishDate ? formatDate(job.finishDate) : 'Not completed'}
              </p>
            </div>
          </div>

          {/* Assignment & Installation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
                <User className="w-3 h-3" />
                Assigned To
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.assignedTo || ''}
                  onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                  className="input mt-1"
                  placeholder="Assign to..."
                />
              ) : (
                <p className="text-secondary-700 mt-1">{job.assignedTo || 'Not assigned'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Installation Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.installationDate}
                  onChange={(e) => setEditData({ ...editData, installationDate: e.target.value })}
                  className="input mt-1"
                />
              ) : (
                <p className="text-secondary-700 mt-1">
                  {job.installationDate ? formatDate(job.installationDate) : 'Not scheduled'}
                </p>
              )}
            </div>
          </div>

          {/* Proof Link */}
          <div>
            <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              Proof Link
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editData.proofLink || ''}
                onChange={(e) => setEditData({ ...editData, proofLink: e.target.value })}
                className="input mt-1"
                placeholder="https://..."
              />
            ) : job.proofLink ? (
              <a
                href={job.proofLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline mt-1 block"
              >
                {job.proofLink}
              </a>
            ) : (
              <p className="text-secondary-500 mt-1">No proof uploaded</p>
            )}
          </div>

          {/* Materials */}
          <div>
            <label className="text-xs font-medium text-secondary-500 uppercase flex items-center gap-1">
              <Package className="w-3 h-3" />
              Materials Needed
            </label>
            {isEditing ? (
              <textarea
                value={editData.materialsNeeded || ''}
                onChange={(e) => setEditData({ ...editData, materialsNeeded: e.target.value })}
                className="input mt-1 min-h-[60px]"
                placeholder="List materials..."
              />
            ) : (
              <p className="text-secondary-700 mt-1">{job.materialsNeeded || 'No materials listed'}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-secondary-500 uppercase">Notes</label>
            {isEditing ? (
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="input mt-1 min-h-[60px]"
                placeholder="Add notes..."
              />
            ) : (
              <p className="text-secondary-700 mt-1">{job.notes || 'No notes'}</p>
            )}
          </div>
        </div>

        {/* Archive Section */}
        {showArchiveControls && job.currentStatus === 'Completed/Delivered' && (
          <div className="p-4 border-t border-secondary-200 bg-secondary-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-secondary-600" />
                <span className="text-sm font-medium text-secondary-700">
                  {job.archived === 1 ? 'Archived' : 'Not archived'}
                </span>
                {job.archivedAt && (
                  <span className="text-xs text-secondary-500">
                    ({formatDate(job.archivedAt)})
                  </span>
                )}
              </div>
              <button
                onClick={async () => {
                  const action = job.archived === 1 ? 'unarchive' : 'archive';
                  if (confirm(`Are you sure you want to ${action} this job?`)) {
                    await archiveJob(job.id, job.archived !== 1);
                    fetchStats();
                    onClose();
                  }
                }}
                className={`btn-sm ${job.archived === 1 ? 'btn-secondary' : 'btn-primary'}`}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {job.archived === 1 ? 'Unarchive' : 'Archive'}
              </button>
            </div>
            <p className="text-xs text-secondary-500 mt-2">
              Archived jobs are hidden from the main Jobs view but remain searchable in the Archived section.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between gap-2 p-4 border-t border-secondary-200">
          {/* Delete button at left */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this job? This cannot be undone.')) {
                deleteJob(job.id);
                onClose();
              }
            }}
            className="btn-danger"
          >
            Delete Job
          </button>

          <div className="flex gap-2 ml-auto">
            {/* Archive toggle in modal when archive controls are enabled */}
            {showArchiveControls && job.currentStatus === 'Completed/Delivered' && job.archived === 0 && (
              <button
                onClick={async () => {
                  if (confirm('Archive this completed job?')) {
                    await archiveJob(job.id, true);
                    fetchStats();
                    onClose();
                  }
                }}
                className="btn-secondary"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Job
              </button>
            )}
            {showArchiveControls && job.currentStatus === 'Completed/Delivered' && job.archived === 1 && (
              <button
                onClick={async () => {
                  if (confirm('Restore this job to active status?')) {
                    await archiveJob(job.id, false);
                    fetchStats();
                    onClose();
                  }
                }}
                className="btn-secondary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Job
              </button>
            )}

            {/* Edit/Save buttons */}
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                Edit Job
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
