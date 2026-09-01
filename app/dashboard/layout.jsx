'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, clearAuth, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth';
import api from '@/lib/api';

const NAV = [
  { href: '/dashboard',           label: 'Dashboard',         icon: '⊞',  roles: ['admin','pi_creator','md','ceo'] },
  { href: '/dashboard/pi',        label: 'Proforma Invoices', icon: '📄', roles: ['admin','pi_creator','md','ceo'] },
  { href: '/dashboard/products',  label: 'Products',          icon: '📦', roles: ['admin','pi_creator'] },
  { href: '/dashboard/hardware',  label: 'Hardware',          icon: '🔧', roles: ['admin','pi_creator'] },
  { href: '/dashboard/delivery',  label: 'Delivery Schedule',  icon: '📅', roles: ['admin','dispatch_manager','pi_creator','md','ceo'] },
  { href: '/dashboard/customers', label: 'Customers',         icon: '👥', roles: ['admin','pi_creator'] },
  { href: '/dashboard/pending',    label: 'Pending Approvals', icon: '⏳', roles: ['md','ceo','admin'] },
  { href: '/dashboard/dispatch',   label: 'Dispatch Queue',    icon: '🚚', roles: ['dispatch_manager','admin'] },
  { href: '/dashboard/reports',   label: 'Reports',           icon: '📊', roles: ['admin','ceo'] },
  { href: '/dashboard/payments',  label: 'Payments',          icon: '💰', roles: ['admin','ceo','md'] },
  { href: '/dashboard/users',     label: 'Users',             icon: '🔐', roles: ['admin'] },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      setUnreadCount(res.data.unread_count);
      setNotifications(res.data.data);
    } catch (e) {}
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    } catch (e) {}
  }

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  const visibleNav = NAV.filter(n => n.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">CP</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Cynosure PI</p>
            <p className="text-xs text-gray-400">Invoice System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
              {user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-gray-500 hover:text-red-600 py-1 transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {sideOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button
            onClick={() => setSideOpen(!sideOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ☰
          </button>
          <h1 className="text-sm font-medium text-gray-900 flex-1">
            {NAV.find(n => n.href === pathname)?.label || 'Dashboard'}
          </h1>
          <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}