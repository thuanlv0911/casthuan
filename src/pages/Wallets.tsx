import React, { useState } from 'react';
import { PlusCircle, Trash2, ArrowRightLeft, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

export const Wallets: React.FC = () => {
  const { wallets, addWallet, deleteWallet, addTransaction } = useApp();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // Add Wallet Form State
  const [newWalletName, setNewWalletName] = useState<string>('');
  const [newWalletType, setNewWalletType] = useState<'cash' | 'bank' | 'e-wallet'>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState<string>('');
  const [newWalletColor, setNewWalletColor] = useState<string>('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferDesc, setTransferDesc] = useState<string>('Chuyển khoản nội bộ');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    const parsedBalance = parseFloat(newWalletBalance.replace(/[^0-9]/g, '')) || 0;
    setIsSubmitting(true);

    try {
      await addWallet({
        name: newWalletName.trim(),
        type: newWalletType,
        balance: parsedBalance,
        color: newWalletColor,
      });

      // Reset
      setNewWalletName('');
      setNewWalletBalance('');
      setNewWalletColor('#3b82f6');
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm ví mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo) {
      alert('Vui lòng chọn cả ví nguồn và ví nhận.');
      return;
    }
    if (transferFrom === transferTo) {
      alert('Ví nhận phải khác ví chuyển.');
      return;
    }

    const parsedAmount = parseFloat(transferAmount.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    // Verify balance
    const sourceWallet = wallets.find(w => w.id === transferFrom);
    if (sourceWallet && sourceWallet.balance < parsedAmount) {
      if (!window.confirm('Số dư ví hiện tại không đủ. Bạn vẫn muốn tiếp tục chuyển khoản?')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: 'transfer',
        amount: parsedAmount,
        category: 'Chuyển khoản',
        walletId: transferFrom,
        destinationWalletId: transferTo,
        date: transferDate,
        description: transferDesc.trim() || 'Chuyển tiền nội bộ',
      });

      setTransferAmount('');
      setShowTransferModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thực hiện giao dịch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWallet = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa ví "${name}"? Thao tác này sẽ không xóa lịch sử giao dịch liên quan nhưng số dư ví sẽ mất.`)) {
      try {
        await deleteWallet(id);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi xóa ví.');
      }
    }
  };

  const handleAmountChange = (val: string, setter: (v: string) => void) => {
    const numeric = val.replace(/[^0-9]/g, '');
    if (numeric === '') {
      setter('');
      return;
    }
    setter(new Intl.NumberFormat('vi-VN').format(parseInt(numeric)));
  };

  // Preset Colors
  const COLORS = ['#3b82f6', '#10b981', '#d946ef', '#f59e0b', '#ef4444', '#6366f1', '#6b7280', '#ec4899'];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Ví & Ngân hàng</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quản lý nguồn tài chính của bạn</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              if (wallets.length >= 2) {
                setTransferFrom(wallets[0].id);
                setTransferTo(wallets[1].id);
                setShowTransferModal(true);
              } else {
                alert('Bạn cần ít nhất 2 ví để thực hiện chuyển khoản.');
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowRightLeft size={15} /> Chuyển ví
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          >
            <PlusCircle size={15} /> Thêm ví
          </button>
        </div>
      </div>

      {/* Cards List Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {wallets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            Chưa có tài khoản ví nào được tạo. Hãy thêm ví mới ngay!
          </div>
        ) : (
          wallets.map(w => (
            <div 
              key={w.id}
              style={{
                background: `linear-gradient(135deg, ${w.color}dd 0%, ${w.color} 100%)`,
                borderRadius: '20px',
                padding: '20px',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '140px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {/* Card Holographic Glow circles */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: '#fff',
                opacity: 0.1,
                borderRadius: '50%'
              }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{w.name}</h3>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>
                    {w.type === 'bank' ? '🏦 Ngân hàng' : w.type === 'e-wallet' ? '📱 Ví điện tử' : '💵 Tiền mặt'}
                  </span>
                </div>

                <button 
                  onClick={() => handleDeleteWallet(w.id, w.name)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    transition: 'background 0.2s'
                  }}
                  className="card-delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                <span style={{ fontSize: '24px', fontWeight: 800 }}>
                  {formatCurrency(w.balance)}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                  **** **** {w.id.slice(-4)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Wallet Modal Overlay */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Thêm tài khoản mới</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddWallet}>
              
              {/* Wallet Name */}
              <div className="form-group">
                <label>TÊN VÍ / NGÂN HÀNG</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Vietcombank, Momo, Tiền mặt..."
                  value={newWalletName}
                  onChange={e => setNewWalletName(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* Wallet Type */}
              <div className="form-group">
                <label>LOẠI HÌNH TÀI KHOẢN</label>
                <select 
                  value={newWalletType} 
                  onChange={e => setNewWalletType(e.target.value as any)}
                  className="form-select"
                >
                  <option value="bank">🏦 Ngân hàng (Bank)</option>
                  <option value="e-wallet">📱 Ví điện tử (E-Wallet)</option>
                  <option value="cash">💵 Tiền mặt (Cash)</option>
                </select>
              </div>

              {/* Initial Balance */}
              <div className="form-group">
                <label>SỐ DƯ BAN ĐẦU (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={newWalletBalance}
                  onChange={e => handleAmountChange(e.target.value, setNewWalletBalance)}
                  className="form-input"
                />
              </div>

              {/* Theme Color Picker */}
              <div className="form-group">
                <label>MÀU SẮC CHỦ ĐẠO THẺ</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {COLORS.map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setNewWalletColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: newWalletColor === c ? '3px solid #fff' : 'none',
                        boxShadow: newWalletColor === c ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.1s'
                      }}
                    ></button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="button-primary"
                style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản ví'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal Overlay */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Chuyển ví nội bộ</h2>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransfer}>
              
              {/* Select Source and Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>TỪ VÍ (NGUỒN)</label>
                  <select 
                    value={transferFrom} 
                    onChange={e => setTransferFrom(e.target.value)}
                    className="form-select"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>ĐẾN VÍ (ĐÍCH)</label>
                  <select 
                    value={transferTo} 
                    onChange={e => setTransferTo(e.target.value)}
                    className="form-select"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label>SỐ TIỀN CHUYỂN</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={transferAmount}
                  onChange={e => handleAmountChange(e.target.value, setTransferAmount)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label>NGÀY GIAO DỊCH</label>
                <input 
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>GHI CHÚ CHUYỂN KHOẢN</label>
                <input 
                  type="text"
                  value={transferDesc}
                  onChange={e => setTransferDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <button 
                type="submit" 
                className="button-primary"
                style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận chuyển ví'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .card-delete:hover {
          background: rgba(255, 63, 94, 0.4) !important;
        }
      `}</style>

    </div>
  );
};
