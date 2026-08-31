'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const TABS = [
  { key: 'datewise',     label: 'Date-wise' },
  { key: 'customerwise', label: 'Customer-wise' },
  { key: 'productwise',  label: 'Product-wise' },
  { key: 'monthly',      label: 'Monthly' },
  { key: 'statuswise',   label: 'Status-wise' },
  { key: 'gst',          label: 'GST Report' },
  { key: 'dispatch',     label: 'Dispatch Report' },
  { key: 'salespersonwise', label: 'Salesperson' },
];

const STATUS_LABELS = {
  draft: 'Draft', md_pending: 'MD Pending', ceo_pending: 'CEO Pending',
  ceo_approved: 'Approved', rejected: 'Rejected',
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('datewise');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchReport(); }, [activeTab]);

  async function fetchReport() {
    setLoading(true);
    try {
      let params = activeTab === 'monthly' ? `?year=${year}` : `?from=${from}&to=${to}`;
      const res = await api.get(`/reports/${activeTab}${params}`);
      setData(res.data.data);
      setSummary(res.data.summary || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sales aur PI analysis</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end flex-wrap">
        {activeTab === 'monthly' ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
        <button onClick={fetchReport}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Apply
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g,' ')}</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {key.includes('value') || key.includes('gst') || key.includes('taxable')
                  ? `Rs.${fmt(val)}`
                  : val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">Koi data nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Date-wise */}
            {activeTab === 'datewise' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">PI Number</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((pi, i) => (
                    <tr key={pi.id} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-mono text-blue-700">{pi.pi_number}</td>
                      <td className="px-4 py-3 text-gray-900">{pi.customer?.company_name}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(pi.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pi.status === 'ceo_approved' ? 'bg-green-100 text-green-700' :
                          pi.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{STATUS_LABELS[pi.status] || pi.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(pi.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={4} className="px-4 py-3 font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      Rs.{fmt(data.reduce((s, p) => s + parseFloat(p.grand_total), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Customer-wise */}
            {activeTab === 'customerwise' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total PIs</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Value</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Approved Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{row.customer?.company_name}</p>
                        <p className="text-xs text-gray-500">{row.customer?.customer_name}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.total_pi}</td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(row.total_value)}</td>
                      <td className="px-4 py-3 text-right text-green-700">Rs.{fmt(row.approved_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Product-wise */}
            {activeTab === 'productwise' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Mtr</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Kg</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Pieces</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">PI Count</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-mono text-blue-700">{row.product_code_snap}</td>
                      <td className="px-4 py-3 text-gray-900">{row.product_name_snap}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{parseFloat(row.total_length||0).toFixed(2)}m</td>
                      <td className="px-4 py-3 text-right text-amber-700">{parseFloat(row.total_weight||0).toFixed(3)}kg</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.total_pieces}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.pi_count}</td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(row.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Monthly */}
            {activeTab === 'monthly' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total PIs</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Value</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Approved Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.month_name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.total_pi}</td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(row.total_value)}</td>
                      <td className="px-4 py-3 text-right text-green-700">Rs.{fmt(row.approved_value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-semibold">Total {year}</td>
                    <td className="px-4 py-3 text-right font-semibold">{data.reduce((s,r)=>s+parseInt(r.total_pi),0)}</td>
                    <td className="px-4 py-3 text-right font-semibold">Rs.{fmt(data.reduce((s,r)=>s+parseFloat(r.total_value||0),0))}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">Rs.{fmt(data.reduce((s,r)=>s+parseFloat(r.approved_value||0),0))}</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Status-wise */}
            {activeTab === 'statuswise' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Count</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          row.status === 'ceo_approved' ? 'bg-green-100 text-green-700' :
                          row.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          row.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>{STATUS_LABELS[row.status] || row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{row.count}</td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(row.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* GST */}
            {activeTab === 'gst' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">PI Number</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Taxable</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">GST 18%</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((pi, i) => (
                    <tr key={pi.id} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-mono text-blue-700">{pi.pi_number}</td>
                      <td className="px-4 py-3 text-gray-900">{pi.customer?.company_name}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(pi.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-gray-700">Rs.{fmt(pi.subtotal)}</td>
                      <td className="px-4 py-3 text-right text-red-600">Rs.{fmt(pi.gst_amount)}</td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(pi.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 font-semibold">Total</td>
                    <td className="px-4 py-3 text-right font-semibold">Rs.{fmt(data.reduce((s,p)=>s+parseFloat(p.subtotal||0),0))}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">Rs.{fmt(data.reduce((s,p)=>s+parseFloat(p.gst_amount||0),0))}</td>
                    <td className="px-4 py-3 text-right font-semibold">Rs.{fmt(data.reduce((s,p)=>s+parseFloat(p.grand_total||0),0))}</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Dispatch Report */}
            {activeTab === 'dispatch' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">PI Number</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((pi, i) => (
                    <tr key={pi.id} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-mono text-blue-700">{pi.pi_number}</td>
                      <td className="px-4 py-3 text-gray-900">{pi.customer?.company_name}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(pi.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pi.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                          pi.status === 'payment_confirmed' ? 'bg-teal-100 text-teal-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {pi.status === 'dispatched' ? 'Dispatched' :
                           pi.status === 'payment_confirmed' ? 'Ready' : 'Payment Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">Rs.{fmt(pi.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={4} className="px-4 py-3 font-semibold">Total</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      Rs.{fmt(data.reduce((s,p)=>s+parseFloat(p.grand_total||0),0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
            {/* Salesperson Report */}
            {activeTab === 'salespersonwise' && (
              <div className="space-y-0">
                {/* Summary Bar */}
                <div className="grid grid-cols-5 gap-0 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs opacity-80">Total Salespersons</p>
                    <p className="text-lg font-bold">{data.length}</p>
                  </div>
                  <div className="px-4 py-3 text-center border-l border-blue-500">
                    <p className="text-xs opacity-80">Total PIs</p>
                    <p className="text-lg font-bold">{data.reduce((s,r)=>s+parseInt(r.total_pi||0),0)}</p>
                  </div>
                  <div className="px-4 py-3 text-center border-l border-blue-500">
                    <p className="text-xs opacity-80">Total Value</p>
                    <p className="text-lg font-bold">Rs.{fmt(data.reduce((s,r)=>s+parseFloat(r.total_value||0),0))}</p>
                  </div>
                  <div className="px-4 py-3 text-center border-l border-blue-500">
                    <p className="text-xs opacity-80">Approved Value</p>
                    <p className="text-lg font-bold">Rs.{fmt(data.reduce((s,r)=>s+parseFloat(r.approved_value||0),0))}</p>
                  </div>
                  <div className="px-4 py-3 text-center border-l border-blue-500">
                    <p className="text-xs opacity-80">Dispatched Value</p>
                    <p className="text-lg font-bold">Rs.{fmt(data.reduce((s,r)=>s+parseFloat(r.dispatched_value||0),0))}</p>
                  </div>
                </div>

                {/* Per Salesperson Cards */}
                {data.map((row, i) => (
                  <SalespersonCard key={i} row={row} fmt={fmt} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SalespersonCard({ row, fmt }) {
  const [expanded, setExpanded] = useState(false);

  const STATUS_COLORS = {
    draft:             'bg-gray-100 text-gray-600',
    md_pending:        'bg-amber-100 text-amber-700',
    ceo_pending:       'bg-purple-100 text-purple-700',
    ceo_approved:      'bg-green-100 text-green-700',
    payment_confirmed: 'bg-teal-100 text-teal-700',
    dispatched:        'bg-blue-100 text-blue-800',
    rejected:          'bg-red-100 text-red-700',
  };

  const STATUS_LABELS = {
    draft: 'Draft', md_pending: 'MD Pending', ceo_pending: 'CEO Pending',
    ceo_approved: 'Approved', payment_confirmed: 'Paid', dispatched: 'Dispatched', rejected: 'Rejected',
  };

  return (
    <div className="border-b border-gray-200">
      {/* Main Row */}
      <div
        className="grid grid-cols-12 gap-0 hover:bg-blue-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="col-span-3 px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {row.salesperson_label?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.salesperson_label}</p>
            <p className="text-xs text-gray-500">{row.total_pi} PIs</p>
          </div>
        </div>
        <div className="col-span-2 px-4 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="font-semibold text-gray-900 text-sm">Rs.{fmt(row.total_value)}</p>
        </div>
        <div className="col-span-2 px-4 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="font-semibold text-green-700 text-sm">Rs.{fmt(row.approved_value)}</p>
          <p className="text-xs text-gray-400">{row.approved_count} PIs</p>
        </div>
        <div className="col-span-2 px-4 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="font-semibold text-amber-600 text-sm">Rs.{fmt(row.pending_value)}</p>
          <p className="text-xs text-gray-400">{row.pending_count} PIs</p>
        </div>
        <div className="col-span-2 px-4 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Dispatched</p>
          <p className="font-semibold text-blue-700 text-sm">Rs.{fmt(row.dispatched_value)}</p>
          <p className="text-xs text-gray-400">{row.dispatched_count} PIs</p>
        </div>
        <div className="col-span-1 px-4 py-4 flex items-center justify-center">
          <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded PI List */}
      {expanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          {/* Mini Stats */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-200 bg-white">
            <div className="text-center">
              <p className="text-xs text-gray-500">Draft</p>
              <p className="font-semibold text-gray-600 text-sm">Rs.{fmt(row.draft_value)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Pending Approval</p>
              <p className="font-semibold text-amber-600 text-sm">Rs.{fmt(row.pending_value)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Payment Confirmed</p>
              <p className="font-semibold text-teal-600 text-sm">Rs.{fmt(row.payment_confirmed_value)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="font-semibold text-red-600 text-sm">Rs.{fmt(row.rejected_value)}</p>
            </div>
          </div>

          {/* PI Table */}
          {row.pis && row.pis.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="text-left px-6 py-2 font-medium text-gray-600">PI Number</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Brand</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {row.pis.map((pi, j) => (
                  <tr key={j} className={`border-b border-gray-100 ${j%2===0?'':'bg-white'}`}>
                    <td className="px-6 py-2 font-mono text-blue-700 font-medium">{pi.pi_number}</td>
                    <td className="px-4 py-2 text-gray-900">{pi.customer?.company_name || '-'}</td>
                    <td className="px-4 py-2 text-gray-600 capitalize">{pi.brand || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pi.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[pi.status] || pi.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{new Date(pi.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">Rs.{fmt(pi.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-100">
                  <td colSpan={5} className="px-6 py-2 font-semibold text-gray-700">Total ({row.pis.length} PIs)</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900">
                    Rs.{fmt(row.pis.reduce((s,p)=>s+parseFloat(p.grand_total||0),0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-center text-gray-400 text-xs py-4">Koi PI nahi</p>
          )}
        </div>
      )}
    </div>
  );
}
