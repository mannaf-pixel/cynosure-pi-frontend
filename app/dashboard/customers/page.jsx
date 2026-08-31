'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    customer_name: '', company_name: '', gstin: '',
    contact_person: '', mobile: '', email: '',
    billing_address: '', shipping_address: '',
    state: '', city: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ customer_name:'', company_name:'', gstin:'', contact_person:'', mobile:'', email:'', billing_address:'', shipping_address:'', state:'', city:'' });
    setError('');
    setShowForm(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      customer_name: c.customer_name, company_name: c.company_name,
      gstin: c.gstin||'', contact_person: c.contact_person||'',
      mobile: c.mobile||'', email: c.email||'',
      billing_address: c.billing_address||'', shipping_address: c.shipping_address||'',
      state: c.state||'', city: c.city||'',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.customer_name) { setError('Customer name required'); return; }
    if (!form.company_name) { setError('Company name required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        customer_name:    form.customer_name,
        company_name:     form.company_name,
        gstin:            form.gstin || null,
        contact_person:   form.contact_person || null,
        mobile:           form.mobile || null,
        email:            form.email || null,
        billing_address:  form.billing_address || null,
        shipping_address: form.shipping_address || null,
        state:            form.state || null,
        city:             form.city || null,
      };
      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      setShowForm(false);
      await fetchCustomers();
    } catch (e) {
      setError(e.response?.data?.message || 'Error saving customer.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = customers.filter(c =>
    (c.customer_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.company_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile||'').includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers total</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Add Customer
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by name, mobile..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">Koi customer nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">GSTIN</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">City / State</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.company_name}</p>
                      <p className="text-xs text-gray-500">{c.customer_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.mobile||'-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.gstin||'-'}</td>
                    <td className="px-4 py-3 text-gray-500">{[c.city,c.state].filter(Boolean).join(', ')||'-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(c)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{editing ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input type="text" value={form.customer_name}
                    onChange={e => setForm({...form, customer_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                  <input type="text" value={form.company_name}
                    onChange={e => setForm({...form, company_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile (10 digits)</label>
                  <input type="text" value={form.mobile}
                    onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g,'').slice(0,10)})}
                    placeholder="9876543210"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN</label>
                  <input type="text" value={form.gstin}
                    onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                    maxLength={15}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <input type="text" value={form.state}
                    onChange={e => setForm({...form, state: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Billing Address</label>
                <textarea value={form.billing_address}
                  onChange={e => setForm({...form, billing_address: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
