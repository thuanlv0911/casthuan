import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon, ICON_MAP } from './CategoryIcon';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('Utensils');
  const [showIconPickerForNew, setShowIconPickerForNew] = useState<boolean>(false);
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [editingCatIcon, setEditingCatIcon] = useState<string>('Utensils');
  const [showIconPickerForEdit, setShowIconPickerForEdit] = useState<boolean>(false);

  // Set default icon when active type changes
  useEffect(() => {
    setNewCatIcon(activeType === 'expense' ? 'Utensils' : 'Briefcase');
    setShowIconPickerForNew(false);
  }, [activeType]);

  if (!isOpen) return null;

  const currentCategories = categories.filter(c => c.type === activeType);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCategory({
        name: newCatName.trim(),
        type: activeType,
        icon: newCatIcon
      });
      setNewCatName('');
      setNewCatIcon(activeType === 'expense' ? 'Utensils' : 'Briefcase');
      setShowIconPickerForNew(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm hạng mục.');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      await updateCategory(id, { 
        name: editingCatName.trim(),
        icon: editingCatIcon
      });
      setEditingCatId(null);
      setShowIconPickerForEdit(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật hạng mục.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hạng mục "${name}"?`)) {
      try {
        await deleteCategory(id);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi xóa hạng mục.');
      }
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)', animation: 'fadeIn 0.2s' }}
      onClick={() => { onClose(); setEditingCatId(null); setShowIconPickerForNew(false); setShowIconPickerForEdit(false); }}
    >
      <div 
        className="modal-content" 
        style={{ maxWidth: '420px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ marginBottom: '15px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📁 Quản lý hạng mục
          </h3>
          <button 
            className="modal-close" 
            onClick={() => { onClose(); setEditingCatId(null); setShowIconPickerForNew(false); setShowIconPickerForEdit(false); }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '4px',
          gap: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveType('expense'); setEditingCatId(null); }}
            style={{
              flex: 1,
              background: activeType === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              border: 'none',
              color: activeType === 'expense' ? 'var(--expense-color)' : 'var(--text-secondary)',
              padding: '10px 4px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <TrendingDown size={14} /> Khoản chi
          </button>
          <button
            type="button"
            onClick={() => { setActiveType('income'); setEditingCatId(null); }}
            style={{
              flex: 1,
              background: activeType === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: 'none',
              color: activeType === 'income' ? 'var(--income-color)' : 'var(--text-secondary)',
              padding: '10px 4px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <TrendingUp size={14} /> Khoản thu
          </button>
        </div>

        {/* Category Input Form */}
        <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Icon Picker Toggle Button */}
            <button
              type="button"
              onClick={() => setShowIconPickerForNew(!showIconPickerForNew)}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              title="Chọn biểu tượng"
            >
              {React.createElement(ICON_MAP[newCatIcon] || ICON_MAP.HelpCircle, { size: 20 })}
            </button>

            <input 
              type="text"
              placeholder="Tên hạng mục mới..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="form-input"
              style={{ marginBottom: 0, flex: 1, height: '45px' }}
              required
            />
            <button 
              type="submit"
              className="button-primary"
              style={{ width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* New Category Icon Picker Grid */}
          {showIconPickerForNew && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              maxHeight: '150px',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.2s'
            }}>
              {Object.keys(ICON_MAP).map(iconName => {
                const IconComp = ICON_MAP[iconName];
                const isSelected = newCatIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      setNewCatIcon(iconName);
                      setShowIconPickerForNew(false);
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s'
                    }}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          )}
        </form>

        {/* Category List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {currentCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Chưa có hạng mục nào cho phần này.
            </div>
          ) : (
            currentCategories.map(cat => (
              <div 
                key={cat.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'var(--card-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--card-border)',
                  animation: 'fadeIn 0.2s'
                }}
              >
                {editingCatId === cat.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <form 
                      onSubmit={e => { e.preventDefault(); handleUpdateCategory(cat.id); }}
                      style={{ display: 'flex', gap: '6px', flex: 1 }}
                    >
                      {/* Icon Selector for Editing */}
                      <button
                        type="button"
                        onClick={() => setShowIconPickerForEdit(!showIconPickerForEdit)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--card-border)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {React.createElement(ICON_MAP[editingCatIcon] || ICON_MAP.HelpCircle, { size: 16 })}
                      </button>

                      <input 
                        type="text"
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="form-input"
                        style={{ marginBottom: 0, padding: '6px 10px', fontSize: '13px', flex: 1, height: '38px' }}
                        required
                        autoFocus
                      />
                      <button 
                        type="submit"
                        style={{ background: 'rgba(16, 185, 129, 0.15)', border: 'none', color: '#10b981', cursor: 'pointer', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setEditingCatId(null); setShowIconPickerForEdit(false); }}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={16} />
                      </button>
                    </form>

                    {/* Edit Category Icon Picker Grid */}
                    {showIconPickerForEdit && (
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '6px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.2s'
                      }}>
                        {Object.keys(ICON_MAP).map(iconName => {
                          const IconComp = ICON_MAP[iconName];
                          const isSelected = editingCatIcon === iconName;
                          return (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() => {
                                setEditingCatIcon(iconName);
                                setShowIconPickerForEdit(false);
                              }}
                              style={{
                                aspectRatio: '1',
                                borderRadius: '8px',
                                background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.1s'
                              }}
                            >
                              <IconComp size={14} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CategoryIcon category={cat.name} type={cat.type} size={18} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditingCatName(cat.name);
                          setEditingCatIcon(cat.icon || 'HelpCircle');
                          setShowIconPickerForEdit(false);
                        }}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.03)', 
                          border: '1px solid var(--card-border)', 
                          color: 'var(--text-secondary)', 
                          cursor: 'pointer', 
                          padding: '6px', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        style={{ 
                          background: 'rgba(244, 63, 94, 0.08)', 
                          border: '1px solid rgba(244, 63, 94, 0.15)', 
                          color: 'var(--danger)', 
                          cursor: 'pointer', 
                          padding: '6px', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
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
  );
};
