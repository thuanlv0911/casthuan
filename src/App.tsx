import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Wallets } from './pages/Wallets';
import { Analytics } from './pages/Analytics';
import { TransactionForm } from './components/TransactionForm';
import { CategoryManager } from './components/CategoryManager';
import { AlertCircle, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import type { Transaction } from './services/api';

function AppContent() {
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { activeTab, error, isLoading, refreshData, toasts } = useApp();

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
            onOpenManageCategories={() => setIsCategoryManagerOpen(true)} 
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

      {/* Category Manager Modal */}
      <CategoryManager isOpen={isCategoryManagerOpen} onClose={() => setIsCategoryManagerOpen(false)} />

      {/* Toast Container */}
      <div 
        className="toast-container"
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '16px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
          maxWidth: '300px',
          width: 'calc(100% - 32px)',
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: toast.type === 'success' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : toast.type === 'error' 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: toast.type === 'success'
                ? '0 10px 20px rgba(16, 185, 129, 0.3)'
                : toast.type === 'error'
                ? '0 10px 20px rgba(239, 68, 68, 0.3)'
                : '0 10px 20px rgba(99, 102, 241, 0.3)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'toastSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} color="#ffffff" style={{ flexShrink: 0 }} />}
            {toast.type === 'error' && <AlertCircle size={16} color="#ffffff" style={{ flexShrink: 0 }} />}
            {toast.type === 'info' && <Info size={16} color="#ffffff" style={{ flexShrink: 0 }} />}
            <span style={{ flex: 1, color: '#ffffff', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>

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
        @keyframes toastSlideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (min-width: 480px) {
          .toast-container {
            right: calc(50% - 240px + 16px) !important;
          }
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
