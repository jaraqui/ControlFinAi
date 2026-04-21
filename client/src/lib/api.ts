const API_URL = '/api'

export interface User {
  id: string
  email: string
  name?: string
  picture?: string
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description?: string
  date: string
  userId: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  userId: string
}

export interface Summary {
  total: number
  income: number
  expenses: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyBalance: number
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  auth: {
    me: () => fetchAPI<User>('/auth/me'),
    logout: () => fetchAPI<{ message: string }>('/auth/logout', { method: 'POST' }),
    getGoogleUrl: () => `${API_URL}/auth/google`,
  },

  transactions: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchAPI<Transaction[]>(`/transactions${query}`)
    },
    create: (data: Partial<Transaction>) =>
      fetchAPI<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Transaction>) =>
      fetchAPI<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
    summary: () => fetchAPI<Summary>('/transactions/summary'),
  },

  categories: {
    list: (type?: string) => {
      const query = type ? `?type=${type}` : ''
      return fetchAPI<Category[]>(`/categories${query}`)
    },
    create: (data: Partial<Category>) =>
      fetchAPI<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Category>) =>
      fetchAPI<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
  },
}