import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useJobs } from '@/context/JobsContext';
import { cn, STATUSES, STATUS_COLORS, formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Calendar, User, Link as LinkIcon, Package, Edit, Trash2, Archive, RotateCcw } from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { jobs, updateJob, updateJobStatus, archiveJob, deleteJob, fetchStats } = useJobs();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob(id);
    }
  }, [id, jobs]);

  const loadJob = (jobId: string) => {
    const foundJob = jobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      setEditData(foundJob);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!job) return;
    try {
      const updated = await updateJob(job.id, editData);
      setJob(updated);
      setIsEditing(false);
      fetchStats();
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;
    try {
      const updated = await updateJobStatus(job.id, newStatus);
      setJob(updated);
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    try {
      await deleteJob(job.id);
      window.location.href = '/jobs';
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleArchive = async (shouldArchive: boolean) => {
    if (!job) return;
    try {
      await archiveJob(job.id, shouldArchive);
      fetchStats();
    } catch (error) {
      console.error('Failed to archive job:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Job not found</p>
        <Link to="/jobs" className="text-primary hover:underline mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/jobs" className="p-2 hover:bg-secondary-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{job.displayId}</span>
              <span className={cn('badge', STATUS_COLORS[job.currentStatus])}>
                {job.currentStatus}
              </span>
              {job.archived === 1 && (
                <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-1 rounded">
                  Archived
                </span>
              )}
            </div>
            <p className="text-secondary-500">{job.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Archive controls for completed jobs */}
          {job.currentStatus === 'Completed/Delivered' && (
            <button
              onClick={() => handleArchive(job.archived !== 1)}
              className={`btn-secondary ${job.archived === 1 ? 'bg-secondary-200' : ''}`}
            >
              {job.archived === 1 ? (
                <><RotateCcw className="w-4 h-4 mr-2" />Unarchive</>
              ) : (
                <><Archive className="w-4 h-4 mr-2" />Archive</>
              )}
            </button>
          )}
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
            <>
              <button onClick={() => setIsEditing(true)} className="btn-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Client Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase">Client Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.clientName || ''}
                    onChange={(e) => setEditData({ ...editData, clientName: e.target.value })}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-secondary-900 font-medium">{job.clientName}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase">Contact</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.clientContact || ''}
                    onChange={(e) => setEditData({ ...editData, clientContact: e.target.value })}
                    className="input mt-1"
                  />
                ) : (
                  <p className="text-secondary-900">{job.clientContact}</p>
                )}
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Job Description</h2>
            {isEditing ? (
              <textarea
                value={editData.jobDescription || ''}
                onChange={(e) => setEditData({ ...editData, jobDescription: e.target.value })}
                className="input min-h-[100px]"
              />
            ) : (
              <p className="text-secondary-700 whitespace-pre-wrap">{job.jobDescription}</p>
            )}
          </div>

          {/* Notes */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Notes</h2>
            {isEditing ? (
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="input min-h-[100px]"
                placeholder="Add notes..."
              />
            ) : (
              <p className="text-secondary-600">{job.notes || 'No notes yet'}</p>
            )}
          </div>

          {/* Proof & Materials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-4">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Proof Link
              </h2>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.proofLink || ''}
                  onChange={(e) => setEditData({ ...editData, proofLink: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              ) : job.proofLink ? (
                <a
                  href={job.proofLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {job.proofLink}
                </a>
              ) : (
                <p className="text-secondary-500">No proof uploaded</p>
              )}
            </div>

            <div className="card p-4">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Materials Needed
              </h2>
              {isEditing ? (
                <textarea
                  value={editData.materialsNeeded || ''}
                  onChange={(e) => setEditData({ ...editData, materialsNeeded: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="List materials..."
                />
              ) : (
                <p className="text-secondary-600 whitespace-pre-wrap">
                  {job.materialsNeeded || 'No materials listed'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Status</h2>
            {isEditing ? (
              <select
                value={editData.currentStatus}
                onChange={(e) => setEditData({ ...editData, currentStatus: e.target.value })}
                className="input"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={job.currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dates */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dates
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase">Order Date</label>
                <p className="text-secondary-900">{formatDate(job.orderDate)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase">Target Date</label>
                <p className="text-secondary-900">{job.targetDate ? formatDate(job.targetDate) : 'Not set'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase">Start Date</label>
                <p className="text-secondary-900">{job.startDate ? formatDate(job.startDate) : 'Not recorded'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase">Finish Date</label>
                <p className="text-secondary-900">{job.finishDate ? formatDate(job.finishDate) : 'Not completed'}</p>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Assignment
            </h2>
            {isEditing ? (
              <input
                type="text"
                value={editData.assignedTo || ''}
                onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                className="input"
                placeholder="Assign to..."
              />
            ) : (
              <p className="text-secondary-900">{job.assignedTo || 'Not assigned'}</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="card p-4 bg-secondary-50">
            <p className="text-xs text-secondary-500">
              Created: {formatDateTime(job.createdAt)}
            </p>
            <p className="text-xs text-secondary-500">
              Updated: {formatDateTime(job.updatedAt)}
            </p>
            {job.archivedAt && (
              <p className="text-xs text-secondary-500">
                Archived: {formatDateTime(job.archivedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Delete Job</h3>
            <p className="text-secondary-600 mb-4">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
