'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const TABS = [
  { key: 'datewise',        label: 'Date-wise' },
  { key: 'customerwise',    label: 'Customer-wise' },
  { key: 'productwise',     label: 'Product-wise' },
  { key: 'monthly',         label: 'Monthly' },
  { key: 'statuswise',      label: 'Status-wise' },
  { key: 'gst',             label: 'GST Report' },
  { key: 'dispatch',        label: 'Dispatch Report' },
  { key: 'salespersonwise', label: 'Salesperson' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'md_pending', label: 'MD Pending' },
  { value: 'ceo_pending', label: 'CEO Pending' },
  { value: 'ceo_approved', label: 'CEO Approved' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
  { value: 'delivery_scheduled', label: 'Delivery Scheduled' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  md_pending: 'bg-yellow-100 text-yellow-700',
  ceo_pending: 'bg-orange-100 text-orange-700',
  ceo_approved: 'bg-green-100 text-green-700',
  payment_confirmed: 'bg-teal-100 text-teal-700',
  delivery_scheduled: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
};

const BRAND_OPTIONS = [
  { value: '', label: 'All Brands' },
  { value: 'cynosure', label: 'Cynosure' },
  { value: 'assre_plasto', label: 'Assre Plasto' },
  { value: 'sinewy', label: 'Sinewy' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab]     = useState('datewise');
  const [data, setData]               = useState([]);
  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [customers, setCustomers]     = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded]       = useState({});

  const today        = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    from: firstOfMonth, to: today,
    year: new Date().getFullYear(),
    customer_id: '', brand: '', status: '', salesperson: '',
    amount_min: '', amount_max: '',
  });

  useEffect(() => { fetchReport(); fetchMeta(); }, [activeTab]);

  async function fetchMeta() {
    try {
      const res = await api.get('/customers?per_page=200');
      setCustomers(res.data.data || []);
    } catch(e) {}
  }

  async function fetchReport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'monthly') {
        params.append('year', filters.year);
      } else {
        params.append('from', filters.from);
        params.append('to', filters.to);
      }
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.brand)        params.append('brand', filters.brand);
      if (filters.status)       params.append('status', filters.status);
      if (filters.salesperson)  params.append('salesperson', filters.salesperson);
      if (filters.amount_min)   params.append('amount_min', filters.amount_min);
      if (filters.amount_max)   params.append('amount_max', filters.amount_max);

      const res = await api.get(`/reports/${activeTab}?${params.toString()}`);
      const rows = res.data.data || [];
      setData(rows);
      setSummary(res.data.summary || null);

      // Extract salesperson names for filter dropdown
      if (activeTab === 'salespersonwise') {
        setSalespersons(rows.map(r => r.salesperson_name || r.salesperson_label).filter(Boolean));
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function setFilter(key, val) { setFilters(f => ({...f, [key]: val})); }

  function resetFilters() {
    setFilters({
      from: firstOfMonth, to: today,
      year: new Date().getFullYear(),
      customer_id: '', brand: '', status: '', salesperson: '',
      amount_min: '', amount_max: '',
    });
  }

  function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  const activeFilterCount = [
    filters.customer_id, filters.brand, filters.status,
    filters.salesperson, filters.amount_min, filters.amount_max,
  ].filter(Boolean).length;

  // ---- Salesperson expandable card renderer ----
  function SalespersonCards() {
    return (
      <div className="space-y-3">
        {data.map((row, i) => {
          const name  = row.salesperson_name || row.salesperson_label || 'Unassigned';
          const open  = expanded[name] || false;
          const pis   = row.pis || [];
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(e => ({...e, [name]: !open}))}>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{row.total_pi} PIs</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="font-bold text-blue-700 text-sm">Rs.{fmt(row.total_value)}</p>
                  </div>
                  {row.approved_value > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Approved</p>
                      <p className="font-semibold text-green-700 text-sm">Rs.{fmt(row.approved_value)}</p>
                    </div>
                  )}
                  {row.pending_value > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Pending</p>
                      <p className="font-semibold text-orange-600 text-sm">Rs.{fmt(row.pending_value)}</p>
                    </div>
                  )}
                  <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
                </div>
              </button>
              {open && pis.length > 0 && (
                <div className="border-t border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">PI Number</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Customer</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Brand</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pis.map((pi, j) => (
                        <tr key={j} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs font-mono font-bold text-blue-700">{pi.pi_number}</td>
                          <td className="px-4 py-2 text-xs text-gray-700">{pi.customer?.company_name || '-'}</td>
                          <td className="px-4 py-2 text-xs capitalize text-gray-600">{pi.brand}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{new Date(pi.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[pi.status] || 'bg-gray-100 text-gray-600'}`}>
                              {pi.status?.replace(/_/g,' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs font-semibold text-right text-gray-900">Rs.{fmt(pi.grand_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-gray-700">Subtotal</td>
                        <td className="px-4 py-2 text-xs font-bold text-right text-blue-700">
                          Rs.{fmt(pis.reduce((s, p) => s + parseFloat(p.grand_total || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              {open && pis.length === 0 && (
                <div className="px-5 py-4 text-sm text-gray-400 border-t border-gray-100">No PI details available.</div>
              )}
            </div>
          );
        })}
        {/* Grand total */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex justify-between items-center">
          <span className="font-bold text-gray-700">Grand Total</span>
          <span className="font-bold text-blue-700 text-base">Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.total_value || 0), 0))}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Sales aur PI analysis</p>
        </div>
        <button onClick={() => window.print()}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">
          Print
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 items-end flex-wrap">
          {activeTab === 'monthly' ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
              <input type="number" value={filters.year} onChange={e => setFilter('year', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
            <select value={filters.customer_id} onChange={e => setFilter('customer_id', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
            <select value={filters.brand} onChange={e => setFilter('brand', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36">
              {BRAND_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 text-sm rounded-lg border font-medium ${showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600'}`}>
            More {activeFilterCount > 0 && <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
          </button>

          <button onClick={fetchReport}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg">
            Apply
          </button>

          {activeFilterCount > 0 && (
            <button onClick={() => { resetFilters(); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium">
              Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Salesperson</label>
              <select value={filters.salesperson} onChange={e => setFilter('salesperson', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40">
                <option value="">All</option>
                {salespersons.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount Min (Rs.)</label>
              <input type="number" value={filters.amount_min} onChange={e => setFilter('amount_min', e.target.value)}
                placeholder="0"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount Max (Rs.)</label>
              <input type="number" value={filters.amount_max} onChange={e => setFilter('amount_max', e.target.value)}
                placeholder="99999999"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {summary.total_pi !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total PI</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total_pi}</p>
            </div>
          )}
          {summary.total_value !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-xl font-bold text-blue-700 mt-1">Rs.{fmt(summary.total_value)}</p>
            </div>
          )}
          {summary.approved !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{summary.approved}</p>
            </div>
          )}
          {summary.pending !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{summary.pending}</p>
            </div>
          )}
          {summary.draft !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Draft</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{summary.draft}</p>
            </div>
          )}
          {summary.rejected !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{summary.rejected}</p>
            </div>
          )}
          {summary.total_gst !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total GST</p>
              <p className="text-xl font-bold text-purple-700 mt-1">Rs.{fmt(summary.total_gst)}</p>
            </div>
          )}
          {summary.dispatched !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Dispatched</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{summary.dispatched}</p>
            </div>
          )}
        </div>
      )}

      {/* Data */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <p>Koi data nahi mila</p>
        </div>
      ) : activeTab === 'salespersonwise' ? (
        <SalespersonCards />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {activeTab === 'datewise' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">PI Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Salesperson</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  </>}
                  {activeTab === 'customerwise' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total PIs</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Value</th>
                  </>}
                  {activeTab === 'productwise' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Length</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Value</th>
                  </>}
                  {activeTab === 'monthly' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total PIs</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Value</th>
                  </>}
                  {activeTab === 'statuswise' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Value</th>
                  </>}
                  {activeTab === 'gst' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">PI Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Taxable</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">GST 18%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                  </>}
                  {activeTab === 'dispatch' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">PI Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Dispatch Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Transport</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {activeTab === 'datewise' && <>
                      <td className="px-4 py-3 text-xs text-gray-500">{i+1}</td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-blue-700">{row.pi_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.customer_name}</td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-600">{row.brand}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.salesperson_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600'}`}>
                          {row.status?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">Rs.{fmt(row.amount)}</td>
                    </>}
                    {activeTab === 'customerwise' && <>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{row.total_pi}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-blue-700">Rs.{fmt(row.total_value)}</td>
                    </>}
                    {activeTab === 'productwise' && <>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.product_name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{row.total_qty}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-blue-700">Rs.{fmt(row.total_value)}</td>
                    </>}
                    {activeTab === 'monthly' && <>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{row.total_pi}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-blue-700">Rs.{fmt(row.total_value)}</td>
                    </>}
                    {activeTab === 'statuswise' && <>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600'}`}>
                          {row.status?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{row.count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-blue-700">Rs.{fmt(row.total_value)}</td>
                    </>}
                    {activeTab === 'gst' && <>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-blue-700">{row.pi_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">Rs.{fmt(row.taxable_amount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-purple-700 font-semibold">Rs.{fmt(row.gst_amount)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">Rs.{fmt(row.grand_total)}</td>
                    </>}
                    {activeTab === 'dispatch' && <>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-blue-700">{row.pi_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600'}`}>
                          {row.status?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.dispatched_at ? new Date(row.dispatched_at).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.transport_company || row.vehicle_number || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">Rs.{fmt(row.grand_total)}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  {activeTab === 'datewise' && <>
                    <td colSpan={7} className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-blue-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.amount || 0), 0))}
                    </td>
                  </>}
                  {['customerwise','monthly'].includes(activeTab) && <>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-700">
                      {data.reduce((s, r) => s + parseInt(r.total_pi || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-blue-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.total_value || 0), 0))}
                    </td>
                  </>}
                  {activeTab === 'productwise' && <>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-700">-</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-blue-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.total_value || 0), 0))}
                    </td>
                  </>}
                  {activeTab === 'statuswise' && <>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-700">
                      {data.reduce((s, r) => s + parseInt(r.count || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-blue-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.total_value || 0), 0))}
                    </td>
                  </>}
                  {activeTab === 'gst' && <>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.taxable_amount || 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-purple-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.gst_amount || 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.grand_total || 0), 0))}
                    </td>
                  </>}
                  {activeTab === 'dispatch' && <>
                    <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-blue-700">
                      Rs.{fmt(data.reduce((s, r) => s + parseFloat(r.grand_total || 0), 0))}
                    </td>
                  </>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
