'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

const STAT_CARDS = [
  { key: 'total_pi',  label: 'Total PIs',       color: 'bg-blue-50 text-blue-700',   icon: '📄' },
  { key: 'pending',   label: 'Pending Approval', color: 'bg-amber-50 text-amber-700', icon: '⏳' },
  { key: 'approved',  label: 'Approved',         color: 'bg-green-50 text-green-700', icon: '✅' },
  { key: 'rejected',  label: 'Rejected',         color: 'bg-red-50 text-red-700',     icon: '❌' },
];

export default function DashboardPage() {
  const user = getUser();
  const [stats, setStats] = useState({ total_pi:0, pending:0, approved:0, rejected:0 });

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => { if (r.data.success) setStats(r.data.data); })
      .catch(() => {});
  }, []);

  const companyName = user?.company?.name || 'PI Management System';
  const firstName   = user?.name?.split(' ')[0] || 'User';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Namaste, {firstName} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {companyName}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.color} text-lg mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats[card.key]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-900 mb-2">Recent Proforma Invoices</p>
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm">Phase 2 mein PI list yahan aayegi</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-900 mb-2">Monthly Sales Value</p>
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">Phase 4 mein charts yahan aayenge</p>
          </div>
        </div>
      </div>
    </div>
  );
}