import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useJobs } from '@/context/JobsContext';
import { cn, STATUSES, STATUS_COLORS, STATUS_BORDER_COLORS, formatDate } from '@/lib/utils';
import JobModal from '@/components/JobModal';
import CreateJobModal from '@/components/CreateJobModal';
import { LayoutGrid, List, Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { PAYMENT_STATUS_COLORS } from '@/lib/utils';

export default function Jobs() {
  const { jobs, setJobs, updateJobStatus, fetchJobs } = useJobs();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((job) => job.currentStatus === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.clientName.toLowerCase().includes(query) ||
          job.displayId.toLowerCase().includes(query) ||
          job.jobDescription.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [jobs, statusFilter, searchQuery]);

  const jobsByStatus = useMemo(() => {
    const grouped: Record<string, typeof jobs> = {};
    STATUSES.forEach((status) => {
      grouped[status] = filteredJobs.filter((job) => job.currentStatus === status);
    });
    return grouped;
  }, [filteredJobs]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Build updated jobs list optimistically
    const updatedJobs = [...jobs];
    const draggedIdx = updatedJobs.findIndex(j => j.id === draggableId);
    if (draggedIdx === -1) return;

    const [dragged] = updatedJobs.splice(draggedIdx, 1);
    dragged.currentStatus = newStatus;

    // Find insertion point in the destination column
    const destJobs = updatedJobs.filter(j => j.currentStatus === newStatus);
    const insertIdx = destination.index;
    const insertBeforeJob = destJobs[insertIdx];
    const insertAt = insertBeforeJob ? updatedJobs.indexOf(insertBeforeJob) : updatedJobs.length;
    updatedJobs.splice(insertAt, 0, dragged);

    // Recalculate sortOrder for affected column(s)
    const columnsToUpdate = new Set([newStatus, oldStatus]);
    const orders: { id: string; sortOrder: number }[] = [];
    columnsToUpdate.forEach(col => {
      updatedJobs.filter(j => j.currentStatus === col).forEach((j, i) => {
        j.sortOrder = i;
        orders.push({ id: j.id, sortOrder: i });
      });
    });

    // Update UI immediately
    setJobs(updatedJobs);

    // Persist
    try {
      if (newStatus !== oldStatus) await updateJobStatus(draggableId, newStatus);
      await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params);
    fetchJobs({ status: statusFilter !== 'all' ? statusFilter : undefined, search: searchQuery || undefined });
  };

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null;

  const toggleColumn = (status: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Jobs</h1>
          <p className="text-secondary-500 mt-1">Manage your sign jobs</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by client, job ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9"
              />
            </div>
          </form>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                const params = new URLSearchParams();
                if (e.target.value !== 'all') params.set('status', e.target.value);
                if (searchQuery) params.set('search', searchQuery);
                setSearchParams(params);
                fetchJobs({
                  status: e.target.value !== 'all' ? e.target.value : undefined,
                  search: searchQuery || undefined,
                });
              }}
              className="input w-48"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="flex border border-secondary-200 rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'p-2 rounded-l-md',
                  viewMode === 'kanban' ? 'bg-primary text-white' : 'text-secondary-600 hover:bg-secondary-100'
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-r-md',
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-secondary-600 hover:bg-secondary-100'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <div key={status} className={cn('flex-shrink-0', collapsedColumns[status] ? 'w-12' : 'w-72')}>
                <div
                  className={cn(
                    'bg-secondary-100 rounded-lg p-3',
                    status === 'Quote/Pending' && 'border-t-4 border-t-warning',
                    status === 'Quoted/Awaiting' && 'border-t-4 border-t-yellow-500',
                    status === 'Ready for Proofing' && 'border-t-4 border-t-primary',
                    status === 'Awaiting Proof Approval' && 'border-t-4 border-t-violet-500',
                    status === 'Order Materials' && 'border-t-4 border-t-cyan-500',
                    status === 'Manufacturing/Production' && 'border-t-4 border-t-pink-500',
                    status === 'Ready for Dispatch/Installation' && 'border-t-4 border-t-orange-500',
                    status === 'Completed/Delivered' && 'border-t-4 border-t-success'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    {!collapsedColumns[status] && (
                      <>
                        <h3 className="font-semibold text-secondary-900 text-sm">{status}</h3>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-secondary-600">
                          {jobsByStatus[status]?.length || 0}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => toggleColumn(status)}
                      className="p-1 hover:bg-secondary-200 rounded transition-colors ml-auto"
                      title={collapsedColumns[status] ? 'Expand' : 'Collapse'}
                    >
                      {collapsedColumns[status] ? (
                        <ChevronRight className="w-4 h-4 text-secondary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-secondary-600" />
                      )}
                    </button>
                  </div>

                  {!collapsedColumns[status] && (

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'space-y-3 min-h-[200px] transition-colors rounded-lg',
                          snapshot.isDraggingOver && 'bg-primary/5'
                        )}
                      >
                        {jobsByStatus[status]?.map((job, index) => (
                          <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedJobId(job.id)}
                                className={cn(
                                  'bg-white rounded-lg shadow-sm border border-secondary-200 p-3 cursor-pointer hover:shadow-md transition-shadow',
                                  STATUS_BORDER_COLORS[job.currentStatus],
                                  snapshot.isDragging && 'rotate-2 shadow-lg'
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    {job.displayId}
                                  </span>
                                  {job.targetDate && new Date(job.targetDate) < new Date() && job.currentStatus !== 'Completed/Delivered' && (
                                    <span className="text-xs text-danger bg-danger/10 px-2 py-0.5 rounded">
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                <p className="font-medium text-secondary-900 text-sm mb-1">{job.clientName}</p>
                                <p className="text-xs text-secondary-500 line-clamp-2 mb-2">
                                  {job.jobDescription}
                                </p>
                                <div className="flex items-center justify-between text-xs text-secondary-500">
                                  {job.targetDate && (
                                    <span className="flex items-center gap-1">
                                      Due: {formatDate(job.targetDate)}
                                    </span>
                                  )}
                                  {job.assignedTo && (
                                    <span className="bg-secondary-100 px-2 py-0.5 rounded">
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Job ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-secondary-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-primary">{job.displayId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-secondary-900">{job.clientName}</p>
                      <p className="text-xs text-secondary-500 truncate max-w-[200px]">
                        {job.jobDescription}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'badge',
                          STATUS_COLORS[job.currentStatus] || 'bg-secondary-100 text-secondary-600'
                        )}
                      >
                        {job.currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600">
                      {job.targetDate ? formatDate(job.targetDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600">
                      {job.assignedTo || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedJobId(job.id)}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJobId(null)}
          showArchiveControls={true}
        />
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
