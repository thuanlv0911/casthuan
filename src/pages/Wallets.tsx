import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ArrowRightLeft, X, Pencil, User, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import type { Wallet, Asset } from '../services/api';

export const Wallets: React.FC = () => {
  const { 
    wallets, addWallet, updateWallet, deleteWallet, addTransaction, 
    debts, addDebt, repayDebt, deleteDebt,
    assets, addAsset, updateAsset, deleteAsset 
  } = useApp();
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

  // Sub Tab State
  const [subTab, setSubTab] = useState<'wallets' | 'assets' | 'debts'>('wallets');

  // Add Debt Form State
  const [showAddDebtModal, setShowAddDebtModal] = useState<boolean>(false);
  const [debtBorrower, setDebtBorrower] = useState<string>('');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [debtWalletId, setDebtWalletId] = useState<string>('');
  const [debtDesc, setDebtDesc] = useState<string>('');
  const [debtDate, setDebtDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Repay Debt Form State
  const [showRepayModal, setShowRepayModal] = useState<boolean>(false);
  const [repayDebtItem, setRepayDebtItem] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayWalletId, setRepayWalletId] = useState<string>('');

  // Add Asset Form State
  const [showAddAssetModal, setShowAddAssetModal] = useState<boolean>(false);
  const [newAssetName, setNewAssetName] = useState<string>('Vàng SJC');
  const [newAssetUnit, setNewAssetUnit] = useState<string>('Chỉ');
  const [newAssetQuantity, setNewAssetQuantity] = useState<string>('');
  const [newAssetPricePerUnit, setNewAssetPricePerUnit] = useState<string>('');
  const [newAssetDate, setNewAssetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newAssetDesc, setNewAssetDesc] = useState<string>('');
  const [newAssetColor, setNewAssetColor] = useState<string>('#f59e0b');

  // Edit Asset Form State
  const [showEditAssetModal, setShowEditAssetModal] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAssetName, setEditAssetName] = useState<string>('');
  const [editAssetUnit, setEditAssetUnit] = useState<string>('');
  const [editAssetQuantity, setEditAssetQuantity] = useState<string>('');
  const [editAssetPricePerUnit, setEditAssetPricePerUnit] = useState<string>('');
  const [editAssetDate, setEditAssetDate] = useState<string>('');
  const [editAssetDesc, setEditAssetDesc] = useState<string>('');
  const [editAssetColor, setEditAssetColor] = useState<string>('#f59e0b');

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

  useEffect(() => {
    if (wallets.length > 0) {
      if (!debtWalletId) setDebtWalletId(wallets[0].id);
      if (!repayWalletId) setRepayWalletId(wallets[0].id);
    }
  }, [wallets, debtWalletId, repayWalletId]);

  const handleAddDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtBorrower.trim() || !debtWalletId) return;
    const parsedAmount = parseFloat(debtAmount.replace(/[^0-9]/g, '')) || 0;
    if (parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDebt({
        borrower: debtBorrower.trim(),
        amount: parsedAmount,
        walletId: debtWalletId,
        date: debtDate,
        description: debtDesc.trim(),
        status: 'pending'
      });

      // Reset
      setDebtBorrower('');
      setDebtAmount('');
      setDebtDesc('');
      setShowAddDebtModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi nợ mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRepayModal = (debt: any) => {
    setRepayDebtItem(debt);
    setRepayAmount(new Intl.NumberFormat('vi-VN').format(debt.amount));
    if (wallets.length > 0) {
      setRepayWalletId(wallets[0].id);
    }
    setShowRepayModal(true);
  };

  const handleRepayDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayDebtItem || !repayWalletId) return;
    const parsedAmount = parseFloat(repayAmount.replace(/[^0-9]/g, '')) || 0;
    if (parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await repayDebt(repayDebtItem.id, parsedAmount, repayWalletId);

      setShowRepayModal(false);
      setRepayDebtItem(null);
      setRepayAmount('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thu hồi nợ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetUnit.trim()) return;
    const parsedQty = parseFloat(newAssetQuantity.replace(/[^0-9.]/g, '')) || 0;
    const parsedPrice = parseFloat(newAssetPricePerUnit.replace(/[^0-9]/g, '')) || 0;
    if (parsedQty <= 0 || parsedPrice <= 0) {
      alert('Vui lòng nhập số lượng và giá trị hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAsset({
        name: newAssetName.trim(),
        unit: newAssetUnit.trim(),
        quantity: parsedQty,
        valuePerUnit: parsedPrice,
        date: newAssetDate,
        description: newAssetDesc.trim(),
        color: newAssetColor
      });

      // Reset
      setNewAssetName('Vàng SJC');
      setNewAssetUnit('Chỉ');
      setNewAssetQuantity('');
      setNewAssetPricePerUnit('');
      setNewAssetDesc('');
      setShowAddAssetModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm tài sản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setEditAssetName(asset.name);
    setEditAssetUnit(asset.unit);
    setEditAssetQuantity(asset.quantity.toString());
    setEditAssetPricePerUnit(new Intl.NumberFormat('vi-VN').format(asset.valuePerUnit));
    setEditAssetDate(asset.date);
    setEditAssetDesc(asset.description);
    setEditAssetColor(asset.color);
    setShowEditAssetModal(true);
  };

  const handleEditAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!editAssetName.trim() || !editAssetUnit.trim()) return;
    const parsedQty = parseFloat(editAssetQuantity.replace(/[^0-9.]/g, '')) || 0;
    const parsedPrice = parseFloat(editAssetPricePerUnit.replace(/[^0-9]/g, '')) || 0;
    if (parsedQty <= 0 || parsedPrice <= 0) {
      alert('Vui lòng nhập số lượng và giá trị hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAsset(editingAsset.id, {
        name: editAssetName.trim(),
        unit: editAssetUnit.trim(),
        quantity: parsedQty,
        valuePerUnit: parsedPrice,
        date: editAssetDate,
        description: editAssetDesc.trim(),
        color: editAssetColor
      });

      setShowEditAssetModal(false);
      setEditingAsset(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi sửa tài sản.');
    } finally {
      setIsSubmitting(false);
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

      {/* Sub Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '4px',
        gap: '4px',
        marginTop: '8px',
        marginBottom: '8px'
      }}>
        <button
          type="button"
          onClick={() => setSubTab('wallets')}
          style={{
            flex: 1,
            background: subTab === 'wallets' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '8px 4px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          💳 Ví & Ngân hàng
        </button>
        <button
          type="button"
          onClick={() => setSubTab('assets')}
          style={{
            flex: 1,
            background: subTab === 'assets' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '8px 4px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          💎 Tài sản khác ({assets.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('debts')}
          style={{
            flex: 1,
            background: subTab === 'debts' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '8px 4px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          📓 Sổ nợ ({debts.length})
        </button>
      </div>

      {subTab === 'wallets' ? (
        <>
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
        </>
      ) : subTab === 'assets' ? (
        <>
          {/* Total Asset Valuation Panel */}
          <div style={{
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(234,179,8,0.2)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', opacity: 0.9 }}>TỔNG GIÁ TRỊ TÀI SẢN KHÁC (ƯỚC TÍNH)</span>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>
              {formatCurrency(assets.reduce((sum, a) => sum + (a.quantity * a.valuePerUnit), 0))}
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setShowAddAssetModal(true)}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          >
            <PlusCircle size={15} /> Thêm tài sản mới
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
            {assets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                Hiện chưa có tài sản khác nào. Hãy thêm ngay!
              </div>
            ) : (
              assets.map(a => (
                <div 
                  key={a.id}
                  style={{
                    background: `linear-gradient(135deg, ${a.color}dd 0%, ${a.color} 100%)`,
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
                  {/* Holographic Glow circles */}
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
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{a.name}</h3>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                        Số lượng: <strong>{a.quantity}</strong> {a.unit}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button"
                        onClick={() => handleOpenEditAsset(a)}
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
                      >
                        <Pencil size={14} />
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn xóa tài sản "${a.name}"?`)) {
                            deleteAsset(a.id);
                          }
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', opacity: 0.6 }}>Giá trị quy đổi:</span>
                      <span style={{ fontSize: '20px', fontWeight: 800 }}>
                        {formatCurrency(a.quantity * a.valuePerUnit)}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                      Đơn giá: {formatCurrency(a.valuePerUnit)}/{a.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Total Debt Panel */}
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
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>TỔNG TIỀN CHO VAY (CHƯA THU)</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{formatCurrency(debts.reduce((sum, d) => sum + d.amount, 0))}</span>
          </div>

          <button 
            type="button"
            onClick={() => setShowAddDebtModal(true)}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          >
            <PlusCircle size={15} /> Ghi nợ mới (Cho vay)
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {debts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                Hiện chưa có khoản cho vay nào.
              </div>
            ) : (
              debts.map(d => {
                const w = wallets.find(wallet => wallet.id === d.walletId);
                return (
                  <div 
                    key={d.id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={20} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.borrower}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Ngày vay: {d.date} {d.description ? `• ${d.description}` : ''}
                        </span>
                        {w ? (
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            Nguồn xuất: <strong style={{ color: w.color }}>{w.name}</strong>
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            Nguồn xuất: <em>Không qua ví</em>
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>
                        {formatCurrency(d.amount)}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenRepayModal(d)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title="Thu hồi nợ"
                        >
                          <Coins size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa khoản nợ này khỏi sổ ghi nợ? Thao tác này sẽ không tạo giao dịch hoàn trả tiền ví.')) {
                              deleteDebt(d.id);
                            }
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title="Xóa khoản nợ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

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

      {/* Add Debt Modal Overlay */}
      {showAddDebtModal && (
        <div className="modal-overlay" onClick={() => setShowAddDebtModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Ghi nợ mới (Cho vay)</h2>
              <button className="modal-close" onClick={() => setShowAddDebtModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDebtSubmit}>
              {/* Borrower Name */}
              <div className="form-group">
                <label>TÊN NGƯỜI VAY</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={debtBorrower}
                  onChange={e => setDebtBorrower(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label>SỐ TIỀN VAY (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={debtAmount}
                  onChange={e => handleAmountChange(e.target.value, setDebtAmount)}
                  className="form-input"
                  required
                />
              </div>

              {/* Source Wallet */}
              <div className="form-group">
                <label>NGUỒN TIỀN XUẤT PHÁT</label>
                <select 
                  value={debtWalletId}
                  onChange={e => setDebtWalletId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="none">❌ Không chọn nguồn (đã cho vay từ trước)</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label>NGÀY GHI NỢ</label>
                <input 
                  type="date"
                  value={debtDate}
                  onChange={e => setDebtDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>GHI CHÚ / MÔ TẢ</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Vay tiêu dùng, mua sắm..."
                  value={debtDesc}
                  onChange={e => setDebtDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <button 
                type="submit" 
                className="button-primary"
                style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : 'Ghi nợ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Repay Debt Modal Overlay */}
      {showRepayModal && repayDebtItem && (
        <div className="modal-overlay" onClick={() => { setShowRepayModal(false); setRepayDebtItem(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Thu hồi nợ: {repayDebtItem.borrower}</h2>
              <button className="modal-close" onClick={() => { setShowRepayModal(false); setRepayDebtItem(null); }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRepayDebtSubmit}>
              {/* Repay Amount */}
              <div className="form-group">
                <label>SỐ TIỀN THU HỒI (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={repayAmount}
                  onChange={e => handleAmountChange(e.target.value, setRepayAmount)}
                  className="form-input"
                  required
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Khoản vay gốc: {formatCurrency(repayDebtItem.amount)}
                </span>
              </div>

              {/* Destination Wallet */}
              <div className="form-group">
                <label>VÍ / TÀI KHOẢN NHẬN TIỀN</label>
                <select 
                  value={repayWalletId}
                  onChange={e => setRepayWalletId(e.target.value)}
                  className="form-select"
                  required
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="button-primary"
                style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang thực hiện...' : 'Thu hồi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal Overlay */}
      {showAddAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAddAssetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Thêm tài sản mới</h2>
              <button className="modal-close" onClick={() => setShowAddAssetModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAssetSubmit}>
              {/* Asset Name */}
              <div className="form-group">
                <label>TÊN TÀI SẢN</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Vàng 9999 SJC, Cổ phiếu FPT..."
                  value={newAssetName}
                  onChange={e => setNewAssetName(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* Unit */}
              <div className="form-group">
                <label>ĐƠN VỊ TÍNH</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Chỉ, Lượng, Cổ phiếu..."
                  value={newAssetUnit}
                  onChange={e => setNewAssetUnit(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label>SỐ LƯỢNG</label>
                <input 
                  type="text"
                  placeholder="0.0"
                  value={newAssetQuantity}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setNewAssetQuantity(val);
                  }}
                  className="form-input"
                  required
                />
              </div>

              {/* Price per unit */}
              <div className="form-group">
                <label>ĐƠN GIÁ QUY ĐỔI (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={newAssetPricePerUnit}
                  onChange={e => handleAmountChange(e.target.value, setNewAssetPricePerUnit)}
                  className="form-input"
                  required
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label>NGÀY SỞ HỮU</label>
                <input 
                  type="date"
                  value={newAssetDate}
                  onChange={e => setNewAssetDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>GHI CHÚ / MÔ TẢ</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Mua ở tiệm PNJ..."
                  value={newAssetDesc}
                  onChange={e => setNewAssetDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Theme Color Picker */}
              <div className="form-group">
                <label>MÀU SẮC THẺ TÀI SẢN</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {COLORS.map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setNewAssetColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: newAssetColor === c ? '3px solid #fff' : 'none',
                        boxShadow: newAssetColor === c ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
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
                {isSubmitting ? 'Đang lưu...' : 'Thêm tài sản'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal Overlay */}
      {showEditAssetModal && editingAsset && (
        <div className="modal-overlay" onClick={() => { setShowEditAssetModal(false); setEditingAsset(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Sửa tài sản</h2>
              <button className="modal-close" onClick={() => { setShowEditAssetModal(false); setEditingAsset(null); }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAssetSubmit}>
              {/* Asset Name */}
              <div className="form-group">
                <label>TÊN TÀI SẢN</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Vàng 9999 SJC..."
                  value={editAssetName}
                  onChange={e => setEditAssetName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Unit */}
              <div className="form-group">
                <label>ĐƠN VỊ TÍNH</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Chỉ, Lượng..."
                  value={editAssetUnit}
                  onChange={e => setEditAssetUnit(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label>SỐ LƯỢNG</label>
                <input 
                  type="text"
                  placeholder="0.0"
                  value={editAssetQuantity}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setEditAssetQuantity(val);
                  }}
                  className="form-input"
                  required
                />
              </div>

              {/* Price per unit */}
              <div className="form-group">
                <label>ĐƠN GIÁ QUY ĐỔI (VND)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0đ"
                  value={editAssetPricePerUnit}
                  onChange={e => handleAmountChange(e.target.value, setEditAssetPricePerUnit)}
                  className="form-input"
                  required
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label>NGÀY SỞ HỮU</label>
                <input 
                  type="date"
                  value={editAssetDate}
                  onChange={e => setEditAssetDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>GHI CHÚ / MÔ TẢ</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Mua ở tiệm..."
                  value={editAssetDesc}
                  onChange={e => setEditAssetDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Theme Color Picker */}
              <div className="form-group">
                <label>MÀU SẮC THẺ TÀI SẢN</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {COLORS.map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setEditAssetColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: editAssetColor === c ? '3px solid #fff' : 'none',
                        boxShadow: editAssetColor === c ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
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
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật tài sản'}
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
