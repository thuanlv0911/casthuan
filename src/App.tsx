import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Wallets } from './pages/Wallets';
import { Analytics } from './pages/Analytics';
import { TransactionForm } from './components/TransactionForm';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Transaction } from './services/api';

function AppContent() {
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { activeTab, error, isLoading, refreshData } = useApp();

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddTxOpen(true);
  };

  const handleCloseForm = () => {
    setIsAddTxOpen(false);
    setEditingTransaction(null);
  };

  return (
    <>
      {/* Top Header */}
      <header 
        className="glass-panel" 
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--card-border)',
          zIndex: 80,
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '16px'
          }}>
            C
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>casthuan</span>
        </div>

        <button 
          onClick={refreshData}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className={`refresh-btn ${isLoading ? 'spinning' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div style={{
          margin: '12px 20px 0 20px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          color: 'var(--expense-color)',
          padding: '12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            onOpenAddTransaction={() => setIsAddTxOpen(true)} 
            onOpenEdit={handleOpenEdit} 
          />
        )}
        {activeTab === 'transactions' && (
          <Transactions 
            onOpenEdit={handleOpenEdit} 
          />
        )}
        {activeTab === 'wallets' && <Wallets />}
        {activeTab === 'analytics' && <Analytics />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav onOpenAddTransaction={() => setIsAddTxOpen(true)} />

      {/* Add Transaction Modal */}
      <TransactionForm isOpen={isAddTxOpen} onClose={handleCloseForm} editingTransaction={editingTransaction} />

      <style>{`
        .refresh-btn:active {
          background: rgba(255, 255, 255, 0.05);
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
