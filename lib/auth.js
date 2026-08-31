import Cookies from 'js-cookie';

export function getUser() {
  const raw = Cookies.get('cynosure_user');
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return Cookies.get('cynosure_token') || null;
}

export function setAuth(token, user) {
  Cookies.set('cynosure_token', token, { expires: 1 });
  Cookies.set('cynosure_user', JSON.stringify(user), { expires: 1 });
}

export function clearAuth() {
  Cookies.remove('cynosure_token');
  Cookies.remove('cynosure_user');
}

export function isAuthenticated() {
  return !!getToken();
}

export function getCompany() {
  const user = getUser();
  return user?.company || null;
}

export function getCompanyId() {
  const user = getUser();
  return user?.company_id || null;
}

export function isSuperAdmin() {
  const user = getUser();
  return user?.is_super_admin === true;
}

export function getPricingMode() {
  const user = getUser();
  return user?.company?.pricing_mode || 'per_meter';
}

export const ROLE_LABELS = {
  admin:      'Admin',
  pi_creator: 'PI Creator',
  md:         'MD',
  ceo:        'CEO',
};

export const ROLE_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
  pi_creator: 'bg-blue-100 text-blue-700',
  md:         'bg-amber-100 text-amber-700',
  ceo:        'bg-green-100 text-green-700',
};