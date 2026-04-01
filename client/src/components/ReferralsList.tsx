import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Referral {
  id: string;
  clientName: string;
  contact: string;
  description: string;
  subcontractor: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-warning/10 text-warning border-warning/20',
  'In Progress': 'bg-primary/10 text-primary border-primary/20',
  'Completed': 'bg-success/10 text-success border-success/20',
  'Cancelled': 'bg-secondary-200 text-secondary-500 border-secondary-300',
};

export default function ReferralsList() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientName: '', contact: '', description: '', subcontractor: '', status: 'Pending' });

  useEffect(() => {
    fetch('/api/referrals')
      .then(r => r.json())
      .then(data => { setReferrals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (ref: Referral, status: string) => {
    const updated = await fetch(`/api/referrals/${ref.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.json());
    setReferrals(prev => prev.map(r => r.id === ref.id ? updated : r));
  };

  const deleteReferral = async (id: string) => {
    await fetch(`/api/referrals/${id}`, { method: 'DELETE' });
    setReferrals(prev => prev.filter(r => r.id !== id));
  };

  const createReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim()) return;
    setSaving(true);
    const created = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json());
    setReferrals(prev => [created, ...prev]);
    setForm({ clientName: '', contact: '', description: '', subcontractor: '', status: 'Pending' });
    setShowForm(false);
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Referrals</h1>
          <p className="text-secondary-500 mt-1">{referrals.length} total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Referral
        </button>
      </div>

      {showForm && (
        <form onSubmit={createReferral} className="card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Client name *" value={form.clientName} onChange={e => setForm(f => ({...f, clientName: e.target.value}))} autoFocus />
            <input className="input" placeholder="Contact (phone/email)" value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))} />
            <input className="input" placeholder="Subcontractor" value={form.subcontractor} onChange={e => setForm(f => ({...f, subcontractor: e.target.value}))} />
            <select className="input" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <textarea className="input w-full h-20 resize-none" placeholder="Description / notes" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      )}

      {referrals.length === 0 && !showForm ? (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No referrals yet</p>
        </div>
      ) : (
        <div className="card divide-y divide-secondary-100">
          {referrals.map(ref => (
            <div key={ref.id} className="p-4 hover:bg-secondary-50 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-secondary-900">{ref.clientName}</p>
                    {ref.subcontractor && (
                      <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded">
                        via {ref.subcontractor}
                      </span>
                    )}
                  </div>
                  {ref.contact && <p className="text-sm text-secondary-500 mt-0.5">{ref.contact}</p>}
                  {ref.description && <p className="text-sm text-secondary-600 mt-1">{ref.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <select
                      value={ref.status}
                      onChange={e => updateStatus(ref, e.target.value)}
                      className={cn(
                        'appearance-none text-xs font-medium px-2 py-1 pr-6 rounded border cursor-pointer',
                        STATUS_COLORS[ref.status] || 'bg-secondary-100 text-secondary-600 border-secondary-200'
                      )}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                  </div>
                  <button
                    onClick={() => deleteReferral(ref.id)}
                    className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-danger transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
