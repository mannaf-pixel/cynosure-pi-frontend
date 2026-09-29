'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api, { API_BASE } from '@/lib/api';
import { getCompany, getPricingMode } from '@/lib/auth';

const STATUS_COLORS = {
  draft:             'bg-gray-100 text-gray-600',
  submitted:         'bg-blue-100 text-blue-700',
  md_pending:        'bg-amber-100 text-amber-700',
  md_approved:       'bg-cyan-100 text-cyan-700',
  ceo_pending:       'bg-purple-100 text-purple-700',
  ceo_approved:      'bg-green-100 text-green-700',
  payment_pending:   'bg-orange-100 text-orange-700',
  payment_confirmed:    'bg-teal-100 text-teal-700',
  delivery_scheduled:   'bg-purple-100 text-purple-700',
  dispatched:           'bg-blue-100 text-blue-800',
  rejected:          'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  draft:             'Draft',
  submitted:         'Submitted',
  md_pending:        'MD Approval Pending',
  md_approved:       'MD Approved',
  ceo_pending:       'CEO Approval Pending',
  ceo_approved:      'CEO Approved',
  payment_pending:   'Payment Pending',
  payment_confirmed:   'Payment Confirmed',
  delivery_scheduled:  'Delivery Scheduled 📅',
  dispatched:          'Dispatched ✅',
  rejected:          'Rejected',
};

const BRANDS = [
  { value: 'cynosure',     label: 'Cynosure Profile' },
  { value: 'assre_plasto', label: 'Assre Plasto' },
  { value: 'sinewy',       label: 'Sinewy uPVC' },
  { value: 'plastrong',    label: 'Plastrong' },
];

