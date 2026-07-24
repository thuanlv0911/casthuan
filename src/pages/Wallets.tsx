import React, { useState } from 'react';
import { PlusCircle, Trash2, ArrowRightLeft, X, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import type { Wallet } from '../services/api';

export const Wallets: React.FC = () => {
  const { wallets, addWallet, updateWallet, deleteWallet, addTransaction } = useApp();
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  
  // Calculate sub-totals for display
  const mbbankTotal = wallets.filter(w => w.name.toLowerCase().includes('mbbank')).reduce((sum, w) => sum + w.balance, 0);
  const techcomTotal = wallets.filter(w => w.name.toLowerCase().includes('techcombank')).reduce((sum, w) => sum + w.balance, 0);
  const tpbankTotal = wallets.filter(w => w.name.toLowerCase().includes('tpbank')).reduce((sum, w) => sum + w.balance, 0);
  const momoVnpayTotal = wallets.filter(w => w.name.toLowerCase().includes('momo') || w.name.toLowerCase().includes('vnpay') || w.type === 'e-wallet').reduce((sum, w) => sum + w.balance, 0);
  const tienMatLonTotal = wallets.filter(w => w.type === 'cash' && (w.name.toLowerCase().includes('lớn') || w.name.toLowerCase().includes('lon') || (!w.name.toLowerCase().includes('lẻ') && !w.name.toLowerCase().includes('nhỏ')))).reduce((sum, w) => sum + w.balance, 0);
  const tienLeNhoTotal = wallets.filter(w => w.type === 'cash' && (w.name.toLowerCase().includes('lẻ') || w.name.toLowerCase().includes('nhỏ'))).reduce((sum, w) => sum + w.balance, 0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // Top-Up Form State
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [selectedWalletForTopUp, setSelectedWalletForTopUp] = useState<Wallet | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [topUpDesc, setTopUpDesc] = useState<string>('Nạp tiền vào ví');

  // Edit Wallet Form State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editWalletName, setEditWalletName] = useState<string>('');
  const [editWalletType, setEditWalletType] = useState<'cash' | 'bank' | 'e-wallet'>('bank');
  const [editWalletColor, setEditWalletColor] = useState<string>('#3b82f6');
  const [editWalletSubType, setEditWalletSubType] = useState<string>('MBBank');
  const [editWalletBalance, setEditWalletBalance] = useState<string>('');

  // Add Wallet Form State
  const [newWalletName, setNewWalletName] = useState<string>('MBBank');
  const [newWalletType, setNewWalletType] = useState<'cash' | 'bank' | 'e-wallet'>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState<string>('');
  const [newWalletColor, setNewWalletColor] = useState<string>('#3b82f6');
  const [newWalletSubType, setNewWalletSubType] = useState<string>('MBBank');
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
      setNewWalletName('MBBank');
      setNewWalletType('bank');
      setNewWalletSubType('MBBank');
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

  const handleOpenTopUp = (w: Wallet) => {
    setSelectedWalletForTopUp(w);
    setTopUpAmount('');
    setTopUpDesc('Nạp tiền vào ví');
    setShowTopUpModal(true);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletForTopUp) return;

    const parsedAmount = parseFloat(topUpAmount.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: 'income',
        amount: parsedAmount,
        category: 'Được tặng',
        walletId: selectedWalletForTopUp.id,
        date: new Date().toISOString().split('T')[0],
        description: topUpDesc.trim() || `Nạp tiền vào ${selectedWalletForTopUp.name}`,
      });

      setTopUpAmount('');
      setShowTopUpModal(false);
      setSelectedWalletForTopUp(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nạp tiền vào ví.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditWallet = (w: Wallet) => {
    setEditingWallet(w);
    setEditWalletName(w.name);
    setEditWalletType(w.type);
    setEditWalletColor(w.color);
    setEditWalletBalance(new Intl.NumberFormat('vi-VN').format(w.balance));

    // Guess subtype from name
    const n = w.name.toLowerCase();
    if (w.type === 'bank') {
      if (n.includes('tpbank')) setEditWalletSubType('TPBank');
      else if (n.includes('techcombank')) setEditWalletSubType('Techcombank');
      else setEditWalletSubType('MBBank');
    } else if (w.type === 'e-wallet') {
      if (n.includes('vnpay')) setEditWalletSubType('VNPay');
      else setEditWalletSubType('Momo');
    } else if (w.type === 'cash') {
      if (n.includes('tiền lẻ') || n.includes('nhỏ') || n.includes('lẻ')) setEditWalletSubType('Tiền lẻ (Nhỏ)');
      else setEditWalletSubType('Tiền mặt (Lớn)');
    }
    setShowEditModal(true);
  };

  const handleEditWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !editWalletName.trim()) return;

    const parsedBalance = parseFloat(editWalletBalance.replace(/[^0-9]/g, '')) || 0;
    setIsSubmitting(true);
    try {
      await updateWallet(editingWallet.id, {
        name: editWalletName.trim(),
        type: editWalletType,
        color: editWalletColor,
        balance: parsedBalance,
      });

      setShowEditModal(false);
      setEditingWallet(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật thông tin ví.');
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

      {/* Total Balance Panel */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>TỔNG TIỀN TẤT CẢ VÍ</span>
        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--income-color)' }}>{formatCurrency(totalBalance)}</span>
      </div>

      {/* Sub-totals Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>💵 TIỀN LẺ (NHỎ)</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(tienLeNhoTotal)}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>🏦 TPBANK</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(tpbankTotal)}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>🏦 MBBANK</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(mbbankTotal)}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>🏦 TECHCOMBANK</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(techcomTotal)}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>📱 MOMO & VNPAY</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(momoVnpayTotal)}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>💵 TIỀN MẶT LỚN</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(tienMatLonTotal)}</span>
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
              onClick={() => handleOpenTopUp(w)}
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
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditWallet(w);
                    }}
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
                    className="card-edit"
                  >
                    <Pencil size={14} />
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWallet(w.id, w.name);
                    }}
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
                  onChange={e => {
                    const val = e.target.value as 'bank' | 'e-wallet' | 'cash';
                    setNewWalletType(val);
                    if (val === 'bank') {
                      setNewWalletSubType('MBBank');
                      setNewWalletName('MBBank');
                    } else if (val === 'e-wallet') {
                      setNewWalletSubType('Momo');
                      setNewWalletName('Momo');
                    } else if (val === 'cash') {
                      setNewWalletSubType('Tiền mặt (Lớn)');
                      setNewWalletName('Tiền mặt (Lớn)');
                    }
                  }}
                  className="form-select"
                >
                  <option value="bank">🏦 Ngân hàng (Bank)</option>
                  <option value="e-wallet">📱 Ví điện tử (E-Wallet)</option>
                  <option value="cash">💵 Tiền mặt (Cash)</option>
                </select>
              </div>

              {/* Wallet Sub-Type */}
              <div className="form-group">
                <label>
                  {newWalletType === 'bank' ? 'CHI TIẾT NGÂN HÀNG' : newWalletType === 'e-wallet' ? 'CHI TIẾT VÍ ĐIỆN TỬ' : 'CHI TIẾT TIỀM MẶT'}
                </label>
                {newWalletType === 'bank' && (
                  <select 
                    value={newWalletSubType} 
                    onChange={e => {
                      setNewWalletSubType(e.target.value);
                      setNewWalletName(e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="MBBank">🏦 MBBank</option>
                    <option value="TPBank">🏦 TPBank</option>
                    <option value="Techcombank">🏦 Techcombank</option>
                  </select>
                )}
                {newWalletType === 'e-wallet' && (
                  <select 
                    value={newWalletSubType} 
                    onChange={e => {
                      setNewWalletSubType(e.target.value);
                      setNewWalletName(e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="Momo">📱 Momo</option>
                    <option value="VNPay">📱 VNPay</option>
                  </select>
                )}
                {newWalletType === 'cash' && (
                  <select 
                    value={newWalletSubType} 
                    onChange={e => {
                      setNewWalletSubType(e.target.value);
                      setNewWalletName(e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="Tiền mặt (Lớn)">💵 Tiền mặt (Lớn)</option>
                    <option value="Tiền lẻ (Nhỏ)">💵 Tiền lẻ (Nhỏ)</option>
                  </select>
                )}
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

      {/* Top Up Wallet Modal Overlay */}
      {showTopUpModal && selectedWalletForTopUp && (
        <div className="modal-overlay" onClick={() => { setShowTopUpModal(false); setSelectedWalletForTopUp(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Nạp tiền: {selectedWalletForTopUp.name}</h2>
              <button className="modal-close" onClick={() => { setShowTopUpModal(false); setSelectedWalletForTopUp(null); }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit}>
              {/* Amount */}
              <div className="form-group">
                <label>SỐ TIỀN NẠP (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={topUpAmount}
                  onChange={e => handleAmountChange(e.target.value, setTopUpAmount)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>GHI CHÚ / NỘI DUNG</label>
                <input 
                  type="text"
                  value={topUpDesc}
                  onChange={e => setTopUpDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <button 
                type="submit" 
                className="button-primary"
                style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận nạp tiền'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Wallet Modal Overlay */}
      {showEditModal && editingWallet && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingWallet(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Sửa thông tin ví</h2>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingWallet(null); }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditWallet}>
              {/* Wallet Name */}
              <div className="form-group">
                <label>TÊN VÍ / NGÂN HÀNG</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Vietcombank, Momo..."
                  value={editWalletName}
                  onChange={e => setEditWalletName(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* Wallet Type */}
              <div className="form-group">
                <label>LOẠI HÌNH TÀI KHOẢN</label>
                <select 
                  value={editWalletType} 
                  onChange={e => {
                    const val = e.target.value as 'bank' | 'e-wallet' | 'cash';
                    setEditWalletType(val);
                    if (val === 'bank') {
                      setEditWalletSubType('MBBank');
                      setEditWalletName('MBBank');
                    } else if (val === 'e-wallet') {
                      setEditWalletSubType('Momo');
                      setEditWalletName('Momo');
                    } else if (val === 'cash') {
                      setEditWalletSubType('Tiền mặt (Lớn)');
                      setEditWalletName('Tiền mặt (Lớn)');
                    }
                  }}
                  className="form-select"
                >
                  <option value="bank">🏦 Ngân hàng (Bank)</option>
                  <option value="e-wallet">📱 Ví điện tử (E-Wallet)</option>
                  <option value="cash">💵 Tiền mặt (Cash)</option>
                </select>
              </div>

              {/* Wallet Sub-Type */}
              <div className="form-group">
                <label>
                  {editWalletType === 'bank' ? 'CHI TIẾT NGÂN HÀNG' : editWalletType === 'e-wallet' ? 'CHI TIẾT VÍ ĐIỆN TỬ' : 'CHI TIẾT TIỀM MẶT'}
                </label>
                {editWalletType === 'bank' && (
                  <select 
                    value={editWalletSubType} 
                    onChange={e => {
                      setEditWalletSubType(e.target.value);
                      setEditWalletName(e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="MBBank">🏦 MBBank</option>
                    <option value="TPBank">🏦 TPBank</option>
                    <option value="Techcombank">🏦 Techcombank</option>
                  </select>
                )}
                {editWalletType === 'e-wallet' && (
                  <select 
                    value={editWalletSubType} 
                    onChange={e => {
                      setEditWalletSubType(e.target.value);
                      setEditWalletName(e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="Momo">📱 Momo</option>
                    <option value="VNPay">📱 VNPay</option>
                  </select>
                )}
                {editWalletType === 'cash' && (
                  <select 
                    value={editWalletSubType} 
                    onChange={e => {
                      setEditWalletSubType(e.target.value);
                      setEditWalletName(e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="Tiền mặt (Lớn)">💵 Tiền mặt (Lớn)</option>
                    <option value="Tiền lẻ (Nhỏ)">💵 Tiền lẻ (Nhỏ)</option>
                  </select>
                )}
              </div>

              {/* Wallet Balance */}
              <div className="form-group">
                <label>SỐ DƯ HIỆN TẠI (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={editWalletBalance}
                  onChange={e => handleAmountChange(e.target.value, setEditWalletBalance)}
                  className="form-input"
                  required
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
                      onClick={() => setEditWalletColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: editWalletColor === c ? '3px solid #fff' : 'none',
                        boxShadow: editWalletColor === c ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
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
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật ví'}
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
