'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function DispatchPage() {
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('payment_confirmed');
  const [dispatchModal, setDispatchModal] = useState(null);
  const [form, setForm] = useState({
    transport_company: '', vehicle_number: '', driver_name: '',
    driver_phone: '', lr_number: '', freight_amount: '',
    dispatch_note: '', expected_dispatch_date: '',
  });
  const [dispatchPhoto, setDispatchPhoto] = useState(null);
  const [transportCopy, setTransportCopy] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => { fetchPIs(); }, [filter]);

  async function fetchPIs() {
    setLoading(true);
    try {
      const res = await api.get(`/pi?status=${filter}`);
      setPis(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openDispatchModal(pi) {
    setDispatchModal(pi);
    setForm({
      dispatch_mode: 'transport',
      transport_company: '', vehicle_number: '', driver_name: '',
      driver_phone: '', lr_number: '', freight_amount: '',
      dispatch_note: '', expected_dispatch_date: '',
    });
    setDispatchPhoto(null);
    setTransportCopy(null);
    setError('');
  }

  async function handleDispatch() {
    if (form.dispatch_mode === 'transport') {
      if (!form.transport_company) { setError('Transport company name required hai.'); return; }
      if (!form.lr_number)         { setError('LR Number required hai.'); return; }
    } else {
      if (!form.vehicle_number) { setError('Vehicle number required hai.'); return; }
      if (!form.driver_name)    { setError('Driver name required hai.'); return; }
      if (!form.driver_phone)   { setError('Driver phone required hai.'); return; }
    }

    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (dispatchPhoto)  fd.append('dispatch_photo', dispatchPhoto);
      if (transportCopy)  fd.append('transport_copy', transportCopy);

      const token = Cookies.get('cynosure_token');
      const res = await fetch(`http://127.0.0.1:8000/api/v1/pi/${dispatchModal.id}/dispatch`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDispatchModal(null);
      fetchPIs();
    } catch (e) {
      setError(e.message || 'Dispatch mein error aaya.');
    } finally { setSaving(false); }
  }

  function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Dispatch Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Factory dispatch queue & tracking</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'payment_confirmed', label: '💰 Ready to Dispatch', color: 'teal' },
          { key: 'dispatched',        label: '✅ Dispatched',         color: 'blue' },
          { key: 'ceo_approved',      label: '⏳ Payment Pending',    color: 'orange' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? tab.color === 'teal'   ? 'bg-teal-600 text-white'
                : tab.color === 'blue'   ? 'bg-blue-600 text-white'
                : 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
            }`}>
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-sm text-gray-500 self-center">{pis.length} records</div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : pis.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-medium text-gray-600">Koi PI nahi mili</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pis.map(pi => (
            <div key={pi.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* PI Header */}
              <div className="flex items-start justify-between p-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono font-bold text-blue-700 text-base">{pi.pi_number}</span>
                    {pi.status === 'payment_confirmed' && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">✅ Ready to Dispatch</span>}
                    {pi.status === 'dispatched'        && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">🚚 Dispatched</span>}
                    {pi.status === 'ceo_approved'      && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">⏳ Payment Pending</span>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="font-medium text-gray-900">{pi.customer?.company_name}</p>
                      <p className="text-xs text-gray-500">{pi.customer?.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">City / State</p>
                      <p className="font-medium text-gray-700">{pi.customer?.city || '-'}{pi.customer?.state ? ', ' + pi.customer.state : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Brand / Type</p>
                      <p className="font-medium text-gray-700 capitalize">{pi.brand} — {pi.profile_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Salesperson</p>
                      <p className="font-medium text-gray-700">{pi.salesperson_name || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-gray-900">Rs.{fmt(pi.grand_total)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Grand Total</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(pi.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Dispatched Details — show if already dispatched */}
              {pi.status === 'dispatched' && (
                <div className="px-5 pb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-3">🚚 Dispatch Details</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500">Transport Company</p>
                        <p className="font-semibold text-gray-900">{pi.transport_company || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vehicle Number</p>
                        <p className="font-semibold text-gray-900 uppercase">{pi.vehicle_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Driver Name</p>
                        <p className="font-semibold text-gray-900">{pi.driver_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Driver Phone</p>
                        <p className="font-semibold text-gray-900">{pi.driver_phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">LR Number</p>
                        <p className="font-semibold text-gray-900">{pi.lr_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Freight Amount</p>
                        <p className="font-semibold text-gray-900">{pi.freight_amount > 0 ? `Rs.${fmt(pi.freight_amount)}` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Dispatched At</p>
                        <p className="font-semibold text-gray-900">{pi.dispatched_at ? new Date(pi.dispatched_at).toLocaleDateString('en-IN') : '-'}</p>
                      </div>
                      {pi.expected_dispatch_date && (
                        <div>
                          <p className="text-gray-500">Expected Delivery</p>
                          <p className="font-semibold text-blue-700">{new Date(pi.expected_dispatch_date).toLocaleDateString('en-IN')}</p>
                        </div>
                      )}
                      {pi.dispatch_note && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Note</p>
                          <p className="font-semibold text-gray-900">{pi.dispatch_note}</p>
                        </div>
                      )}
                    </div>
                    {(pi.dispatch_photo || pi.transport_copy) && (
                      <div className="flex gap-3 mt-3">
                        {pi.dispatch_photo && (
                          <a href={`http://127.0.0.1:8000/storage/${pi.dispatch_photo}`} target="_blank"
                            className="text-xs bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50">
                            📷 Dispatch Photo
                          </a>
                        )}
                        {pi.transport_copy && (
                          <a href={`http://127.0.0.1:8000/storage/${pi.transport_copy}`} target="_blank"
                            className="text-xs bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50">
                            📄 Transport Copy
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <button onClick={() => setViewModal(pi)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
                      🔍 Full Detail View
                    </button>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {pi.status === 'payment_confirmed' && (
                <div className="px-5 pb-5">
                  <button onClick={() => openDispatchModal(pi)}
                    className="w-full py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                    🚚 Dispatch Karo — Fill Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-900">📦 Dispatch Record</h3>
                <p className="text-xs text-gray-500 mt-0.5">{viewModal.pi_number} — {viewModal.customer?.company_name}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Customer Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-semibold text-gray-900">{viewModal.customer?.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact Person</p>
                    <p className="font-semibold text-gray-900">{viewModal.customer?.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">City / State</p>
                    <p className="font-semibold text-gray-900">{viewModal.customer?.city || '-'}{viewModal.customer?.state ? ', ' + viewModal.customer.state : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="font-semibold text-gray-900">{viewModal.customer?.mobile || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">GSTIN</p>
                    <p className="font-semibold text-gray-900">{viewModal.customer?.gstin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Salesperson</p>
                    <p className="font-semibold text-gray-900">{viewModal.salesperson_name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* PI Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">PI Details</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">PI Number</p>
                    <p className="font-bold text-blue-700 font-mono">{viewModal.pi_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Brand</p>
                    <p className="font-semibold text-gray-900 capitalize">{viewModal.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Profile Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{viewModal.profile_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Grand Total</p>
                    <p className="font-bold text-gray-900 text-base">Rs.{parseFloat(viewModal.grand_total||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PI Date</p>
                    <p className="font-semibold text-gray-900">{new Date(viewModal.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dispatched At</p>
                    <p className="font-semibold text-green-700">{viewModal.dispatched_at ? new Date(viewModal.dispatched_at).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Dispatch Info */}
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">🚚 Dispatch Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {viewModal.transport_company && (
                    <div>
                      <p className="text-xs text-gray-500">Transport Company</p>
                      <p className="font-semibold text-gray-900">{viewModal.transport_company}</p>
                    </div>
                  )}
                  {viewModal.lr_number && (
                    <div>
                      <p className="text-xs text-gray-500">LR Number</p>
                      <p className="font-semibold text-gray-900 font-mono">{viewModal.lr_number}</p>
                    </div>
                  )}
                  {viewModal.vehicle_number && (
                    <div>
                      <p className="text-xs text-gray-500">Vehicle Number</p>
                      <p className="font-semibold text-gray-900 font-mono uppercase">{viewModal.vehicle_number}</p>
                    </div>
                  )}
                  {viewModal.driver_name && (
                    <div>
                      <p className="text-xs text-gray-500">Driver Name</p>
                      <p className="font-semibold text-gray-900">{viewModal.driver_name}</p>
                    </div>
                  )}
                  {viewModal.driver_phone && (
                    <div>
                      <p className="text-xs text-gray-500">Driver Phone</p>
                      <p className="font-semibold text-gray-900">
                        <a href={`tel:${viewModal.driver_phone}`} className="text-blue-600 hover:underline">{viewModal.driver_phone}</a>
                      </p>
                    </div>
                  )}
                  {viewModal.freight_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Freight Amount</p>
                      <p className="font-semibold text-gray-900">Rs.{parseFloat(viewModal.freight_amount).toLocaleString('en-IN',{minimumFractionDigits:2})}</p>
                    </div>
                  )}
                  {viewModal.expected_dispatch_date && (
                    <div>
                      <p className="text-xs text-gray-500">Expected Delivery Date</p>
                      <p className="font-semibold text-blue-700">{new Date(viewModal.expected_dispatch_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  )}
                  {viewModal.dispatch_note && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Dispatch Note</p>
                      <p className="font-semibold text-gray-900">{viewModal.dispatch_note}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {(viewModal.dispatch_photo || viewModal.transport_copy) && (
                  <div className="flex gap-3 mt-4 pt-3 border-t border-green-200">
                    {viewModal.dispatch_photo && (
                      <a href={`http://127.0.0.1:8000/storage/${viewModal.dispatch_photo}`} target="_blank"
                        className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50">
                        📷 Dispatch Photo
                      </a>
                    )}
                    {viewModal.transport_copy && (
                      <a href={`http://127.0.0.1:8000/storage/${viewModal.transport_copy}`} target="_blank"
                        className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50">
                        📄 Transport Copy / LR
                      </a>
                    )}
                  </div>
                )}
              </div>

            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-2xl">
              <button onClick={() => setViewModal(null)}
                className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-900">🚚 Dispatch Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">{dispatchModal.pi_number} — {dispatchModal.customer?.company_name}</p>
              </div>
              <button onClick={() => setDispatchModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

              {/* Mode Toggle */}
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase mb-3">Dispatch Mode *</p>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => setForm({...form, dispatch_mode: 'transport'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors flex flex-col items-center gap-1 ${
                      form.dispatch_mode === 'transport'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}>
                    <span className="text-xl">🚛</span>
                    Transport Company
                  </button>
                  <button type="button"
                    onClick={() => setForm({...form, dispatch_mode: 'vehicle'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors flex flex-col items-center gap-1 ${
                      form.dispatch_mode === 'vehicle'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                    }`}>
                    <span className="text-xl">🚗</span>
                    Own / Private Vehicle
                  </button>
                </div>
              </div>

              {/* Transport Mode Fields */}
              {form.dispatch_mode === 'transport' && (
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                    Transport Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transport Company *</label>
                      <input type="text" value={form.transport_company}
                        onChange={e => setForm({...form, transport_company: e.target.value})}
                        placeholder="e.g. Gati, DTDC, VRL Logistics"
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">LR Number *</label>
                      <input type="text" value={form.lr_number}
                        onChange={e => setForm({...form, lr_number: e.target.value})}
                        placeholder="Lorry Receipt Number"
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Freight Amount (Rs.)</label>
                      <input type="number" value={form.freight_amount}
                        onChange={e => setForm({...form, freight_amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">📄 Transport Copy (LR/Bilty)</label>
                      <input type="file" accept="image/*,application/pdf"
                        onChange={e => setTransportCopy(e.target.files[0])}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {transportCopy && <p className="text-xs text-green-600 mt-1">✓ {transportCopy.name}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Mode Fields */}
              {form.dispatch_mode === 'vehicle' && (
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                    Vehicle & Driver Details *
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Number *</label>
                      <input type="text" value={form.vehicle_number}
                        onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})}
                        placeholder="e.g. WB55AB1234"
                        className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Driver Name *</label>
                      <input type="text" value={form.driver_name}
                        onChange={e => setForm({...form, driver_name: e.target.value})}
                        placeholder="Driver ka naam"
                        className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Driver Phone *</label>
                      <input type="tel" value={form.driver_phone}
                        onChange={e => setForm({...form, driver_phone: e.target.value})}
                        placeholder="10 digit mobile number"
                        className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">📷 Dispatch Photo</label>
                      <input type="file" accept="image/*"
                        onChange={e => setDispatchPhoto(e.target.files[0])}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      {dispatchPhoto && <p className="text-xs text-green-600 mt-1">✓ {dispatchPhoto.name}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dispatch Note</label>
                <textarea value={form.dispatch_note}
                  onChange={e => setForm({...form, dispatch_note: e.target.value})}
                  rows={2}
                  placeholder="Koi special instruction ya note..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Expected Dispatch Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">📅 Expected Delivery Date</label>
                <input type="date" value={form.expected_dispatch_date}
                  onChange={e => setForm({...form, expected_dispatch_date: e.target.value})}
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
              <button onClick={() => setDispatchModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleDispatch} disabled={saving}
                className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors">
                {saving ? 'Dispatching...' : '🚚 Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
