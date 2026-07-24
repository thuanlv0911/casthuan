import React, { useState, useMemo } from 'react';
import { Trash2, Filter, X, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import type { Transaction } from '../services/api';

interface TransactionsProps {
  onOpenEdit: (tx: Transaction) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ onOpenEdit }) => {
  const { transactions, wallets, deleteTransaction } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterWallet, setFilterWallet] = useState<string>('All');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Extract unique categories from transactions for the filter dropdown
  const categories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [transactions]);

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchWallet = filterWallet === 'All' || t.walletId === filterWallet || t.destinationWalletId === filterWallet;
      return matchCategory && matchWallet;
    });
  }, [transactions, filterCategory, filterWallet]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    });

    // Sort dates desc
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredTransactions]);

  const handleDelete = async (id: string, desc: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giao dịch "${desc}" không? Số dư ví sẽ được tự động hoàn lại.`)) {
      try {
        await deleteTransaction(id);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi xóa giao dịch');
      }
    }
  };

  const activeFiltersCount = (filterCategory !== 'All' ? 1 : 0) + (filterWallet !== 'All' ? 1 : 0);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Lịch sử Giao dịch</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hiển thị {filteredTransactions.length} bản ghi</span>
        </div>

        <button 
          onClick={() => setShowFilterModal(true)}
          style={{
            background: activeFiltersCount > 0 ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFiltersCount > 0 ? '1px solid var(--primary)' : '1px solid var(--card-border)',
            color: activeFiltersCount > 0 ? 'var(--primary)' : 'var(--text-primary)',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Filter size={15} /> Bộ lọc
          {activeFiltersCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Chips Preview */}
      {activeFiltersCount > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filterCategory !== 'All' && (
            <span style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--card-border)'
            }}>
              Mục: {filterCategory}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterCategory('All')} />
            </span>
          )}
          {filterWallet !== 'All' && (
            <span style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--card-border)'
            }}>
              Ví: {wallets.find(w => w.id === filterWallet)?.name || filterWallet}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterWallet('All')} />
            </span>
          )}
        </div>
      )}

      {/* Transactions List Grouped by Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {groupedTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            Không tìm thấy giao dịch nào phù hợp với bộ lọc.
          </div>
        ) : (
          groupedTransactions.map(([dateStr, txs]) => {
            // Compute daily sums
            let dayIncome = 0;
            let dayExpense = 0;
            txs.forEach(t => {
              if (t.type === 'income') dayIncome += t.amount;
              else if (t.type === 'expense') dayExpense += t.amount;
            });

            return (
              <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Date header & daily summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(dateStr)}</span>
                  <div style={{ fontSize: '11px', fontWeight: 600, display: 'flex', gap: '8px' }}>
                    {dayIncome > 0 && <span style={{ color: 'var(--income-color)' }}>+{formatCurrency(dayIncome)}</span>}
                    {dayExpense > 0 && <span style={{ color: 'var(--expense-color)' }}>-{formatCurrency(dayExpense)}</span>}
                  </div>
                </div>

                {/* Date transactions list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {txs.map(t => {
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
                          padding: '12px 14px',
                          background: 'var(--card-bg)',
                          borderRadius: '16px',
                          border: '1px solid var(--card-border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          {/* Circle Icon Badge */}
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isExpense ? 'var(--expense-bg)' : isIncome ? 'var(--income-bg)' : 'var(--transfer-bg)',
                            color: isExpense ? 'var(--expense-color)' : isIncome ? 'var(--income-color)' : 'var(--transfer-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                            flexShrink: 0
                          }}>
                            {t.category.slice(0, 2)}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.description}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isIncome ? 'Ví' : isExpense ? 'Ví' : 'Từ'} <strong style={{ color: srcWallet?.color }}>{srcWallet?.name}</strong>
                              {t.type === 'transfer' && destWallet && <> → <strong style={{ color: destWallet.color }}>{destWallet.name}</strong></>}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            fontSize: '14px',
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
                            <Pencil size={15} />
                          </button>

                          <button 
                            onClick={() => handleDelete(t.id, t.description)}
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
                            className="btn-delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filter Modal Overlay */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Bộ lọc giao dịch</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Category Filter */}
              <div className="form-group">
                <label>HẠNG MỤC</label>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="All">Tất cả hạng mục</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Wallet Filter */}
              <div className="form-group">
                <label>TÀI KHOẢN / VÍ TIỀN</label>
                <select 
                  value={filterWallet} 
                  onChange={e => setFilterWallet(e.target.value)}
                  className="form-select"
                >
                  <option value="All">Tất cả ví tiền</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginTop: '12px' }}>
                <button 
                  onClick={() => {
                    setFilterCategory('All');
                    setFilterWallet('All');
                    setShowFilterModal(false);
                  }}
                  className="button-secondary"
                  style={{ padding: '12px' }}
                >
                  Thiết lập lại
                </button>
                <button 
                  onClick={() => setShowFilterModal(false)}
                  className="button-primary"
                  style={{ padding: '12px' }}
                >
                  Áp dụng bộ lọc
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-delete:active {
          color: var(--expense-color) !important;
          background: rgba(244, 63, 94, 0.1);
        }
      `}</style>

    </div>
  );
};
