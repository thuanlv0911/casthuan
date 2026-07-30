export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  order?: number;
}

export interface Asset {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  valuePerUnit: number;
  purchasePricePerUnit: number;
  date: string;
  description: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  walletId: string;
  destinationWalletId?: string; // only for transfers
  date: string;
  description: string;
}

export interface Debt {
  id: string;
  borrower: string;
  amount: number;
  walletId: string;
  date: string;
  description: string;
  status: 'pending' | 'paid';
}

const API_BASE = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL as string) 
  : import.meta.env.DEV
    ? `http://${window.location.hostname}:3001`
    : '';

export const api = {
  // Wallets
  async getWallets(): Promise<Wallet[]> {
    const res = await fetch(`${API_BASE}/wallets`);
    if (!res.ok) throw new Error('Failed to fetch wallets');
    return res.json();
  },

  async updateWallet(id: string, data: Partial<Wallet>): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/wallets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update wallet');
    return res.json();
  },

  async createWallet(data: Omit<Wallet, 'id'>): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create wallet');
    return res.json();
  },

  async deleteWallet(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/wallets/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete wallet');
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transactions?_sort=date&_order=desc`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    // Sort transactions by date desc and id desc (as json-server 1.0 does sorting differently)
    return data.sort((a: Transaction, b: Transaction) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });
  },

  async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  async updateTransaction(id: string, data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  // Debts
  async getDebts(): Promise<Debt[]> {
    const res = await fetch(`${API_BASE}/debts`);
    if (!res.ok) throw new Error('Failed to fetch debts');
    return res.json();
  },

  async createDebt(data: Omit<Debt, 'id'>): Promise<Debt> {
    const res = await fetch(`${API_BASE}/debts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create debt');
    return res.json();
  },

  async updateDebt(id: string, data: Partial<Debt>): Promise<Debt> {
    const res = await fetch(`${API_BASE}/debts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update debt');
    return res.json();
  },

  async deleteDebt(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/debts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete debt');
  },

  // Assets
  async getAssets(): Promise<Asset[]> {
    const res = await fetch(`${API_BASE}/assets`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  async createAsset(data: Omit<Asset, 'id'>): Promise<Asset> {
    const res = await fetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create asset');
    return res.json();
  },

  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update asset');
    return res.json();
  },

  async deleteAsset(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete asset');
  },

  async updateGoldPrices(): Promise<{ success: boolean; assets: Asset[]; updatedCount: number; details: string[] }> {
    const res = await fetch(`${API_BASE}/api/update-gold-prices`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to auto-update gold prices from website');
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(data: Omit<Category, 'id'>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },
};
