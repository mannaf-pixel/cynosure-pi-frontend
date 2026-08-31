'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const PAYMENT_MODES = {
  cash: 'Cash', phonepay: 'PhonePe', upi: 'UPI',
  bank_transfer: 'Bank Transfer', other: 'Other'
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [pis, setPis] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [piPayments, setPiPayments] = useState(null);
  const [showPiPayments, setShowPiPayments] = useState(false);
  const [form, setForm] = useState({
    pi_id: '', payment_date: new Date().toISOString().split('T')[0],
    amount: '', payment_mode: 'cash', received_in: '',
    transaction_id: '', note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchPIs();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await api.get(`/payments?from=${from}&to=${to}`);
      setPayments(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchCustomers() {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data);
    } catch (e) { console.error(e); }
  }

  async function fetchPIs() {
    try {
      const res = await api.get('/pi');
      setPis(res.data.data);
    } catch (e) { console.error(e); }
  }

  async function handleSave() {
    if (!form.pi_id) { setError('PI select karo.'); return; }
    if (!form.amount) { setError('Amount daalo.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/payments', form);
      setShowForm(false);
      fetchPayments();
      setForm({
        pi_id: '', payment_date: new Date().toISOString().split('T')[0],
        amount: '', payment_mode: 'cash', received_in: '',
        transaction_id: '', note: '',
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Error saving payment.');
    } finally { setSaving(false); }
  }

  async function openLedger(customerId) {
    try {
      const res = await api.get(`/payments/customer/${customerId}`);
      setLedgerData(res.data);
      setShowLedger(true);
    } catch (e) { console.error(e); }
  }

  async function openPiPayments(piId) {
    try {
      const res = await api.get(`/payments/pi/${piId}`);
      setPiPayments(res.data);
      setShowPiPayments(true);
    } catch (e) { console.error(e); }
  }

  async function deletePayment(id) {
    if (!confirm('Delete karna chahte ho?')) return;
    try {
      await api.delete(`/payments/${id}`);
      fetchPayments();
    } catch (e) { console.error(e); }
  }

  const totalReceived = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
          <p className="text-sm text-gray-500 mt-0.5">Payment collection aur ledger</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); if(e.target.value) openLedger(e.target.value); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Customer Ledger</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add Payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4 items-end flex-wrap">
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
        <button onClick={fetchPayments}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Apply
        </button>
        <div className="ml-auto bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <p className="text-xs text-green-600">Total Received</p>
          <p className="text-lg font-semibold text-green-700">Rs.{totalReceived.toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm">Koi payment nahi mili</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">PI Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Mode</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Received In</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-gray-700">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openPiPayments(p.pi_id)}
                        className="font-mono text-blue-600 hover:text-blue-800 font-medium">
                        {p.pi?.pi_number}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{p.customer?.company_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      Rs.{parseFloat(p.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.payment_mode === 'cash' ? 'bg-green-100 text-green-700' :
                        p.payment_mode === 'phonepay' ? 'bg-purple-100 text-purple-700' :
                        p.payment_mode === 'upi' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{PAYMENT_MODES[p.payment_mode]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.received_in || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deletePayment(p.id)}
                        className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    Rs.{totalReceived.toLocaleString('en-IN', {minimumFractionDigits:2})}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Add Payment</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PI Select karo *</label>
                <select value={form.pi_id} onChange={e => setForm({...form, pi_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select PI</option>
                  {pis.map(pi => (
                    <option key={pi.id} value={pi.id}>
                      {pi.pi_number} — {pi.customer?.company_name} — Rs.{parseFloat(pi.grand_total).toFixed(0)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input type="date" value={form.payment_date}
                    onChange={e => setForm({...form, payment_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (Rs.) *</label>
                  <input type="number" value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode *</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(PAYMENT_MODES).map(([k,v]) => (
                    <button key={k} onClick={() => setForm({...form, payment_mode: k})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.payment_mode === k
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300'
                      }`}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Received In (Account/Person)</label>
                <input type="text" value={form.received_in}
                  onChange={e => setForm({...form, received_in: e.target.value})}
                  placeholder="e.g. Mannaf PhonePe / Personal SBI"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
                <input type="text" value={form.transaction_id}
                  onChange={e => setForm({...form, transaction_id: e.target.value})}
                  placeholder="UPI/Bank transaction ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                <input type="text" value={form.note}
                  onChange={e => setForm({...form, note: e.target.value})}
                  placeholder="Optional note..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
                {saving ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PI Payment Details Modal */}
      {showPiPayments && piPayments && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{piPayments.pi?.pi_number}</h3>
                <p className="text-xs text-gray-500">{piPayments.pi?.customer?.company_name}</p>
              </div>
              <button onClick={() => setShowPiPayments(false)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">PI Amount</p>
                  <p className="text-sm font-semibold text-gray-900">Rs.{parseFloat(piPayments.grand_total).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Received</p>
                  <p className="text-sm font-semibold text-green-700">Rs.{parseFloat(piPayments.total_received).toFixed(2)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${parseFloat(piPayments.balance) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className={`text-xs ${parseFloat(piPayments.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>Balance</p>
                  <p className={`text-sm font-semibold ${parseFloat(piPayments.balance) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    Rs.{parseFloat(piPayments.balance).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment List */}
              {piPayments.payments?.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Koi payment nahi</div>
              ) : (
                <div className="space-y-2">
                  {piPayments.payments?.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                        <p className="text-xs text-gray-600">{PAYMENT_MODES[p.payment_mode]} {p.received_in ? `— ${p.received_in}` : ''}</p>
                        {p.note && <p className="text-xs text-gray-400">{p.note}</p>}
                      </div>
                      <p className="font-semibold text-green-700">Rs.{parseFloat(p.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowPiPayments(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {showLedger && ledgerData && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Customer Ledger</h3>
              <button onClick={() => { setShowLedger(false); setSelectedCustomer(''); }} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Totals */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total PI Value</p>
                  <p className="text-sm font-semibold text-gray-900">Rs.{parseFloat(ledgerData.totals?.total_pi_value||0).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Total Received</p>
                  <p className="text-sm font-semibold text-green-700">Rs.{parseFloat(ledgerData.totals?.total_received||0).toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600">Total Balance</p>
                  <p className="text-sm font-semibold text-red-700">Rs.{parseFloat(ledgerData.totals?.total_balance||0).toFixed(2)}</p>
                </div>
              </div>

              {/* PI wise ledger */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">PI Number</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">PI Amount</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Received</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.data?.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${i%2===0?'':'bg-gray-50/50'}`}>
                        <td className="px-3 py-2 font-mono text-blue-700">{row.pi_number}</td>
                        <td className="px-3 py-2 text-gray-500">{row.date}</td>
                        <td className="px-3 py-2 text-right text-gray-900">Rs.{parseFloat(row.grand_total).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-green-700">Rs.{parseFloat(row.total_received).toFixed(2)}</td>
                        <td className={`px-3 py-2 text-right font-medium ${parseFloat(row.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Rs.{parseFloat(row.balance).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => { setShowLedger(false); setSelectedCustomer(''); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
