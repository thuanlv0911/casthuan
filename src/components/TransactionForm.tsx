import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, TrendingDown, TrendingUp, Settings, Trash2, Pencil, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Transaction } from '../services/api';
import { parseQuickInput } from '../utils/parser';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const defaultCategories = {
  expense: ['Ăn uống', 'Mua sắm', 'Tiền nhà', 'Xăng xe', 'Sức khỏe', 'Giải trí', 'Học tập', 'Nợ', 'Khác'],
  income: ['Lương', 'Freelance', 'Được tặng', 'Đầu tư', 'Nợ', 'Khác'],
};

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, editingTransaction }) => {
  const { 
    wallets, addTransaction, updateTransaction,
    categories, addCategory, updateCategory, deleteCategory
  } = useApp();
  const [quickInput, setQuickInput] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Ăn uống');
  const [walletId, setWalletId] = useState<string>('');

  // Category CRUD Local States
  const [showManageCategories, setShowManageCategories] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [destinationWalletId, setDestinationWalletId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default wallet selection when wallets load
  useEffect(() => {
    if (wallets.length > 0 && !editingTransaction) {
      setWalletId(wallets[0].id);
      if (wallets.length > 1) {
        setDestinationWalletId(wallets[1].id);
      }
    }
  }, [wallets, editingTransaction]);

  // Load editing transaction data
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(new Intl.NumberFormat('vi-VN').format(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setWalletId(editingTransaction.walletId);
      if (editingTransaction.destinationWalletId) {
        setDestinationWalletId(editingTransaction.destinationWalletId);
      }
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
    } else {
      setType('expense');
      setAmount('');
      setQuickInput('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      if (wallets.length > 0) {
        setWalletId(wallets[0].id);
        if (wallets.length > 1) {
          setDestinationWalletId(wallets[1].id);
        }
      }
    }
  }, [editingTransaction, wallets, isOpen]);

  const handleQuickInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickInput(val);

    if (val.trim()) {
      const parsed = parseQuickInput(val, wallets);
      
      if (parsed.type) setType(parsed.type);
      if (parsed.amount !== undefined) {
        setAmount(new Intl.NumberFormat('vi-VN').format(parsed.amount));
      }
      if (parsed.description) setDescription(parsed.description);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.walletId) setWalletId(parsed.walletId);
      if (parsed.destinationWalletId) setDestinationWalletId(parsed.destinationWalletId);
    }
  };

  const currentCategories = type === 'transfer'
    ? ['Chuyển khoản']
    : (categories.filter(c => c.type === type).length > 0
        ? categories.filter(c => c.type === type).map(c => c.name)
        : defaultCategories[type as 'expense' | 'income']);

  // Adjust categories when type changes
  useEffect(() => {
    if (editingTransaction && type === editingTransaction.type) {
      return;
    }
    if (type === 'transfer') {
      setCategory('Chuyển khoản');
    } else {
      setCategory(currentCategories[0] || '');
    }
  }, [type, categories, editingTransaction]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    if (!walletId) {
      setErrorMsg('Vui lòng chọn tài khoản nguồn.');
      return;
    }

    if (type === 'transfer') {
      if (!destinationWalletId) {
        setErrorMsg('Vui lòng chọn ví nhận.');
        return;
      }
      if (walletId === destinationWalletId) {
        setErrorMsg('Ví nhận phải khác ví chuyển.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const txPayload = {
        type,
        amount: parsedAmount,
        category,
        walletId,
        destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
        date,
        description: description.trim() || category,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, txPayload);
      } else {
        await addTransaction(txPayload);
      }

      // Reset form
      setAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi ghi nhận giao dịch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      setAmount('');
      return;
    }
    // Format value with commas for better reading
    setAmount(new Intl.NumberFormat('vi-VN').format(parseInt(val)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{editingTransaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!editingTransaction && (
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✨ NHẬP NHANH BẰNG CHỮ (AI PARSER)
            </label>
            <input
              type="text"
              placeholder="VD: ăn bánh mỳ 35k, chuyển tpbank qua cash 100k..."
              value={quickInput}
              onChange={handleQuickInputChange}
              className="form-input"
              style={{
                borderColor: 'rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.05)',
                fontSize: '14px',
              }}
            />
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '20px',
          gap: '4px',
        }}>
          <button
            type="button"
            onClick={() => setType('expense')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: type === 'expense' ? 'var(--expense-color)' : 'none',
              color: type === 'expense' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <TrendingDown size={14} /> Chi tiền
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: type === 'income' ? 'var(--income-color)' : 'none',
              color: type === 'income' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <TrendingUp size={14} /> Thu tiền
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: type === 'transfer' ? 'var(--transfer-color)' : 'none',
              color: type === 'transfer' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ArrowRightLeft size={14} /> Chuyển khoản
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            color: 'var(--expense-color)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '16px',
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Amount input */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>SỐ TIỀN (VND)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                className="form-input"
                style={{
                  width: '100%',
                  fontSize: '32px',
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '16px',
                  color: type === 'expense' ? 'var(--expense-color)' : type === 'income' ? 'var(--income-color)' : 'var(--transfer-color)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Wallets selectors */}
          {type === 'transfer' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label>TỪ VÍ / NGÂN HÀNG</label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="form-select"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({new Intl.NumberFormat('vi-VN').format(w.balance)}đ)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ĐẾN VÍ / NGÂN HÀNG</label>
                <select
                  value={destinationWalletId}
                  onChange={e => setDestinationWalletId(e.target.value)}
                  className="form-select"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({new Intl.NumberFormat('vi-VN').format(w.balance)}đ)</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>TÀI KHOẢN / VÍ TIỀN</label>
              <select
                value={walletId}
                onChange={e => setWalletId(e.target.value)}
                className="form-select"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({new Intl.NumberFormat('vi-VN').format(w.balance)}đ)</option>
                ))}
              </select>
            </div>
          )}

          {/* Category Selector (Hidden for Transfers) */}
          {type !== 'transfer' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>HẠNG MỤC</label>
                <button
                  type="button"
                  onClick={() => setShowManageCategories(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px'
                  }}
                >
                  <Settings size={12} /> Quản lý
                </button>
              </div>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-select"
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div className="form-group">
            <label>NGÀY GIAO DỊCH</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>GHI CHÚ (MÔ TẢ)</label>
            <input
              type="text"
              placeholder={type === 'transfer' ? 'Chuyển tiền nội bộ' : 'Mô tả ngắn gọn...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="button-primary"
            style={{ width: '100%', padding: '16px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : editingTransaction ? 'Cập nhật giao dịch' : 'Ghi nhận giao dịch'}
          </button>
        </form>
      </div>

      {/* Manage Categories Sub-Modal */}
      {showManageCategories && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.85)' }}
          onClick={() => { setShowManageCategories(false); setEditingCatId(null); }}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '360px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Quản lý Hạng mục {type === 'expense' ? 'Chi' : 'Thu'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => { setShowManageCategories(false); setEditingCatId(null); }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
              {/* Add category form */}
              <form 
                onSubmit={async e => {
                  e.preventDefault();
                  if (!newCatName.trim()) return;
                  try {
                    await addCategory({
                      name: newCatName.trim(),
                      type: type as 'expense' | 'income'
                    });
                    setNewCatName('');
                  } catch (err: any) {
                    alert(err.message || 'Lỗi khi thêm hạng mục.');
                  }
                }}
                style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}
              >
                <input 
                  type="text"
                  placeholder="Tên hạng mục mới..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: 0, flex: 1 }}
                  required
                />
                <button 
                  type="submit"
                  className="button-primary"
                  style={{ padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* List of categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.filter(c => c.type === type).length === 0 ? (
                  defaultCategories[type as 'expense' | 'income'].map(name => (
                    <div 
                      key={name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--card-bg)',
                        borderRadius: '10px',
                        border: '1px solid var(--card-border)'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mặc định</span>
                    </div>
                  ))
                ) : (
                  categories.filter(c => c.type === type).map(cat => (
                    <div 
                      key={cat.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--card-bg)',
                        borderRadius: '10px',
                        border: '1px solid var(--card-border)'
                      }}
                    >
                      {editingCatId === cat.id ? (
                        <form 
                          onSubmit={async e => {
                            e.preventDefault();
                            if (!editingCatName.trim()) return;
                            try {
                              await updateCategory(cat.id, { name: editingCatName.trim() });
                              setEditingCatId(null);
                            } catch (err: any) {
                              alert(err.message || 'Lỗi khi cập nhật.');
                            }
                          }}
                          style={{ display: 'flex', gap: '6px', flex: 1 }}
                        >
                          <input 
                            type="text"
                            value={editingCatName}
                            onChange={e => setEditingCatName(e.target.value)}
                            className="form-input"
                            style={{ marginBottom: 0, padding: '4px 8px', fontSize: '13px', flex: 1 }}
                            required
                            autoFocus
                          />
                          <button 
                            type="submit"
                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}
                          >
                            <Check size={16} />
                          </button>
                        </form>
                      ) : (
                        <>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{cat.name}</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Bạn có chắc muốn xóa hạng mục "${cat.name}"?`)) {
                                  try {
                                    await deleteCategory(cat.id);
                                  } catch (err: any) {
                                    alert(err.message || 'Lỗi khi xóa.');
                                  }
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
