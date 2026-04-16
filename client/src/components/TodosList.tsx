import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Flag, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Todo {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-secondary-400',
};

export default function TodosList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  const fetchTodos = async () => {
    try {
      setError(null);
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch todos');
      }
      setTodos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch todos:', e);
      setTodos([]);
      setError(e instanceof Error ? e.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const toggleTodo = async (todo: Todo) => {
    const newStatus = todo.status === 'done' ? 'pending' : 'done';
    const updated = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(r => r.json());
    setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
  };

  const deleteTodo = async (id: string) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const created = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc, priority: newPriority }),
    }).then(r => r.json());
    setTodos(prev => [created, ...prev]);
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setShowForm(false);
    setSaving(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Only allow reordering within the pending list
    if (source.droppableId !== 'pending' || destination.droppableId !== 'pending') {
      return;
    }

    const pending = todos.filter(t => t.status === 'pending');
    const [dragged] = pending.splice(source.index, 1);
    pending.splice(destination.index, 0, dragged);

    // Update sortOrder based on new index
    const updatedPending = pending.map((todo, idx) => ({
      ...todo,
      sortOrder: idx,
    }));

    // Merge back with done todos (unchanged)
    const done = todos.filter(t => t.status === 'done');
    const newTodos = [...updatedPending, ...done];

    // Optimistic UI update
    setTodos(newTodos);

    // Persist reordering
    try {
      await fetch('/api/reorder-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: updatedPending.map(t => ({ id: t.id, sortOrder: t.sortOrder }))
        }),
      });
    } catch (error) {
      console.error('Failed to save todo order:', error);
      // Optionally revert on error
      fetchTodos();
    }
  };

  const pending = todos.filter(t => t.status === 'pending');
  const done = todos.filter(t => t.status === 'done');

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (error) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">Todos</h1>
        <p className="text-danger mb-4">{error}</p>
        <button onClick={fetchTodos} className="btn-primary">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Todos</h1>
          <p className="text-secondary-500 mt-1">{pending.length} pending · {done.length} done</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Todo
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTodo} className="card p-4 space-y-3">
          <input
            className="input w-full"
            placeholder="What needs doing?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="input w-full h-20 resize-none"
            placeholder="Details (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <div className="flex gap-3 items-center">
            <select className="input w-36" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <button type="submit" disabled={saving} className="btn-primary ml-auto">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="card divide-y divide-secondary-100">
            <Droppable droppableId="pending">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'transition-colors rounded-lg',
                    snapshot.isDraggingOver && 'bg-primary/5'
                  )}
                >
                  {pending.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'flex items-start gap-3 p-4 hover:bg-secondary-50 group',
                            snapshot.isDragging && 'rotate-2 shadow-lg bg-white'
                          )}
                        >
                          <div {...provided.dragHandleProps} className="mt-0.5 flex-shrink-0 cursor-grab text-secondary-400 hover:text-secondary-600">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <button onClick={() => toggleTodo(todo)} className="mt-0.5 flex-shrink-0 text-secondary-300 hover:text-success transition-colors">
                            <Circle className="w-5 h-5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-secondary-900">{todo.title}</p>
                            {todo.description && <p className="text-sm text-secondary-500 mt-0.5">{todo.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Flag className={cn('w-4 h-4', PRIORITY_COLORS[todo.priority])} />
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-danger transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      )}

      {pending.length === 0 && !showForm && (
        <div className="card p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <p className="text-secondary-500">All caught up!</p>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-secondary-400 uppercase tracking-wider mb-2">Completed</h2>
          <div className="card divide-y divide-secondary-100 opacity-60">
            {done.map(todo => (
              <div key={todo.id} className="flex items-start gap-3 p-4 hover:bg-secondary-50 group">
                <button onClick={() => toggleTodo(todo)} className="mt-0.5 flex-shrink-0 text-success hover:text-secondary-400 transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary-500 line-through">{todo.title}</p>
                  {todo.description && <p className="text-sm text-secondary-400 mt-0.5">{todo.description}</p>}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-danger transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
