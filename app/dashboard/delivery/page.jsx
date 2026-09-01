'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DeliveryAlertPage() {
  const [data, setData] = useState({ overdue: [], today: [], upcoming: [], scheduled: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDeliveries(); }, []);

  async function fetchDeliveries() {
    setLoading(true);
    try {
      const res = await api.get('/pi?status=delivery_scheduled');
      const pis = res.data.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdue   = [];
      const todayList = [];
      const upcoming  = [];

      pis.forEach(pi => {
        if (!pi.expected_dispatch_date) return;
        const d = new Date(pi.expected_dispatch_date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));
        if (diff < 0)      overdue.push({...pi, diff});
        else if (diff === 0) todayList.push({...pi, diff});
        else if (diff <= 7)  upcoming.push({...pi, diff});
      });

      // Dispatched recent
      const dispRes = await api.get('/pi?status=dispatched');
      const dispatched = (dispRes.data.data || []).slice(0, 10);

      setData({ overdue, today: todayList, upcoming, dispatched });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSchedule(pi) {
    const date = prompt(`PI ${pi.pi_number} ki delivery date daalo (YYYY-MM-DD):`);
    if (!date) return;
    try {
      await api.post(`/pi/${pi.id}/schedule-delivery`, { expected_dispatch_date: date });
      fetchDeliveries();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  }

  function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  function PICard({ pi, badge, badgeColor }) {
    const d = pi.expected_dispatch_date ? new Date(pi.expected_dispatch_date).toLocaleDateString('en-IN') : '-';
    return (
      <div className={`bg-white rounded-xl border-l-4 ${badgeColor} p-4 shadow-sm`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-blue-700">{pi.pi_number}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{pi.diff !== undefined ? (pi.diff < 0 ? `${Math.abs(pi.diff)} din overdue` : pi.diff === 0 ? 'Aaj' : `${pi.diff} din baad`) : ''}</span>
            </div>
            <p className="font-medium text-gray-900 text-sm">{pi.customer?.company_name}</p>
            <p className="text-xs text-gray-500">{pi.customer?.customer_name}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>📅 Expected: {d}</span>
              <span className="capitalize">📋 {pi.brand}</span>
              {pi.salesperson_name && <span>👤 {pi.salesperson_name}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">Rs.{fmt(pi.grand_total)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Grand Total</p>
          </div>
        </div>
      </div>
    );
  }

  const totalAlert = data.overdue.length + data.today.length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          📅 Delivery Schedule
          {totalAlert > 0 && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">{totalAlert} Alert</span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Delivery dates aur dispatch tracking</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">

          {/* OVERDUE */}
          {data.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h3 className="font-semibold text-red-700">🚨 Overdue — Delivery Miss Ho Gayi ({data.overdue.length})</h3>
              </div>
              <div className="space-y-3">
                {data.overdue.map(pi => (
                  <PICard key={pi.id} pi={pi} badge="bg-red-100 text-red-700" badgeColor="border-red-500" />
                ))}
              </div>
            </div>
          )}

          {/* TODAY */}
          {data.today.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <h3 className="font-semibold text-orange-700">⚡ Aaj Dispatch Karo ({data.today.length})</h3>
              </div>
              <div className="space-y-3">
                {data.today.map(pi => (
                  <PICard key={pi.id} pi={pi} badge="bg-orange-100 text-orange-700" badgeColor="border-orange-500" />
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING */}
          {data.upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h3 className="font-semibold text-yellow-700">📦 Upcoming — 7 Din Mein ({data.upcoming.length})</h3>
              </div>
              <div className="space-y-3">
                {data.upcoming.map(pi => (
                  <PICard key={pi.id} pi={pi} badge="bg-yellow-100 text-yellow-700" badgeColor="border-yellow-400" />
                ))}
              </div>
            </div>
          )}

          {/* NO ALERTS */}
          {data.overdue.length === 0 && data.today.length === 0 && data.upcoming.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-5xl mb-4">✅</p>
              <p className="text-lg font-medium text-green-700">Sab clear hai — koi pending delivery nahi</p>
            </div>
          )}

          {/* RECENTLY DISPATCHED */}
          {data.dispatched.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-semibold text-green-700">✅ Recently Dispatched ({data.dispatched.length})</h3>
              </div>
              <div className="space-y-3">
                {data.dispatched.map(pi => (
                  <div key={pi.id} className="bg-white rounded-xl border-l-4 border-green-500 p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-blue-700">{pi.pi_number}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Dispatched ✅</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{pi.customer?.company_name}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {pi.transport_company && <span>🚛 {pi.transport_company}</span>}
                          {pi.vehicle_number && <span>🚗 {pi.vehicle_number}</span>}
                          {pi.dispatched_at && <span>📅 {new Date(pi.dispatched_at).toLocaleDateString('en-IN')}</span>}
                          {pi.expected_dispatch_date && <span>🎯 Expected: {new Date(pi.expected_dispatch_date).toLocaleDateString('en-IN')}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">Rs.{fmt(pi.grand_total)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
