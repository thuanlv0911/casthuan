import React from 'react';
import { Home, ArrowLeftRight, Plus, Wallet, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BottomNavProps {
  onOpenAddTransaction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAddTransaction }) => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: 'calc(64px + var(--safe-bottom))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'var(--safe-bottom)',
      borderTop: '1px solid var(--card-border)',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      zIndex: 90,
      paddingLeft: '12px',
      paddingRight: '12px',
    }}>
      {/* Dashboard */}
      <button 
        onClick={() => setActiveTab('dashboard')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
          transition: 'color 0.2s',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
        <span>Tổng quan</span>
      </button>

      {/* Transactions */}
      <button 
        onClick={() => setActiveTab('transactions')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'transactions' ? 'var(--primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
          transition: 'color 0.2s',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <ArrowLeftRight size={20} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
        <span>Giao dịch</span>
      </button>

      {/* Floating Plus Button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <button 
          onClick={onOpenAddTransaction}
          style={{
            position: 'absolute',
            top: '-32px',
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 0 4px var(--bg-color)',
            transition: 'transform 0.2s active',
          }}
          className="fab-plus"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Wallets */}
      <button 
        onClick={() => setActiveTab('wallets')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'wallets' ? 'var(--primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
          transition: 'color 0.2s',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <Wallet size={20} strokeWidth={activeTab === 'wallets' ? 2.5 : 2} />
        <span>Ví của tôi</span>
      </button>

      {/* Analytics (Simple Tab or Page for monthly aggregates) */}
      <button 
        onClick={() => setActiveTab('analytics')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
          transition: 'color 0.2s',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <BarChart3 size={20} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
        <span>Thống kê</span>
      </button>

      <style>{`
        .fab-plus:active {
          transform: translateY(2px) scale(0.92);
        }
      `}</style>
    </nav>
  );
};