export default function PIPage() {
  const company     = getCompany();
  const pricingMode = getPricingMode();
  const isPlastrong = pricingMode === 'per_kg';
  const defaultBrand = company?.slug || 'cynosure';

  const EMPTY_FORM = {
    customer_id: '', brand: defaultBrand,
    transport_charge: '0', insurance_charge: '0', insurance_pct: '0',
    white_discount_pct: '0', color_discount_pct: '0', hardware_discount_pct: '0',
    cd_discount_pct: '0',
    discount_pct: '0', remarks: '',
    salesperson_name: '',
    color_name: '',
    actual_amount: '', payment_mode: '', received_in: '', payment_note: '',
  };

  const [user, setUser] = useState(null);
  const [pis, setPis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPI, setEditingPI] = useState(null);
  const [showDetail, setShowDetail] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [hardwareList, setHardwareList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = Cookies.get('cynosure_user');
    if (u) { try { setUser(JSON.parse(u)); } catch(e) {} }
    fetchPIs();
  }, []);

  async function fetchPIs() {
    setLoading(true);
    try {
      const res = await api.get('/pi');
      setPis(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadFormData() {
    const [cRes, pRes, hRes] = await Promise.all([
      api.get('/customers'),
      api.get('/products'),
      api.get('/hardware'),
    ]);
    setCustomers(cRes.data.data);
    setProducts(pRes.data.data.filter(p => p.is_active));
    setHardwareList(hRes.data.data || []);
  }

  async function openCreate() {
    setError('');
    setEditingPI(null);
    setForm(EMPTY_FORM);
    setItems([]);
    await loadFormData();
    setShowForm(true);
  }

  async function openEdit(pi) {
    setError('');
    setEditingPI(pi);
    setForm({
      customer_id:      pi.customer_id,
      brand:            pi.brand || defaultBrand,
      transport_charge: pi.transport_charge,
      insurance_charge: pi.insurance_charge,
      insurance_pct:    pi.insurance_pct || '0',
      discount_pct:     pi.discount_pct || '0',
      remarks:          pi.remarks || '',
      salesperson_name: pi.salesperson_name || '',
      actual_amount:    pi.actual_amount || '',
      payment_mode:     pi.payment_mode || '',
      received_in:      pi.received_in || '',
      payment_note:     pi.payment_note || '',
      color_name:       pi.color_name || '',
      white_discount_pct:    pi.white_discount_pct || '0',
      color_discount_pct:    pi.color_discount_pct || '0',
      hardware_discount_pct: pi.hardware_discount_pct || '0',
      cd_discount_pct:       pi.cd_discount_pct || '0',
    });
    try {
      const res = await api.get(`/pi/${pi.id}`);
      const fullPI = res.data.data;
      if (isPlastrong) {
        setItems(fullPI.items.map(item => ({
          item_type:    'profile',
          product_id:   item.product_id,
          total_pieces: item.total_pieces,
          total_weight: item.total_weight,
          unit_rate:    item.unit_rate_snap,
        })));
      } else {
        setItems(fullPI.items.map(item => ({
          item_type:          item.item_type || 'profile',
          profile_type:       item.profile_type_snap || 'white',
          product_id:         item.product_id,
          hardware_product_id: item.hardware_product_id,
          bundle_qty_ordered: item.bundle_qty_ordered,
          total_pieces:       item.total_pieces,
          quantity:           item.quantity || 0,
          color_name:         item.color_name || '',
        })));
      }
    } catch(e) { console.error(e); }
    await loadFormData();
    setShowDetail(null);
    setShowForm(true);
  }

  function addProfileItem(profileType) {
    if (isPlastrong) {
      setItems([...items, { item_type: 'profile', product_id: '', total_pieces: '', total_weight: '', unit_rate: '' }]);
    } else {
      const discPct = profileType === 'white' ? form.white_discount_pct : form.color_discount_pct;
      const lastColorName = profileType === 'color' ? (items.filter(i => i.item_type === 'profile' && i.profile_type === 'color').slice(-1)[0]?.color_name || '') : '';
      setItems([...items, { item_type: 'profile', profile_type: profileType, product_id: '', bundle_qty_ordered: 1, total_pieces: 1, color_name: lastColorName, discount_pct: discPct }]);
    }
  }

  function addHardwareItem() {
    setItems([...items, { item_type: 'hardware', hardware_product_id: '', quantity: 1, discount_pct: form.hardware_discount_pct }]);
  }

  function removeItem(index) { setItems(items.filter((_, i) => i !== index)); }

  function updateItem(index, field, value) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function getProduct(id) { return products.find(p => p.id === parseInt(id)); }
  function getHardware(id) { return hardwareList.find(h => h.id === parseInt(id)); }

  function calcLine(item) {
    const p = getProduct(item.product_id);
    if (!p) return { totalLength: 0, totalPieces: 0, lineTotal: 0, rate: 0, totalWeight: 0 };
    const isWhite = item.profile_type === 'white';
    let rate;
    if (form.brand === 'sinewy') {
      rate = isWhite ? p.sinewy_white_rate : p.sinewy_color_rate;
    } else if (form.brand === 'assre_plasto') {
      rate = isWhite ? p.assre_white_rate : p.assre_color_rate;
    } else {
      rate = isWhite ? p.white_rate : p.color_rate;
    }
    let totalLength, totalPieces, bundleQty;
    if (isWhite) {
      bundleQty   = item.bundle_qty_ordered || 1;
      totalPieces = bundleQty * p.bundle_qty;
      totalLength = bundleQty * p.bundle_qty * p.profile_length;
    } else {
      totalPieces = parseInt(item.total_pieces) || 0;
      bundleQty   = Math.ceil(totalPieces / p.bundle_qty);
      totalLength = totalPieces * p.profile_length;
    }
    const totalWeight = totalLength * (p.weight_per_meter || 0);
    const discountPct = parseFloat(item.discount_pct ?? form.white_discount_pct) || 0;
    const netRate     = rate * (1 - discountPct / 100);
    const lineTotal   = Math.round(totalLength * netRate * 100) / 100;
    return { totalLength, totalPieces, bundleQty, lineTotal, rate, netRate, totalWeight };
  }

  function calcLinePlastrong(item) {
    const kg   = parseFloat(item.total_weight) || 0;
    const rate = parseFloat(item.unit_rate) || 0;
    return { lineTotal: kg * rate };
  }

  function calcHardwareLine(item) {
    const h = getHardware(item.hardware_product_id);
    if (!h) return { lineTotal: 0, rate: 0 };
    const qty         = parseFloat(item.quantity) || 0;
    const discountPct = parseFloat(item.discount_pct ?? form.hardware_discount_pct) || 0;
    const netRate     = h.rate * (1 - discountPct / 100);
    return { lineTotal: Math.round(qty * netRate * 100) / 100, rate: h.rate, netRate, unit: h.unit };
  }

  function calcTotals() {
    let subtotal = 0;
    items.forEach(item => {
      if (item.item_type === 'hardware') {
        subtotal += calcHardwareLine(item).lineTotal;
      } else if (isPlastrong) {
        subtotal += calcLinePlastrong(item).lineTotal;
      } else {
        subtotal += calcLine(item).lineTotal;
      }
    });
    const transport     = parseFloat(form.transport_charge) || 0;
    const insurancePct  = parseFloat(form.insurance_pct) || 0;
    const cdDiscountPct = parseFloat(form.cd_discount_pct) || 0;
    const discountPct   = 0;
    const discountAmt   = 0;
    const afterDiscount = subtotal;

    // Sahi order: Subtotal → CD Discount → Insurance → Transport → GST
    const cdDiscountAmt = Math.round(afterDiscount * cdDiscountPct / 100 * 100) / 100;
    const afterCd       = afterDiscount - cdDiscountAmt;
    const insurance     = Math.round(afterCd * insurancePct / 100 * 100) / 100;
    const taxable       = afterCd + transport + insurance;
    const gst           = Math.round(taxable * 0.18 * 100) / 100;
    const grand         = Math.round((taxable + gst) * 100) / 100;
    return { subtotal, discountPct, discountAmt, afterDiscount, transport, insurance, insurancePct, cdDiscountPct, cdDiscountAmt, afterCd, gst, grand };
  }

  async function handleSubmit() {
    if (!form.customer_id) { setError('Customer select karo.'); return; }
    if (items.length === 0) { setError('Kam se kam ek product add karo.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        profile_type: 'white',
        white_discount_pct:    parseFloat(form.white_discount_pct) || 0,
        color_discount_pct:    parseFloat(form.color_discount_pct) || 0,
        hardware_discount_pct: parseFloat(form.hardware_discount_pct) || 0,
        cd_discount_pct:       parseFloat(form.cd_discount_pct) || 0,
        items: items.map(item => {
          if (item.item_type === 'hardware') {
            const h = getHardware(item.hardware_product_id);
            return {
              item_type:           'hardware',
              hardware_product_id: item.hardware_product_id,
              quantity:            parseFloat(item.quantity) || 0,
              unit_rate:           h?.rate || 0,
              discount_pct:        parseFloat(item.discount_pct) || 0,
            };
          } else if (isPlastrong) {
            return {
              item_type:          'profile',
              product_id:         item.product_id,
              total_pieces:       parseFloat(item.total_pieces) || 0,
              total_weight:       parseFloat(item.total_weight) || 0,
              unit_rate:          parseFloat(item.unit_rate) || 0,
              bundle_qty_ordered: 1,
              profile_type:       'white',
            };
          } else {
            const isWhite = item.profile_type === 'white';
            const p = getProduct(item.product_id);
            return {
              item_type:          'profile',
              product_id:         item.product_id,
              profile_type:       item.profile_type,
              bundle_qty_ordered: isWhite ? (parseInt(item.bundle_qty_ordered) || 1) : Math.ceil((parseInt(item.total_pieces) || 1) / (p?.bundle_qty || 1)),
              total_pieces:       isWhite ? null : (parseInt(item.total_pieces) || 0),
              color_name:         isWhite ? null : (item.color_name || null),
            };
          }
        }),
      };
      if (editingPI) {
        await api.put(`/pi/${editingPI.id}`, payload);
      } else {
        await api.post('/pi', payload);
      }
      setShowForm(false);
      fetchPIs();
    } catch (e) {
      setError(e.response?.data?.message || 'PI save karne mein error.');
    } finally { setSaving(false); }
  }

  async function handleDelete(id, piNumber) {
    if (!confirm(`PI ${piNumber} delete karna chahte ho? Yeh action undo nahi hoga.`)) return;
    try {
      await api.delete(`/pi/${id}`);
      fetchPIs();
      setShowDetail(null);
    } catch (e) { alert(e.response?.data?.message || 'Delete mein error.'); }
  }

  async function confirmPayment(id) {
    if (!confirm('Payment confirm karna chahte ho?')) return;
    try { await api.post(`/pi/${id}/confirm-payment`); fetchPIs(); setShowDetail(null); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  async function dispatchPI(id) {
    if (!confirm('PI dispatch karna chahte ho?')) return;
    try { await api.post(`/pi/${id}/dispatch`); fetchPIs(); setShowDetail(null); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  async function handleSubmitForApproval(id) {
    try { await api.post(`/pi/${id}/submit`); fetchPIs(); setShowDetail(null); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  async function handleApprove(id) {
    try { await api.post(`/pi/${id}/approve`, { comments: '' }); fetchPIs(); setShowDetail(null); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  async function handleReject(id) {
    const comments = prompt('Rejection reason likhein:');
    if (!comments) return;
    try { await api.post(`/pi/${id}/reject`, { comments }); fetchPIs(); setShowDetail(null); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  function downloadPDF(id, piNumber, showWeight = false) {
    const token = Cookies.get('cynosure_token');
    const url = `https://cynosurepi.online/api/v1/pi/${id}/pdf${showWeight ? '?show_weight=1' : ''}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.responseType = 'blob';
    xhr.onload = function() {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: 'application/pdf' });
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `PI-${piNumber}${showWeight ? '-internal' : ''}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objUrl);
      } else { alert('PDF error: ' + xhr.status); }
    };
    xhr.onerror = function() { alert('PDF Network Error'); };
    xhr.send();
  }

  async function openDetail(id) {
    try { const res = await api.get(`/pi/${id}`); setShowDetail(res.data.data); }
    catch (e) { console.error(e); }
  }

  const totals = calcTotals();
  const filtered = pis.filter(p => {
    const matchSearch = !search ||
      p.pi_number.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const brandLabel = (b) => BRANDS.find(x => x.value === b)?.label || b;
  const profileItems   = items.filter(i => i.item_type === 'profile');
  const hardwareItems  = items.filter(i => i.item_type === 'hardware');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Proforma Invoices</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pis.length} total PIs</p>
        </div>
        <button onClick={() => openCreate()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Create PI
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="Search PI number or customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k,v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm">Koi PI nahi mili</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">PI Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Grand Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Received</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pi, i) => (
                  <tr key={pi.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i%2===0?'':`bg-gray-50/50`}`}>
                    <td className="px-4 py-3 font-mono font-medium text-blue-700">{pi.pi_number}</td>
                    <td className="px-4 py-3 text-gray-900">{pi.customer?.company_name || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      Rs.{parseFloat(pi.grand_total).toLocaleString('en-IN', {minimumFractionDigits:2})}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">
                      {parseFloat(pi.total_received||0) > 0 ? `Rs.${parseFloat(pi.total_received).toLocaleString('en-IN', {minimumFractionDigits:2})}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={parseFloat(pi.balance||pi.grand_total) > 0 ? 'text-red-600' : 'text-green-600'}>
                        Rs.{parseFloat(pi.balance||pi.grand_total).toLocaleString('en-IN', {minimumFractionDigits:2})}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[pi.status]}`}>
                        {STATUS_LABELS[pi.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(pi.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(pi.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
                        {(pi.status === 'draft' || pi.status === 'rejected') && (
                          <button onClick={() => openEdit(pi)}
                            className="text-xs text-amber-600 hover:text-amber-800 font-medium">Edit</button>
                        )}
                        {(pi.status === 'draft' || pi.status === 'rejected' || user?.role === 'admin') && (
                          <button onClick={() => handleDelete(pi.id, pi.pi_number)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {editingPI ? `Edit PI — ${editingPI.pi_number}` : 'Create New Proforma Invoice'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                  <select value={form.customer_id}
                    onChange={e => setForm({...form, customer_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name} — {c.customer_name}</option>
                    ))}
                  </select>
                </div>
                {!isPlastrong && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Brand *</label>
                    <select value={form.brand}
                      onChange={e => setForm({...form, brand: e.target.value})}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {BRANDS.filter(b => b.value !== 'plastrong').map(b => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Salesperson Name</label>
                  <input type="text" value={form.salesperson_name || ''}
                    onChange={e => setForm({...form, salesperson_name: e.target.value})}
                    placeholder="Sales person ka naam..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!isPlastrong && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color Name <span className="text-gray-400">(e.g. Charcoal, Rosewood)</span></label>
                    <input type="text" value={form.color_name || ''}
                      onChange={e => setForm({...form, color_name: e.target.value})}
                      placeholder="Color ka naam likhein..."
                      className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                )}
              </div>

              {/* uPVC Profiles Section */}
              {!isPlastrong && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">🏗️ uPVC Profiles</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addProfileItem('white')}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-medium">
                        + White (Bundle)
                      </button>
                      <button onClick={() => addProfileItem('color')}
                        className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg font-medium">
                        + Color (Pieces)
                      </button>
                    </div>
                  </div>
                  {profileItems.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 text-sm">
                      White ya Color product add karo
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-3 py-2 font-medium text-gray-600 w-16">Type</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Rate/m</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Mtr/Bndl</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600">Qty</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Total Mtr</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => {
                            if (item.item_type !== 'profile') return null;
                            const line = calcLine(item);
                            const prod = getProduct(item.product_id);
                            const isWhite = item.profile_type === 'white';
                            return (
                              <tr key={index} className={`border-b border-gray-100 ${isWhite ? 'bg-blue-50/30' : 'bg-orange-50/30'}`}>
                                <td className="px-3 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isWhite ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {isWhite ? 'White' : 'Color'}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <select value={item.product_id}
                                    onChange={e => updateItem(index, 'product_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                      <option key={p.id} value={p.id}>{p.product_code} — {p.product_name}</option>
                                    ))}
                                  </select>
                                  {prod && (
                                    <div className="text-gray-400 mt-0.5">
                                      1 bundle = {prod.bundle_qty} pcs × {prod.profile_length}m
                                    </div>
                                  )}
                                  {!isWhite && (
                                    <input type="text" value={item.color_name || ''}
                                      onChange={e => updateItem(index, 'color_name', e.target.value)}
                                      placeholder="Color naam (Charcoal, Rosewood...)"
                                      className="w-full border border-orange-200 rounded px-2 py-1 text-xs mt-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {prod ? (() => {
                                    const isW = item.profile_type === 'white';
                                    if (form.brand === 'sinewy') return `Rs.${isW ? prod.sinewy_white_rate : prod.sinewy_color_rate}`;
                                    if (form.brand === 'assre_plasto') return `Rs.${isW ? prod.assre_white_rate : prod.assre_color_rate}`;
                                    return `Rs.${isW ? prod.white_rate : prod.color_rate}`;
                                  })() : '-'}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-500">
                                  {prod ? `${(prod.bundle_qty * prod.profile_length).toFixed(2)}m` : '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {isWhite ? (
                                    <input type="number" min="1" value={item.bundle_qty_ordered}
                                      onChange={e => updateItem(index, 'bundle_qty_ordered', parseInt(e.target.value)||1)}
                                      className="w-14 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  ) : (
                                    <input type="number" min="1" value={item.total_pieces}
                                      onChange={e => updateItem(index, 'total_pieces', parseInt(e.target.value)||1)}
                                      className="w-16 border border-orange-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-orange-400"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-blue-700">
                                  {line.totalLength > 0 ? `${line.totalLength.toFixed(2)}m` : '-'}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">
                                  {line.lineTotal > 0 ? `Rs.${line.lineTotal.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-2 py-2">
                                  <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Plastrong Section */}
              {isPlastrong && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Products</span>
                    <button onClick={() => addProfileItem('white')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add Product</button>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Pieces</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Kg</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Rate/kg</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                          <th className="px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const kg   = parseFloat(item.total_weight) || 0;
                          const rate = parseFloat(item.unit_rate) || 0;
                          const lineTotal = kg * rate;
                          return (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="px-3 py-2">
                                <select value={item.product_id}
                                  onChange={e => updateItem(index, 'product_id', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs">
                                  <option value="">Select Product</option>
                                  {products.map(p => <option key={p.id} value={p.id}>{p.product_code} — {p.product_name}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={item.total_pieces} onChange={e => updateItem(index, 'total_pieces', e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-right"/>
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" step="0.001" value={item.total_weight} onChange={e => updateItem(index, 'total_weight', e.target.value)} placeholder="0.000" className="w-full border border-amber-300 rounded px-2 py-1 text-xs text-right"/>
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={item.unit_rate} onChange={e => updateItem(index, 'unit_rate', e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-right"/>
                              </td>
                              <td className="px-3 py-2 text-right font-medium">{lineTotal > 0 ? `Rs.${lineTotal.toFixed(2)}` : '-'}</td>
                              <td className="px-2 py-2"><button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">✕</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Hardware Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">🔧 Hardware & Accessories</span>
                  <button onClick={() => addHardwareItem()}
                    className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                    + Add Hardware
                  </button>
                </div>
                {hardwareItems.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-lg p-3 text-center text-gray-400 text-xs">
                    Hardware optional hai — Handle, Lock, Track etc.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-green-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Hardware Item</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600">Unit</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Rate</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600">Qty</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                          <th className="px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          if (item.item_type !== 'hardware') return null;
                          const hw   = getHardware(item.hardware_product_id);
                          const line = calcHardwareLine(item);
                          return (
                            <tr key={index} className="border-b border-gray-100 bg-green-50/20">
                              <td className="px-3 py-2">
                                <select value={item.hardware_product_id}
                                  onChange={e => updateItem(index, 'hardware_product_id', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500">
                                  <option value="">Select Hardware</option>
                                  {hardwareList.map(h => (
                                    <option key={h.id} value={h.id}>{h.code} — {h.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-500 capitalize">{hw?.unit || '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{hw ? `Rs.${hw.rate}` : '-'}</td>
                              <td className="px-3 py-2 text-center">
                                <input type="number" min="1" step="0.001" value={item.quantity}
                                  onChange={e => updateItem(index, 'quantity', e.target.value)}
                                  className="w-16 border border-green-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-green-700">
                                {line.lineTotal > 0 ? `Rs.${line.lineTotal.toFixed(2)}` : '-'}
                              </td>
                              <td className="px-2 py-2">
                                <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Charges + Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transport (Rs.)</label>
                      <input type="number" value={form.transport_charge}
                        onChange={e => setForm({...form, transport_charge: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Insurance % <span className="text-gray-400">(After Discount pe)</span></label>
                      <input type="number" min="0" max="5" step="0.001" value={form.insurance_pct}
                        onChange={e => setForm({...form, insurance_pct: e.target.value})}
                        placeholder="e.g. 0.75"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {totals.insurance > 0 && (
                        <p className="text-xs text-gray-500 mt-1">= Rs.{totals.insurance.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">📉 Discount % (Har item rate pe lagega)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">⬜ White Discount %</label>
                        <input type="number" min="0" max="100" step="0.01" value={form.white_discount_pct}
                          onChange={e => {
                            setForm({...form, white_discount_pct: e.target.value});
                            setItems(items.map(i => i.item_type === 'profile' && i.profile_type === 'white' ? {...i, discount_pct: e.target.value} : i));
                          }}
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">🎨 Color Discount %</label>
                        <input type="number" min="0" max="100" step="0.01" value={form.color_discount_pct}
                          onChange={e => {
                            setForm({...form, color_discount_pct: e.target.value});
                            setItems(items.map(i => i.item_type === 'profile' && i.profile_type === 'color' ? {...i, discount_pct: e.target.value} : i));
                          }}
                          className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">🔧 Hardware Discount %</label>
                        <input type="number" min="0" max="100" step="0.01" value={form.hardware_discount_pct}
                          onChange={e => {
                            setForm({...form, hardware_discount_pct: e.target.value});
                            setItems(items.map(i => i.item_type === 'hardware' ? {...i, discount_pct: e.target.value} : i));
                          }}
                          className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">💵 CD Discount % <span className="text-gray-400">(Grand Total ke baad)</span></label>
                    <input type="number" min="0" max="100" step="0.01" value={form.cd_discount_pct}
                      onChange={e => setForm({...form, cd_discount_pct: e.target.value})}
                      className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea value={form.remarks}
                      onChange={e => setForm({...form, remarks: e.target.value})}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">💰 Payment Details (Internal)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Actual Amount Received</label>
                        <input type="number" value={form.actual_amount}
                          onChange={e => setForm({...form, actual_amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
                        <select value={form.payment_mode}
                          onChange={e => setForm({...form, payment_mode: e.target.value})}
                          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                          <option value="">Select Mode</option>
                          <option value="cash">Cash</option>
                          <option value="phonepay">PhonePe</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Received In</label>
                      <input type="text" value={form.received_in}
                        onChange={e => setForm({...form, received_in: e.target.value})}
                        placeholder="e.g. Mannaf PhonePe"
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Payment Note</label>
                      <input type="text" value={form.payment_note}
                        onChange={e => setForm({...form, payment_note: e.target.value})}
                        placeholder="Optional note..."
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-3">Summary</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>uPVC Profiles</span>
                    <span>Rs.{items.filter(i=>i.item_type==='profile').reduce((s,item)=> s + (isPlastrong ? calcLinePlastrong(item).lineTotal : calcLine(item).lineTotal), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Hardware</span>
                    <span>Rs.{items.filter(i=>i.item_type==='hardware').reduce((s,item)=> s + calcHardwareLine(item).lineTotal, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 border-t border-gray-200 pt-1">
                    <span>Subtotal</span>
                    <span>Rs.{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.cdDiscountPct > 0 && (
                    <div className="flex justify-between text-sm text-purple-600 font-medium">
                      <span>CD Discount ({totals.cdDiscountPct}%)</span>
                      <span>- Rs.{totals.cdDiscountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.cdDiscountPct > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>After CD</span>
                      <span>Rs.{totals.afterCd.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Transport</span><span>Rs.{totals.transport.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Insurance ({totals.insurancePct}%)</span><span>Rs.{totals.insurance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>GST 18%</span><span>Rs.{totals.gst.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold text-gray-900">
                    <span>Total (before CD)</span><span>Rs.{totals.beforeCd.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
                    <span>Grand Total</span><span>Rs.{totals.grand.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
                {saving ? 'Saving...' : editingPI ? 'Update PI' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{showDetail.pi_number}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[showDetail.status]}`}>
                  {STATUS_LABELS[showDetail.status]}
                </span>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{showDetail.customer?.company_name}</p>
                  <p className="text-gray-500">{showDetail.customer?.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Brand / Salesperson</p>
                  <p className="font-medium text-gray-900">{brandLabel(showDetail.brand)}</p>
                  <p className="text-gray-500">{showDetail.salesperson_name || '-'}</p>
                </div>
              </div>

              {/* Profile Items */}
              {showDetail.items?.filter(i => i.item_type !== 'hardware').length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">🏗️ uPVC Profiles</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Code</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Bundles/Pcs</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Total Mtr</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Weight</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Rate/m</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showDetail.items?.filter(i => i.item_type !== 'hardware').map((item, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-3 py-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.profile_type_snap === 'color' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.profile_type_snap === 'color' ? 'Color' : 'White'}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-blue-700">{item.product_code_snap}</td>
                            <td className="px-3 py-2 text-gray-900">{item.product_name_snap}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{item.bundle_qty_ordered}</td>
                            <td className="px-3 py-2 text-right text-blue-700 font-medium">{item.total_length}m</td>
                            <td className="px-3 py-2 text-right text-amber-700">{parseFloat(item.total_weight||0).toFixed(3)}kg</td>
                            <td className="px-3 py-2 text-right text-gray-700">Rs.{item.unit_rate_snap}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">Rs.{parseFloat(item.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Hardware Items */}
              {showDetail.items?.filter(i => i.item_type === 'hardware').length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">🔧 Hardware & Accessories</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-green-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Item</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600">Unit</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Rate</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showDetail.items?.filter(i => i.item_type === 'hardware').map((item, i) => (
                          <tr key={i} className="border-b border-gray-100 bg-green-50/20">
                            <td className="px-3 py-2 font-medium text-gray-900">{item.hardware_name_snap}</td>
                            <td className="px-3 py-2 text-center text-gray-500 capitalize">{item.hardware_unit_snap}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-gray-700">Rs.{item.unit_rate_snap}</td>
                            <td className="px-3 py-2 text-right font-medium text-green-700">Rs.{parseFloat(item.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span><span>Rs.{parseFloat(showDetail.subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(showDetail.discount_pct || 0) > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({showDetail.discount_pct}%)</span>
                      <span>- Rs.{parseFloat(showDetail.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Transport</span><span>Rs.{parseFloat(showDetail.transport_charge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Insurance</span><span>Rs.{parseFloat(showDetail.insurance_charge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST 18%</span><span>Rs.{parseFloat(showDetail.gst_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                    <span>Grand Total</span><span>Rs.{parseFloat(showDetail.grand_total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end flex-wrap">
              {(showDetail.status === 'draft' || showDetail.status === 'rejected' || user?.role === 'admin') && (
                <>
                  <button onClick={() => handleDelete(showDetail.id, showDetail.pi_number)}
                    className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg border border-red-200">
                    Delete PI
                  </button>
                  <button onClick={() => openEdit(showDetail)}
                    className="px-4 py-2 text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg border border-amber-200">
                    Edit PI
                  </button>
                  <button onClick={() => handleSubmitForApproval(showDetail.id)}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                    Submit for Approval
                  </button>
                </>
              )}
              {(showDetail.status === 'md_pending' || showDetail.status === 'ceo_pending') && (
                <>
                  <button onClick={() => handleReject(showDetail.id)}
                    className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg border border-red-200">
                    Reject
                  </button>
                  <button onClick={() => handleApprove(showDetail.id)}
                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg">
                    Approve
                  </button>
                </>
              )}
              <button onClick={() => downloadPDF(showDetail.id, showDetail.pi_number, false)}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg">
                📄 Customer PDF
              </button>
              {!isPlastrong && (
                <button onClick={() => downloadPDF(showDetail.id, showDetail.pi_number, true)}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg">
                  📋 Internal PDF (with Weight)
                </button>
              )}
              {showDetail.status === 'ceo_approved' && (
                <button onClick={() => confirmPayment(showDetail.id)}
                  className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg">
                  💰 Confirm Payment
                </button>
              )}
              {showDetail.status === 'payment_confirmed' && (
                <button onClick={() => dispatchPI(showDetail.id)}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                  🚚 Dispatch
                </button>
              )}
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
