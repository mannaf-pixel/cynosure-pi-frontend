'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    product_code: '', product_name: '', category: '',
    white_rate: '', color_rate: '', sinewy_white_rate: '', sinewy_color_rate: '', assre_white_rate: '', assre_color_rate: '', profile_length: '5.80',
    bundle_qty: '1', weight_per_meter: '0', mrp: '0', discount_pct: '0',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ product_code:'', product_name:'', category:'',
      white_rate:'', color_rate:'', sinewy_white_rate:'', sinewy_color_rate:'', assre_white_rate:'', assre_color_rate:'', profile_length:'5.80',
      bundle_qty:'1', weight_per_meter:'0', mrp:'0', discount_pct:'0' });
    setError('');
    setShowForm(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      product_code:     p.product_code,
      product_name:     p.product_name,
      category:         p.category || '',
      white_rate:         p.white_rate,
      color_rate:         p.color_rate,
      sinewy_white_rate:  p.sinewy_white_rate || '',
      sinewy_color_rate:  p.sinewy_color_rate || '',
      assre_white_rate:   p.assre_white_rate || '',
      assre_color_rate:   p.assre_color_rate || '',
      profile_length:   p.profile_length,
      bundle_qty:       p.bundle_qty,
      weight_per_meter: p.weight_per_meter || '0',
      mrp:              p.mrp,
      discount_pct:     p.discount_pct,
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post('/products', form);
      }
      setShowForm(false);
      fetchProducts();
    } catch (e) {
      setError(e.response?.data?.message || 'Error saving product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    try {
      await api.patch(`/products/${id}/toggle`);
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = products.filter(p =>
    p.product_code.toLowerCase().includes(search.toLowerCase()) ||
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products total</p>
        </div>
        <button onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Product
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by code or name..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm">Koi product nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Cynosure W</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Cynosure C</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sinewy W</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sinewy C</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Assre W</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Assre C</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Wt/m (kg)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Length</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Bundle Qty</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-mono font-medium text-blue-700">{p.product_code}</td>
                    <td className="px-4 py-3 text-gray-900">{p.product_name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900">Rs.{p.white_rate}</td>
                    <td className="px-4 py-3 text-right text-gray-900">Rs.{p.color_rate}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{p.sinewy_white_rate > 0 ? `Rs.${p.sinewy_white_rate}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{p.sinewy_color_rate > 0 ? `Rs.${p.sinewy_color_rate}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-green-600">{p.assre_white_rate > 0 ? `Rs.${p.assre_white_rate}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-green-600">{p.assre_color_rate > 0 ? `Rs.${p.assre_color_rate}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {parseFloat(p.weight_per_meter || 0) > 0
                        ? <span className="text-amber-700 font-medium">{parseFloat(p.weight_per_meter).toFixed(3)}</span>
                        : <span className="text-gray-300">-</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.profile_length}m</td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.bundle_qty}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(p)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Edit
                        </button>
                        <button onClick={() => handleToggle(p.id)}
                          className={`text-xs font-medium ${p.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product Code *</label>
                  <input type="text" value={form.product_code}
                    onChange={e => setForm({...form, product_code: e.target.value})}
                    placeholder="CSS304"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    placeholder="Casement / Sliding"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                <input type="text" value={form.product_name}
                  onChange={e => setForm({...form, product_name: e.target.value})}
                  placeholder="Sliding Window Sash 57x37"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cynosure White Rate *</label>
                  <input type="number" value={form.white_rate}
                    onChange={e => setForm({...form, white_rate: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cynosure Color Rate *</label>
                  <input type="number" value={form.color_rate}
                    onChange={e => setForm({...form, color_rate: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sinewy White Rate</label>
                  <input type="number" value={form.sinewy_white_rate}
                    onChange={e => setForm({...form, sinewy_white_rate: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sinewy Color Rate</label>
                  <input type="number" value={form.sinewy_color_rate}
                    onChange={e => setForm({...form, sinewy_color_rate: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assre Plasto White Rate</label>
                  <input type="number" value={form.assre_white_rate}
                    onChange={e => setForm({...form, assre_white_rate: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assre Plasto Color Rate</label>
                  <input type="number" value={form.assre_color_rate}
                    onChange={e => setForm({...form, assre_color_rate: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Profile Length (m) *</label>
                  <input type="number" value={form.profile_length}
                    onChange={e => setForm({...form, profile_length: e.target.value})}
                    placeholder="5.80"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bundle Qty *</label>
                  <input type="number" value={form.bundle_qty}
                    onChange={e => setForm({...form, bundle_qty: e.target.value})}
                    placeholder="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Discount %</label>
                  <input type="number" value={form.discount_pct}
                    onChange={e => setForm({...form, discount_pct: e.target.value})}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Weight per Meter (kg/m)
                    <span className="text-amber-600 ml-1">— Internal</span>
                  </label>
                  <input type="number" value={form.weight_per_meter}
                    onChange={e => setForm({...form, weight_per_meter: e.target.value})}
                    placeholder="0.000"
                    step="0.001"
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">MRP (Rs.)</label>
                  <input type="number" value={form.mrp}
                    onChange={e => setForm({...form, mrp: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors">
                {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}