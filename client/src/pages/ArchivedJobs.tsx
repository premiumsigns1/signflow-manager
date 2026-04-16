import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJobs } from '@/context/JobsContext';
import { formatDate } from '@/lib/utils';
import JobModal from '@/components/JobModal';
import { Search, Archive, RotateCcw } from 'lucide-react';

interface ArchivedJob {
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
  startDate: string | null;
  finishDate: string | null;
  archived: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ArchivedJobs() {
  const { jobs, setJobs, archiveJob } = useJobs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Fetch archived jobs only using dedicated endpoint
  useEffect(() => {
    fetchArchivedJobs();
  }, []);

  const fetchArchivedJobs = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    fetch(`/api/jobs/archived?${params.toString()}`)
      .then(res => res.json())
      .then((data: ArchivedJob[]) => setJobs(data as any))
      .catch(err => console.error('Failed to fetch archived jobs:', err));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: searchQuery });
    fetchArchivedJobs();
  };

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null;

  const handleUnarchive = async (jobId: string) => {
    if (confirm('Restore this job to active status?')) {
      await archiveJob(jobId, false);
      fetchArchivedJobs(); // Refresh list
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Archived Jobs
          </h1>
          <p className="text-secondary-500 mt-1">
            {jobs.length} total archived job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchArchivedJobs}
            className="btn-secondary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search archived jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
          </div>
        </form>
      </div>

      {/* Kanban Board - single column for Completed/Delivered */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <div className="flex-shrink-0 w-96">
          <div className="bg-secondary-100 rounded-lg p-3 border-t-4 border-t-success">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-secondary-900 text-sm">Completed/Delivered</h3>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-secondary-600">
                {jobs.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className="bg-white rounded-lg shadow-sm border border-secondary-200 p-3 cursor-pointer hover:shadow-md transition-shadow border-l-success"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {job.displayId}
                    </span>
                  </div>
                  <p className="font-medium text-secondary-900 text-sm mb-1">{job.clientName}</p>
                  <p className="text-xs text-secondary-500 line-clamp-2 mb-2">{job.jobDescription}</p>
                  <div className="flex items-center justify-between text-xs text-secondary-500 mb-2">
                    {job.finishDate && (
                      <span className="flex items-center gap-1">
                        Finished: {formatDate(job.finishDate)}
                      </span>
                    )}
                    {job.startDate && (
                      <span className="text-secondary-400">
                        Started: {formatDate(job.startDate)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnarchive(job.id); }}
                      className="flex-1 text-xs py-1 px-2 bg-secondary-100 hover:bg-secondary-200 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-secondary-400 text-sm text-center py-8">No archived jobs</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJobId(null)}
          showArchiveControls={true}
        />
      )}
    </div>
  );
}
