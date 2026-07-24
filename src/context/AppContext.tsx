import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { Wallet, Transaction } from '../services/api';

interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshData: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wData, tData] = await Promise.all([
        api.getWallets(),
        api.getTransactions()
      ]);
      setWallets(wData);
      setTransactions(tData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi đồng bộ dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addTransaction = async (txData: Omit<Transaction, 'id'>) => {
    setIsLoading(true);
    try {
      // 1. Create transaction on server
      const newTx = await api.createTransaction(txData);

      // 2. Calculate updated wallet balances
      const updatedWallets = [...wallets];

      if (txData.type === 'expense') {
        const walletIndex = updatedWallets.findIndex(w => w.id === txData.walletId);
        if (walletIndex !== -1) {
          const w = updatedWallets[walletIndex];
          const newBalance = w.balance - txData.amount;
          await api.updateWallet(w.id, { balance: newBalance });
          updatedWallets[walletIndex] = { ...w, balance: newBalance };
        }
      } else if (txData.type === 'income') {
        const walletIndex = updatedWallets.findIndex(w => w.id === txData.walletId);
        if (walletIndex !== -1) {
          const w = updatedWallets[walletIndex];
          const newBalance = w.balance + txData.amount;
          await api.updateWallet(w.id, { balance: newBalance });
          updatedWallets[walletIndex] = { ...w, balance: newBalance };
        }
      } else if (txData.type === 'transfer' && txData.destinationWalletId) {
        // Source wallet (From)
        const srcIndex = updatedWallets.findIndex(w => w.id === txData.walletId);
        if (srcIndex !== -1) {
          const srcW = updatedWallets[srcIndex];
          const newSrcBalance = srcW.balance - txData.amount;
          await api.updateWallet(srcW.id, { balance: newSrcBalance });
          updatedWallets[srcIndex] = { ...srcW, balance: newSrcBalance };
        }
        // Destination wallet (To)
        const destIndex = updatedWallets.findIndex(w => w.id === txData.destinationWalletId);
        if (destIndex !== -1) {
          const destW = updatedWallets[destIndex];
          const newDestBalance = destW.balance + txData.amount;
          await api.updateWallet(destW.id, { balance: newDestBalance });
          updatedWallets[destIndex] = { ...destW, balance: newDestBalance };
        }
      }

      setWallets(updatedWallets);
      setTransactions(prev => [newTx, ...prev].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
      }));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Không thể thêm giao dịch.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setIsLoading(true);
    try {
      const txToDelete = transactions.find(t => t.id === id);
      if (!txToDelete) return;

      // 1. Delete on server
      await api.deleteTransaction(id);

      // 2. Revert the wallet balance
      const updatedWallets = [...wallets];

      if (txToDelete.type === 'expense') {
        const walletIndex = updatedWallets.findIndex(w => w.id === txToDelete.walletId);
        if (walletIndex !== -1) {
          const w = updatedWallets[walletIndex];
          const revertedBalance = w.balance + txToDelete.amount;
          await api.updateWallet(w.id, { balance: revertedBalance });
          updatedWallets[walletIndex] = { ...w, balance: revertedBalance };
        }
      } else if (txToDelete.type === 'income') {
        const walletIndex = updatedWallets.findIndex(w => w.id === txToDelete.walletId);
        if (walletIndex !== -1) {
          const w = updatedWallets[walletIndex];
          const revertedBalance = w.balance - txToDelete.amount;
          await api.updateWallet(w.id, { balance: revertedBalance });
          updatedWallets[walletIndex] = { ...w, balance: revertedBalance };
        }
      } else if (txToDelete.type === 'transfer' && txToDelete.destinationWalletId) {
        // Source wallet (Add back the transferred amount)
        const srcIndex = updatedWallets.findIndex(w => w.id === txToDelete.walletId);
        if (srcIndex !== -1) {
          const srcW = updatedWallets[srcIndex];
          const revertedSrcBalance = srcW.balance + txToDelete.amount;
          await api.updateWallet(srcW.id, { balance: revertedSrcBalance });
          updatedWallets[srcIndex] = { ...srcW, balance: revertedSrcBalance };
        }
        // Destination wallet (Subtract the transferred amount)
        const destIndex = updatedWallets.findIndex(w => w.id === txToDelete.destinationWalletId);
        if (destIndex !== -1) {
          const destW = updatedWallets[destIndex];
          const revertedDestBalance = destW.balance - txToDelete.amount;
          await api.updateWallet(destW.id, { balance: revertedDestBalance });
          updatedWallets[destIndex] = { ...destW, balance: revertedDestBalance };
        }
      }

      setWallets(updatedWallets);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Không thể xóa giao dịch.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (id: string, txData: Omit<Transaction, 'id'>) => {
    setIsLoading(true);
    try {
      const oldTx = transactions.find(t => t.id === id);
      if (!oldTx) return;

      // 1. Revert old transaction balances
      const tempWallets = wallets.map(w => ({ ...w }));
      
      const revertBalance = (tx: Transaction) => {
        if (tx.type === 'expense') {
          const idx = tempWallets.findIndex(w => w.id === tx.walletId);
          if (idx !== -1) tempWallets[idx].balance += tx.amount;
        } else if (tx.type === 'income') {
          const idx = tempWallets.findIndex(w => w.id === tx.walletId);
          if (idx !== -1) tempWallets[idx].balance -= tx.amount;
        } else if (tx.type === 'transfer' && tx.destinationWalletId) {
          const srcIdx = tempWallets.findIndex(w => w.id === tx.walletId);
          if (srcIdx !== -1) tempWallets[srcIdx].balance += tx.amount;
          const destIdx = tempWallets.findIndex(w => w.id === tx.destinationWalletId);
          if (destIdx !== -1) tempWallets[destIdx].balance -= tx.amount;
        }
      };

      const applyBalance = (tx: Omit<Transaction, 'id'>) => {
        if (tx.type === 'expense') {
          const idx = tempWallets.findIndex(w => w.id === tx.walletId);
          if (idx !== -1) tempWallets[idx].balance -= tx.amount;
        } else if (tx.type === 'income') {
          const idx = tempWallets.findIndex(w => w.id === tx.walletId);
          if (idx !== -1) tempWallets[idx].balance += tx.amount;
        } else if (tx.type === 'transfer' && tx.destinationWalletId) {
          const srcIdx = tempWallets.findIndex(w => w.id === tx.walletId);
          if (srcIdx !== -1) tempWallets[srcIdx].balance -= tx.amount;
          const destIdx = tempWallets.findIndex(w => w.id === tx.destinationWalletId);
          if (destIdx !== -1) tempWallets[destIdx].balance += tx.amount;
        }
      };

      revertBalance(oldTx);

      // 2. Apply new transaction balances
      applyBalance(txData);

      // 3. Save updates to server
      const newTx = await api.updateTransaction(id, txData);

      const affectedWalletIds = new Set<string>();
      affectedWalletIds.add(oldTx.walletId);
      affectedWalletIds.add(txData.walletId);
      if (oldTx.destinationWalletId) affectedWalletIds.add(oldTx.destinationWalletId);
      if (txData.destinationWalletId) affectedWalletIds.add(txData.destinationWalletId);

      for (const wId of affectedWalletIds) {
        const w = tempWallets.find(wallet => wallet.id === wId);
        if (w) {
          await api.updateWallet(w.id, { balance: w.balance });
        }
      }

      // 4. Update React states
      setWallets(tempWallets);
      setTransactions(prev => prev.map(t => t.id === id ? newTx : t).sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
      }));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Không thể cập nhật giao dịch.');
    } finally {
      setIsLoading(false);
    }
  };

  const addWallet = async (walletData: Omit<Wallet, 'id'>) => {
    setIsLoading(true);
    try {
      const newWallet = await api.createWallet(walletData);
      setWallets(prev => [...prev, newWallet]);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Không thể thêm ví.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWallet = async (id: string) => {
    setIsLoading(true);
    try {
      await api.deleteWallet(id);
      setWallets(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Không thể xóa ví.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        wallets,
        transactions,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        refreshData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        deleteWallet,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
