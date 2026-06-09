export const getToken = () => localStorage.getItem('auth_token');
export const setToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeToken = () => localStorage.removeItem('auth_token');

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      // Don't redirect immediately — let ProtectedRoute handle it on next render.
      // This prevents breaking background sync when token expires while offline.
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API Error ${response.status}`);
  }

  // Return empty object for 204 No Content
  if (response.status === 204) return {};
  
  return response.json();
};

export const fetchTransactions = () => request('/transactions');
export const createTransaction = (data: unknown) => request('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (data: unknown) => request('/transactions', { method: 'PUT', body: JSON.stringify(data) });
export const deleteTransaction = (id: string) => request(`/transactions?id=${id}`, { method: 'DELETE' });

export const fetchBudgets = () => request('/budgets');
export const createBudget = (data: unknown) => request('/budgets', { method: 'POST', body: JSON.stringify(data) });
export const updateBudget = (data: unknown) => request('/budgets', { method: 'PUT', body: JSON.stringify(data) });
export const deleteBudget = (id: string) => request(`/budgets?id=${id}`, { method: 'DELETE' });

export const fetchPortfolio = () => request('/portfolio');
export const createPortfolioItem = (data: unknown) => request('/portfolio', { method: 'POST', body: JSON.stringify(data) });
export const updatePortfolioItem = (data: unknown) => request('/portfolio', { method: 'PUT', body: JSON.stringify(data) });
export const deletePortfolioItem = (id: string) => request(`/portfolio?id=${id}`, { method: 'DELETE' });

export const fetchGoals = () => request('/goals');
export const createGoal = (data: unknown) => request('/goals', { method: 'POST', body: JSON.stringify(data) });
export const updateGoal = (data: unknown) => request('/goals', { method: 'PUT', body: JSON.stringify(data) });
export const deleteGoal = (id: string) => request(`/goals?id=${id}`, { method: 'DELETE' });

export const fetchSubscriptions = () => request('/subscriptions');
export const createSubscription = (data: unknown) => request('/subscriptions', { method: 'POST', body: JSON.stringify(data) });
export const updateSubscription = (data: unknown) => request('/subscriptions', { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubscription = (id: string) => request(`/subscriptions?id=${id}`, { method: 'DELETE' });

export const fetchDelayedGratifications = () => request('/delayed_gratifications');
export const createDelayedGratification = (data: unknown) => request('/delayed_gratifications', { method: 'POST', body: JSON.stringify(data) });
export const updateDelayedGratification = (data: unknown) => request('/delayed_gratifications', { method: 'PUT', body: JSON.stringify(data) });
export const deleteDelayedGratification = (id: string) => request(`/delayed_gratifications?id=${id}`, { method: 'DELETE' });

export const fetchSettings = () => request('/settings');
export const updateSettings = (data: unknown) => request('/settings', { method: 'PUT', body: JSON.stringify(data) });

export const updateUser = (data: unknown) => request('/user', { method: 'PUT', body: JSON.stringify(data) });
export const resetUserData = () => request('/user', { method: 'DELETE' });
