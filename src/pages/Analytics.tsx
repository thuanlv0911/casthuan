import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

export const Analytics: React.FC = () => {
  const { transactions, wallets } = useApp();
  
  // States for selected month, year and wallet filter
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedWalletId, setSelectedWalletId] = useState<string>('All');

  // Generate lists of months and years available in transactions to select
  const availableMonthsYears = useMemo(() => {
    const list = new Set<string>();
    
    // Add current month in case transactions list is empty
    const now = new Date();
    list.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    
    transactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts.length >= 2) {
        list.add(`${parts[0]}-${parts[1]}`);
      }
    });

    return Array.from(list)
      .map(str => {
        const [y, m] = str.split('-');
        return { year: parseInt(y), month: parseInt(m) };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [transactions]);

  const currentMonthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Filter transactions for selected month and selected wallet
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchMonth = t.date.startsWith(currentMonthPrefix);
      if (!matchMonth) return false;
      
      if (selectedWalletId === 'All') return true;
      
      // If a specific wallet is selected:
      // - Standard expense/income: walletId must match selectedWalletId
      // - Transfer: either walletId (source) or destinationWalletId (dest) must match selectedWalletId
      return t.walletId === selectedWalletId || t.destinationWalletId === selectedWalletId;
    });
  }, [transactions, currentMonthPrefix, selectedWalletId]);

  // Aggregate monthly values
  const monthlyStats = useMemo(() => {
    let income = 0;
    let expense = 0;

    monthTransactions.forEach(t => {
      if (selectedWalletId === 'All') {
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expense += t.amount;
        }
      } else {
        // Specific wallet: count incoming/outgoing transfers as income/expense
        if (t.type === 'income' && t.walletId === selectedWalletId) {
          income += t.amount;
        } else if (t.type === 'expense' && t.walletId === selectedWalletId) {
          expense += t.amount;
        } else if (t.type === 'transfer') {
          if (t.walletId === selectedWalletId) {
            // Outbound transfer
            expense += t.amount;
          } else if (t.destinationWalletId === selectedWalletId) {
            // Inbound transfer
            income += t.amount;
          }
        }
      }
    });

    const net = income - expense;
    const expenseRatio = income > 0 ? (expense / income) * 100 : 0;

    return { income, expense, net, expenseRatio };
  }, [monthTransactions, selectedWalletId]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    monthTransactions.forEach(t => {
      if (selectedWalletId === 'All') {
        if (t.type === 'expense') {
          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        }
      } else {
        if (t.type === 'expense' && t.walletId === selectedWalletId) {
          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        } else if (t.type === 'transfer' && t.walletId === selectedWalletId) {
          breakdown['Chuyển khoản đi'] = (breakdown['Chuyển khoản đi'] || 0) + t.amount;
        }
      }
    });

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, selectedWalletId]);

  // Income breakdown by category
  const incomeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    monthTransactions.forEach(t => {
      if (selectedWalletId === 'All') {
        if (t.type === 'income') {
          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        }
      } else {
        if (t.type === 'income' && t.walletId === selectedWalletId) {
          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        } else if (t.type === 'transfer' && t.destinationWalletId === selectedWalletId) {
          breakdown['Chuyển khoản đến'] = (breakdown['Chuyển khoản đến'] || 0) + t.amount;
        }
      }
    });

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
      
      {/* Header & Date Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Thống kê chi tiêu</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Báo cáo tổng kết tháng</span>
        </div>

        {/* Custom Month Picker dropdown */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} style={{ color: 'var(--primary)', position: 'absolute', left: '12px', zIndex: 1 }} />
          <select 
            value={`${selectedYear}-${selectedMonth}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-');
              setSelectedYear(parseInt(y));
              setSelectedMonth(parseInt(m));
            }}
            className="form-select"
            style={{
              padding: '8px 12px 8px 30px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '10px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)'
            }}
          >
            {availableMonthsYears.map(item => (
              <option key={`${item.year}-${item.month}`} value={`${item.year}-${item.month}`}>
                Tháng {item.month}/{item.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Wallet Pill Filters */}
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginTop: '-4px'
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedWalletId('All')}
          style={{
            background: selectedWalletId === 'All' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            border: selectedWalletId === 'All' ? '1px solid var(--primary)' : '1px solid var(--card-border)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            boxShadow: selectedWalletId === 'All' ? '0 4px 10px var(--primary-glow)' : 'none',
            flexShrink: 0
          }}
        >
          Tất cả ví
        </button>
        {wallets.map(w => (
          <button
            key={w.id}
            type="button"
            onClick={() => setSelectedWalletId(w.id)}
            style={{
              background: selectedWalletId === w.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              border: selectedWalletId === w.id ? '1px solid var(--primary)' : '1px solid var(--card-border)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: selectedWalletId === w.id ? '0 4px 10px var(--primary-glow)' : 'none',
              flexShrink: 0
            }}
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* Summary Box */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        
        {/* Progress Bar Income vs Expense ratio */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>TỶ LỆ CHI TIÊU / THU NHẬP</span>
            <span style={{ color: monthlyStats.expenseRatio > 100 ? 'var(--expense-color)' : 'var(--income-color)' }}>
              {monthlyStats.expenseRatio.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(monthlyStats.expenseRatio, 100)}%`,
              height: '100%',
              background: monthlyStats.expenseRatio > 80 ? 'var(--expense-color)' : 'var(--primary)',
              borderRadius: '4px'
            }}></div>
          </div>
        </div>

        {/* Inflow vs Outflow grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--income-bg)', color: 'var(--income-color)', display: 'flex' }}>
                <TrendingUp size={10} style={{ margin: 'auto' }} />
              </div>
              TỔNG THU
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--income-color)' }}>
              +{formatCurrency(monthlyStats.income)}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--expense-bg)', color: 'var(--expense-color)', display: 'flex' }}>
                <TrendingDown size={10} style={{ margin: 'auto' }} />
              </div>
              TỔNG CHI
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--expense-color)' }}>
              -{formatCurrency(monthlyStats.expense)}
            </span>
          </div>

        </div>

        {/* Saving Summary */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: '12px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Tích lũy tháng này:</span>
          <span style={{ color: monthlyStats.net >= 0 ? 'var(--income-color)' : 'var(--expense-color)' }}>
            {monthlyStats.net >= 0 ? '+' : ''}{formatCurrency(monthlyStats.net)}
          </span>
        </div>

      </div>

      {/* Expenses Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Danh mục Chi tiêu</h3>
        
        {expenseBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            Không có chi tiêu nào trong tháng này.
          </div>
        ) : (
          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '16px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {expenseBreakdown.map(item => {
              const ratio = monthlyStats.expense > 0 ? (item.value / monthlyStats.expense) * 100 : 0;
              return (
                <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.value)} <strong style={{ color: 'var(--primary)', marginLeft: '6px' }}>{ratio.toFixed(0)}%</strong></span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${ratio}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--expense-color) 0%, #f43f5edd 100%)',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Income Breakdown */}
      {incomeBreakdown.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Danh mục Thu nhập</h3>
          
          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '16px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incomeBreakdown.map(item => {
              const ratio = monthlyStats.income > 0 ? (item.value / monthlyStats.income) * 100 : 0;
              return (
                <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.value)} <strong style={{ color: 'var(--income-color)', marginLeft: '6px' }}>{ratio.toFixed(0)}%</strong></span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${ratio}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--income-color) 0%, #34d399 100%)',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
