'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'meter', label: 'Meter' },
  { value: 'set',   label: 'Set' },
  { value: 'kg',    label: 'Kg' },
];

export default function HardwarePage() {
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ name: '', unit: 'piece', rate: '', code: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { fetchHardware(); }, []);

  async function fetchHardware() {
    setLoading(true);
    try {
      const res = await api.get('/hardware');
      setHardware(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', unit: 'piece', rate: '', code: '' });
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name, unit: item.unit, rate: item.rate, code: item.code || '' });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name) { setError('Name required hai.'); return; }
    if (!form.rate)  { setError('Rate required hai.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.put(`/hardware/${editing.id}`, form);
      } else {
        await api.post('/hardware', form);
      }
      setShowForm(false);
      fetchHardware();
    } catch (e) {
      setError(e.response?.data?.message || 'Error aaya.');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete karna chahte ho?')) return;
    try {
      await api.delete(`/hardware/${id}`);
      fetchHardware();
    } catch (e) { alert('Error'); }
  }

  function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hardware Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">Handle, Lock, Track, Hinge etc.</p>
        </div>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Add Hardware
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : hardware.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔧</p>
            <p className="text-sm">Koi hardware nahi mila</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Unit</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Rate (Rs.)</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hardware.map((item, i) => (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-mono text-blue-700 font-medium">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">Rs.{fmt(item.rate)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(item)}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium">Edit</button>
                      <button onClick={() => handleDelete(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Edit Hardware' : 'Add Hardware'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                <input type="text" value={form.code}
                  onChange={e => setForm({...form, code: e.target.value})}
                  placeholder="e.g. HW-001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Handle, Lock, Hinge"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                <select value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rate (Rs.) *</label>
                <input type="number" value={form.rate}
                  onChange={e => setForm({...form, rate: e.target.value})}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Hardware'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
