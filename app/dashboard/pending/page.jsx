'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

const STATUS_COLORS = {
  md_pending:  'bg-amber-100 text-amber-700',
  ceo_pending: 'bg-purple-100 text-purple-700',
};

export default function PendingPage() {
  const user = getUser();
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => { fetchPending(); }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const res = await api.get('/pending-pis');
      setPis(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleApprove(id) {
    try {
      await api.post(`/pi/${id}/approve`, { comments: '' });
      fetchPending();
      setShowDetail(null);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  async function handleReject(id) {
    const comments = prompt('Rejection reason likhein:');
    if (!comments) return;
    try {
      await api.post(`/pi/${id}/reject`, { comments });
      fetchPending();
      setShowDetail(null);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  async function openDetail(id) {
    try {
      const res = await api.get(`/pi/${id}`);
      setShowDetail(res.data.data);
    } catch (e) { console.error(e); }
  }

  const roleLabel = user?.role === 'md' ? 'MD' : 'CEO';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
        <p className="text-sm text-gray-500 mt-0.5">{pis.length} PI{pis.length !== 1 ? 's' : ''} waiting for your approval</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : pis.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg font-medium text-gray-600">Sab clear hai!</p>
          <p className="text-sm mt-1">Koi pending PI nahi hai</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pis.map(pi => (
            <div key={pi.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-blue-700">{pi.pi_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[pi.status]}`}>
                      {pi.status === 'md_pending' ? 'MD Approval' : 'CEO Approval'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{pi.customer?.company_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{pi.customer?.customer_name}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>📅 {new Date(pi.created_at).toLocaleDateString('en-IN')}</span>
                    <span>👤 {pi.creator?.name || 'Unknown'}</span>
                    <span className="capitalize">📋 {pi.profile_type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">Rs.{parseFloat(pi.grand_total).toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Grand Total</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => openDetail(pi.id)}
                  className="flex-1 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                  View Details
                </button>
                <button onClick={() => handleReject(pi.id)}
                  className="flex-1 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                  ❌ Reject
                </button>
                <button onClick={() => handleApprove(pi.id)}
                  className="flex-1 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium">
                  ✅ Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{showDetail.pi_number}</h3>
                <p className="text-xs text-gray-500">{showDetail.customer?.company_name}</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Code</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Bundles</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Total Mtr</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Rate</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDetail.items?.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-mono text-blue-700">{item.product_code_snap}</td>
                        <td className="px-3 py-2 text-gray-900">{item.product_name_snap}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{item.bundle_qty_ordered}</td>
                        <td className="px-3 py-2 text-right text-blue-700">{item.total_length}m</td>
                        <td className="px-3 py-2 text-right text-gray-700">Rs.{item.unit_rate_snap}</td>
                        <td className="px-3 py-2 text-right font-medium">Rs.{parseFloat(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs.{parseFloat(showDetail.subtotal).toFixed(2)}</span></div>
                  {parseFloat(showDetail.discount_pct||0) > 0 && (
                    <div className="flex justify-between text-green-600"><span>Discount ({showDetail.discount_pct}%)</span><span>-Rs.{parseFloat(showDetail.discount_amount||0).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between text-gray-600"><span>Transport</span><span>Rs.{parseFloat(showDetail.transport_charge).toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>GST 18%</span><span>Rs.{parseFloat(showDetail.gst_amount).toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-gray-900 border-t pt-1"><span>Grand Total</span><span>Rs.{parseFloat(showDetail.grand_total).toFixed(2)}</span></div>
                </div>
              </div>

              {/* Rejection History */}
              {showDetail.approvals?.filter(a => a.action === 'rejected').length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-2">❌ Rejection History</p>
                  {showDetail.approvals.filter(a => a.action === 'rejected').map((a, i) => (
                    <div key={i} className="text-xs text-red-600 mb-1">
                      <span className="font-medium">{a.approver?.name}</span> — {a.comments}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => handleReject(showDetail.id)}
                className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg border border-red-200">
                ❌ Reject
              </button>
              <button onClick={() => handleApprove(showDetail.id)}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg">
                ✅ Approve
              </button>
              <button onClick={() => setShowDetail(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
