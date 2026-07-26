import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight, Pencil, Folder } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import type { Transaction } from '../services/api';
import { CategoryIcon } from '../components/CategoryIcon';

interface DashboardProps {
  onOpenManageCategories: () => void;
  onOpenEdit: (tx: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenManageCategories, onOpenEdit }) => {
  const { wallets, transactions, isLoading, setActiveTab } = useApp();

  // Get current month details dynamically
  const currentMonthYear = useMemo(() => {
    const today = new Date();
    return {
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      label: `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`
    };
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    // Only count TPBank and Tiền lẻ (Nhỏ) in Dashboard Total Balance
    let totalBalance = wallets
      .filter(w => 
        w.name.toLowerCase().includes('tpbank') || 
        w.name.toLowerCase().includes('lẻ') || 
        w.name.toLowerCase().includes('nhỏ')
      )
      .reduce((sum, w) => sum + w.balance, 0);
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const currentMonthPrefix = `${currentMonthYear.year}-${String(currentMonthYear.month).padStart(2, '0')}`;

    transactions.forEach(t => {
      if (t.date.startsWith(currentMonthPrefix)) {
        if (t.type === 'income') {
          monthlyIncome += t.amount;
        } else if (t.type === 'expense') {
          monthlyExpense += t.amount;
        }
      }
    });

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings: monthlyIncome - monthlyExpense
    };
  }, [wallets, transactions, currentMonthYear]);

  // Group current month expenses by category for a breakdown list
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    const currentMonthPrefix = `${currentMonthYear.year}-${String(currentMonthYear.month).padStart(2, '0')}`;

    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
      .forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });

    // Sort categories by amount desc
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currentMonthYear]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  if (isLoading && wallets.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <p>Đang tải dữ liệu tài chính...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Xin chào!</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Ví của Thuận</h2>
        </div>
        <button
          onClick={onOpenManageCategories}
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: 'none',
            color: 'var(--primary)',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Folder size={15} /> Hạng mục
        </button>
      </div>

      {/* Net Worth Dashboard Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          background: 'var(--primary)',
          opacity: 0.15,
          filter: 'blur(40px)',
          borderRadius: '50%'
        }}></div>

        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, letterSpacing: '0.05em' }}>TỔNG TÀI SẢN TÍCH LŨY</span>
        <h1 style={{ fontSize: '32px', margin: '8px 0', color: '#fff', fontWeight: 800 }}>
          {formatCurrency(stats.totalBalance)}
        </h1>

        {/* Income / Expense Mini Summaries */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--income-color)', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                <ArrowUpRight size={10} style={{ margin: 'auto' }} />
              </div>
              THU NHẬP
            </div>
            <span style={{ color: 'var(--income-color)', fontSize: '15px', fontWeight: 700 }}>
              +{formatCurrency(stats.monthlyIncome)}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--expense-color)', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                <ArrowDownRight size={10} style={{ margin: 'auto' }} />
              </div>
              CHI TIÊU
            </div>
            <span style={{ color: 'var(--expense-color)', fontSize: '15px', fontWeight: 700 }}>
              -{formatCurrency(stats.monthlyExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Wallets Quick Carousel */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Ví và Ngân hàng ({wallets.length})</h3>
          <button
            onClick={() => setActiveTab('wallets')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            Tất cả <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
          {wallets.map(w => (
            <div
              key={w.id}
              style={{
                flex: '0 0 160px',
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--card-border)',
                borderLeft: `4px solid ${w.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <CreditCard size={14} style={{ color: w.color }} />
                <span style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(w.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Category Breakdown Progress Bars */}
      {categoryBreakdown.length > 0 && (
        <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '16px', border: '1px solid var(--card-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Thống kê chi tiêu {currentMonthYear.label}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryBreakdown.slice(0, 4).map(item => {
              const percentage = stats.monthlyExpense > 0 ? (item.value / stats.monthlyExpense) * 100 : 0;
              return (
                <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatCurrency(item.value)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  {/* Custom progress bar */}
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary) 0%, #818cf8 100%)',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Giao dịch gần đây</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            Lịch sử <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
              Chưa có ghi chép giao dịch nào.
            </div>
          ) : (
            recentTransactions.map(t => {
              const isExpense = t.type === 'expense';
              const isIncome = t.type === 'income';
              const srcWallet = wallets.find(w => w.id === t.walletId);
              const destWallet = t.destinationWalletId ? wallets.find(w => w.id === t.destinationWalletId) : null;

              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Circle Icon Badge */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: isExpense ? 'var(--expense-bg)' : isIncome ? 'var(--income-bg)' : 'var(--transfer-bg)',
                      color: isExpense ? 'var(--expense-color)' : isIncome ? 'var(--income-color)' : 'var(--transfer-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CategoryIcon category={t.category} type={t.type} size={20} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.description}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {formatDate(t.date)} • {isIncome ? 'Thu vào' : isExpense ? 'Chi từ' : 'Chuyển từ'} <strong style={{ color: srcWallet?.color }}>{srcWallet?.name}</strong>
                        {t.type === 'transfer' && destWallet && <> qua <strong style={{ color: destWallet.color }}>{destWallet.name}</strong></>}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isIncome ? 'var(--income-color)' : isExpense ? 'var(--expense-color)' : 'var(--transfer-color)'
                    }}>
                      {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(t.amount)}
                    </span>
                    <button
                      onClick={() => onOpenEdit(t)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '4px',
                        borderRadius: '6px',
                        transition: 'color 0.2s'
                      }}
                      className="btn-edit"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
