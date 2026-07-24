import React, { useState, useMemo } from 'react';
import { Trash2, Filter, X, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import type { Transaction } from '../services/api';
import { CategoryIcon } from '../components/CategoryIcon';

interface TransactionsProps {
  onOpenEdit: (tx: Transaction) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ onOpenEdit }) => {
  const { transactions, wallets, deleteTransaction } = useApp();
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterWallet, setFilterWallet] = useState<string>('All');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      // 1. Search Query Match
      const cleanQuery = searchQuery.trim().toLowerCase();
      const matchSearch = !cleanQuery || 
        t.description.toLowerCase().includes(cleanQuery) || 
        t.category.toLowerCase().includes(cleanQuery);

      // 2. Type Match
      const matchType = filterType === 'All' || t.type === filterType;

      // 3. Category Match
      const matchCategory = filterCategory === 'All' || t.category === filterCategory;

      // 4. Wallet Match
      const matchWallet = filterWallet === 'All' || t.walletId === filterWallet || t.destinationWalletId === filterWallet;

      // 5. Time Range Match
      let matchTime = true;
      if (filterTimeRange !== 'All') {
        const txDate = new Date(t.date);
        txDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterTimeRange === 'today') {
          matchTime = txDate.getTime() === today.getTime();
        } else if (filterTimeRange === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchTime = txDate.getTime() === yesterday.getTime();
        } else if (filterTimeRange === 'thisMonth') {
          matchTime = txDate.getFullYear() === today.getFullYear() && txDate.getMonth() === today.getMonth();
        } else if (filterTimeRange === 'lastMonth') {
          const lastMonth = new Date(today);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          matchTime = txDate.getFullYear() === lastMonth.getFullYear() && txDate.getMonth() === lastMonth.getMonth();
        } else if (filterTimeRange === 'custom') {
          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0, 0, 0, 0);
            if (txDate.getTime() < start.getTime()) matchTime = false;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            if (txDate.getTime() > end.getTime()) matchTime = false;
          }
        }
      }

      return matchSearch && matchType && matchCategory && matchWallet && matchTime;
    });
  }, [transactions, searchQuery, filterType, filterCategory, filterWallet, filterTimeRange, filterStartDate, filterEndDate]);

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

  const activeFiltersCount = 
    (filterType !== 'All' ? 1 : 0) + 
    (filterCategory !== 'All' ? 1 : 0) + 
    (filterWallet !== 'All' ? 1 : 0) + 
    (filterTimeRange !== 'All' ? 1 : 0);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Lịch sử Giao dịch</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hiển thị {filteredTransactions.length} bản ghi</span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              marginBottom: 0,
              paddingLeft: '12px',
              paddingRight: '30px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
              height: '42px',
              fontSize: '13px'
            }}
          />
          {searchQuery && (
            <X 
              size={15} 
              style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)' 
              }}
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>

        <button 
          onClick={() => setShowFilterModal(true)}
          style={{
            background: activeFiltersCount > 0 ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFiltersCount > 0 ? '1px solid var(--primary)' : '1px solid var(--card-border)',
            color: activeFiltersCount > 0 ? 'var(--primary)' : 'var(--text-primary)',
            padding: '0 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            position: 'relative',
            height: '42px'
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '-4px' }}>
          {filterType !== 'All' && (
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
              Loại: {filterType === 'income' ? 'Tiền vào' : filterType === 'expense' ? 'Tiền ra' : 'Chuyển khoản'}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterType('All')} />
            </span>
          )}
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
          {filterTimeRange !== 'All' && (
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
              Thời gian: {
                filterTimeRange === 'today' ? 'Hôm nay' : 
                filterTimeRange === 'yesterday' ? 'Hôm qua' : 
                filterTimeRange === 'thisMonth' ? 'Tháng này' : 
                filterTimeRange === 'lastMonth' ? 'Tháng trước' : 'Tùy chỉnh'
              }
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                setFilterTimeRange('All');
                setFilterStartDate('');
                setFilterEndDate('');
              }} />
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
                            flexShrink: 0
                          }}>
                            <CategoryIcon category={t.category} type={t.type} size={16} />
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
              
              {/* Type Filter */}
              <div className="form-group">
                <label>LOẠI GIAO DỊCH</label>
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value)}
                  className="form-select"
                >
                  <option value="All">Tất cả loại giao dịch</option>
                  <option value="expense">Tiền ra (Chi tiêu)</option>
                  <option value="income">Tiền vào (Thu nhập)</option>
                  <option value="transfer">Chuyển khoản nội bộ</option>
                </select>
              </div>

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

              {/* Time Range Filter */}
              <div className="form-group">
                <label>KHOẢNG THỜI GIAN</label>
                <select 
                  value={filterTimeRange} 
                  onChange={e => setFilterTimeRange(e.target.value)}
                  className="form-select"
                >
                  <option value="All">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="yesterday">Hôm qua</option>
                  <option value="thisMonth">Tháng này</option>
                  <option value="lastMonth">Tháng trước</option>
                  <option value="custom">Tùy chọn khoảng ngày</option>
                </select>
              </div>

              {/* Custom Date Pickers */}
              {filterTimeRange === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '-6px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '10px' }}>TỪ NGÀY</label>
                    <input 
                      type="date" 
                      value={filterStartDate} 
                      onChange={e => setFilterStartDate(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '12px', padding: '10px' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '10px' }}>ĐẾN NGÀY</label>
                    <input 
                      type="date" 
                      value={filterEndDate} 
                      onChange={e => setFilterEndDate(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '12px', padding: '10px' }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginTop: '12px' }}>
                <button 
                  onClick={() => {
                    setFilterType('All');
                    setFilterCategory('All');
                    setFilterWallet('All');
                    setFilterTimeRange('All');
                    setFilterStartDate('');
                    setFilterEndDate('');
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
