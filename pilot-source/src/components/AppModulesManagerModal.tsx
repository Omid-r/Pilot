import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Activity,
  Terminal,
  Shield,
  ShieldCheck,
  Layers,
  Box,
  Wifi,
  Radio,
  FileCode,
  BookOpen,
  Archive,
  Wrench,
  Globe,
  HardDrive,
  Package,
  Award,
  Zap,
  Building2,
  Bell,
  Search,
  GripVertical
} from 'lucide-react';

export interface AppModuleConfig {
  id: string;
  category: 'architecture' | 'health_logs' | 'radar_ingest' | 'agents_gateway' | 'tools_security';
  categoryNameFa: string;
  categoryNameEn: string;
  domainColor: string;
  iconName: string;
  titleFa: string;
  titleEn: string;
  badge?: string;
  descriptionFa: string;
  descriptionEn: string;
  isEnabled: boolean;
  order: number;
  isCustom?: boolean;
}

interface AppModulesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFa: boolean;
  modules: AppModuleConfig[];
  onUpdateModules: (newModules: AppModuleConfig[]) => void;
  defaultTab: string;
  onUpdateDefaultTab: (newDefaultTab: string) => void;
  onResetToDefaults: () => void;
}

export const AVAILABLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Server,
  Activity,
  Terminal,
  Shield,
  ShieldCheck,
  Layers,
  Box,
  Wifi,
  Radio,
  FileCode,
  BookOpen,
  Archive,
  Wrench,
  Globe,
  HardDrive,
  Package,
  Award,
  Zap,
  Building2,
  Bell,
  Sparkles,
  SlidersHorizontal
};

export const AppModulesManagerModal: React.FC<AppModulesManagerModalProps> = ({
  isOpen,
  onClose,
  isFa,
  modules,
  onUpdateModules,
  defaultTab,
  onUpdateDefaultTab,
  onResetToDefaults
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // New module state
  const [newTitleFa, setNewTitleFa] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDescFa, setNewDescFa] = useState('');
  const [newDescEn, setNewDescEn] = useState('');
  const [newCategory, setNewCategory] = useState<'architecture' | 'health_logs' | 'radar_ingest' | 'agents_gateway' | 'tools_security'>('architecture');
  const [newBadge, setNewBadge] = useState('Custom');
  const [newIconName, setNewIconName] = useState('Server');

  // Edit existing module state
  const [editTitleFa, setEditTitleFa] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editDescFa, setEditDescFa] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editCategory, setEditCategory] = useState<'architecture' | 'health_logs' | 'radar_ingest' | 'agents_gateway' | 'tools_security'>('architecture');
  const [editBadge, setEditBadge] = useState('');
  const [editIconName, setEditIconName] = useState('Server');

  // Drag and Drop reordering state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const sourceIndex = modules.findIndex(m => m.id === draggedId);
    const targetIndex = modules.findIndex(m => m.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updated = [...modules];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      updated.forEach((m, idx) => { m.order = idx; });
      onUpdateModules(updated);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Move Module Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    // Reassign order indices
    updated.forEach((m, idx) => { m.order = idx; });
    onUpdateModules(updated);
  };

  // Move Module Down
  const handleMoveDown = (index: number) => {
    if (index === modules.length - 1) return;
    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    // Reassign order indices
    updated.forEach((m, idx) => { m.order = idx; });
    onUpdateModules(updated);
  };

  // Toggle Module Visibility (Enable / Disable)
  const handleToggleEnable = (id: string) => {
    const updated = modules.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m);
    onUpdateModules(updated);
  };

  // Delete Custom Module
  const handleDeleteModule = (id: string) => {
    const updated = modules.filter(m => m.id !== id);
    updated.forEach((m, idx) => { m.order = idx; });
    onUpdateModules(updated);
    if (editingModuleId === id) setEditingModuleId(null);
  };

  // Save New Custom Module
  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleFa.trim() && !newTitleEn.trim()) return;

    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const categoryLabels: Record<string, { fa: string; en: string }> = {
      architecture: { fa: 'معماری و SVA', en: 'Architecture & SVA' },
      health_logs: { fa: 'عیب‌یابی و سلامت', en: 'Health & Diagnostics' },
      radar_ingest: { fa: 'رادار و جریان لاگ', en: 'Telemetry & Ingest' },
      agents_gateway: { fa: 'ایجنت‌ها و درگاه', en: 'Agents & Gateway' },
      tools_security: { fa: 'ابزارها و امنیت', en: 'Security & Utilities' }
    };

    const newModule: AppModuleConfig = {
      id,
      category: newCategory,
      categoryNameFa: categoryLabels[newCategory].fa,
      categoryNameEn: categoryLabels[newCategory].en,
      domainColor: newCategory === 'architecture' ? 'amber' : newCategory === 'health_logs' ? 'rose' : newCategory === 'radar_ingest' ? 'emerald' : 'purple',
      iconName: newIconName,
      titleFa: newTitleFa.trim() || newTitleEn.trim(),
      titleEn: newTitleEn.trim() || newTitleFa.trim(),
      badge: newBadge.trim() || 'Custom',
      descriptionFa: newDescFa.trim() || 'ماژول سفارشی تعریف‌شده توسط کاربر',
      descriptionEn: newDescEn.trim() || 'User defined custom workflow module',
      isEnabled: true,
      order: modules.length,
      isCustom: true
    };

    const updated = [...modules, newModule];
    onUpdateModules(updated);
    setIsAddingNew(false);
    // Reset inputs
    setNewTitleFa('');
    setNewTitleEn('');
    setNewDescFa('');
    setNewDescEn('');
    setNewBadge('Custom');
  };

  // Start Editing
  const handleStartEdit = (mod: AppModuleConfig) => {
    setEditingModuleId(mod.id);
    setEditTitleFa(mod.titleFa);
    setEditTitleEn(mod.titleEn);
    setEditDescFa(mod.descriptionFa);
    setEditDescEn(mod.descriptionEn);
    setEditCategory(mod.category);
    setEditBadge(mod.badge || '');
    setEditIconName(mod.iconName || 'Server');
  };

  // Save Editing
  const handleSaveEdit = (id: string) => {
    const categoryLabels: Record<string, { fa: string; en: string }> = {
      architecture: { fa: 'معماری و SVA', en: 'Architecture & SVA' },
      health_logs: { fa: 'عیب‌یابی و سلامت', en: 'Health & Diagnostics' },
      radar_ingest: { fa: 'رادار و جریان لاگ', en: 'Telemetry & Ingest' },
      agents_gateway: { fa: 'ایجنت‌ها و درگاه', en: 'Agents & Gateway' },
      tools_security: { fa: 'ابزارها و امنیت', en: 'Security & Utilities' }
    };

    const updated = modules.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        titleFa: editTitleFa.trim() || m.titleFa,
        titleEn: editTitleEn.trim() || m.titleEn,
        descriptionFa: editDescFa.trim() || m.descriptionFa,
        descriptionEn: editDescEn.trim() || m.descriptionEn,
        category: editCategory,
        categoryNameFa: categoryLabels[editCategory].fa,
        categoryNameEn: categoryLabels[editCategory].en,
        badge: editBadge.trim(),
        iconName: editIconName
      };
    });

    onUpdateModules(updated);
    setEditingModuleId(null);
  };

  // Filter list
  const filteredModules = modules.filter(m => {
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.titleFa.toLowerCase().includes(q) ||
      m.titleEn.toLowerCase().includes(q) ||
      m.descriptionFa.toLowerCase().includes(q) ||
      m.descriptionEn.toLowerCase().includes(q) ||
      (m.badge && m.badge.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="apple-window max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-white/10"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Apple Window Header */}
        <div className="px-5 py-4 bg-[#1f2026] border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0071e3]/15 text-[#0071e3] border border-[#0071e3]/30">
              <SlidersHorizontal className="w-5 h-5 text-[#0a84ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {isFa ? 'پنل مدیریت، پیکربندی و شخصی‌سازی کل برنامه' : 'Studio Customization & Module Manager'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-white/70 border border-white/10 tabular-nums">
                  {modules.filter(m => m.isEnabled).length}/{modules.length} {isFa ? 'فعال' : 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">
                {isFa 
                  ? 'امکان جابه‌جایی نوبت نمایش (بالا/پایین)، حذف یا پنهان‌سازی ماژول‌ها، افزودن ماژول‌های جدید و تعیین صفحه اول ورود به برنامه.'
                  : 'Reorder, enable/disable, add custom modules, edit labels and choose the default launch screen.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/[0.1] text-white/50 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Toolbar: Default Tab Selection & Reset */}
        <div className="px-5 py-3 bg-[#18191f] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/60 font-medium">
              {isFa ? 'صفحه پیش‌فرض هنگام باز شدن برنامه:' : 'Default Launch Screen:'}
            </span>
            <select
              value={defaultTab}
              onChange={(e) => onUpdateDefaultTab(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-md py-1 px-2.5 text-xs text-[#0a84ff] font-semibold focus:outline-none cursor-pointer"
            >
              {modules.filter(m => m.isEnabled).map(m => (
                <option key={m.id} value={m.id} className="bg-[#1c1c1e] text-white">
                  {isFa ? m.titleFa : m.titleEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a84ff]/10 border border-[#0a84ff]/25 text-[#0a84ff] text-[11px] font-medium">
              <GripVertical className="w-3.5 h-3.5 shrink-0" />
              <span>{isFa ? 'مرتب‌سازی با درگ و دراپ (Drag & Drop) فعال است' : 'Drag & Drop Reordering Active'}</span>
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="apple-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFa ? 'افزودن ماژول دلخواه' : 'Add Custom Module'}</span>
            </button>

            <button
              onClick={onResetToDefaults}
              className="apple-btn-secondary text-xs"
              title={isFa ? 'بازنشانی به چیدمان اولیه ۱۹ ماژول رسمی' : 'Restore factory default module layout'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-white/50" />
              <span>{isFa ? 'بازنشانی به پیش‌فرض' : 'Reset Defaults'}</span>
            </button>
          </div>
        </div>

        {/* New Module Form (Expandable) */}
        {isAddingNew && (
          <form onSubmit={handleCreateModule} className="p-4 bg-[#14151b] border-b border-white/[0.08] space-y-3 shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0a84ff] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>{isFa ? 'مشخصات ماژول سفارشی جدید' : 'New Custom Module Details'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-white/40 hover:text-white"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">{isFa ? 'عنوان فارسی:' : 'Persian Title:'}</label>
                <input
                  type="text"
                  required
                  value={newTitleFa}
                  onChange={(e) => setNewTitleFa(e.target.value)}
                  placeholder={isFa ? 'مثال: داشبورد SOC پیشرفته' : 'e.g. Advanced SOC Dashboard'}
                  className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white focus:outline-none focus:border-[#0a84ff]"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">{isFa ? 'عنوان انگلیسی:' : 'English Title:'}</label>
                <input
                  type="text"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. Advanced SOC Operations"
                  className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white focus:outline-none focus:border-[#0a84ff]"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">{isFa ? 'دسته‌بندی:' : 'Category:'}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white focus:outline-none cursor-pointer"
                >
                  <option value="architecture">{isFa ? 'معماری و SVA' : 'Architecture & SVA'}</option>
                  <option value="health_logs">{isFa ? 'عیب‌یابی و سلامت' : 'Health & Diagnostics'}</option>
                  <option value="radar_ingest">{isFa ? 'رادار و جریان لاگ' : 'Telemetry & Ingest'}</option>
                  <option value="agents_gateway">{isFa ? 'ایجنت‌ها و درگاه' : 'Agents & Gateway'}</option>
                  <option value="tools_security">{isFa ? 'ابزارها و امنیت' : 'Security & Utilities'}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">{isFa ? 'آیکون نمادین:' : 'Symbolic Icon:'}</label>
                <select
                  value={newIconName}
                  onChange={(e) => setNewIconName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white focus:outline-none cursor-pointer"
                >
                  {Object.keys(AVAILABLE_ICONS).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] text-white/60 block mb-1">{isFa ? 'توضیحات کوتاه:' : 'Short Description:'}</label>
                <input
                  type="text"
                  value={newDescFa}
                  onChange={(e) => setNewDescFa(e.target.value)}
                  placeholder={isFa ? 'توضیح هدف و کاربرد این ماژول در سیستم...' : 'Module purpose and usage...'}
                  className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white focus:outline-none focus:border-[#0a84ff]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" className="apple-btn-primary text-xs px-4 py-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{isFa ? 'ثبت و افزودن به سامانه' : 'Save & Register Module'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div className="px-5 py-2.5 bg-[#17181e] border-b border-white/[0.06] flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', fa: 'همه ماژول‌ها', en: 'All' },
              { id: 'architecture', fa: 'معماری', en: 'Arch' },
              { id: 'health_logs', fa: 'عیب‌یابی', en: 'Health' },
              { id: 'radar_ingest', fa: 'رادار', en: 'Radar' },
              { id: 'agents_gateway', fa: 'ایجنت‌ها', en: 'Agents' },
              { id: 'tools_security', fa: 'ابزارها', en: 'Tools' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-white/[0.12] text-white font-semibold'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {isFa ? cat.fa : cat.en}
              </button>
            ))}
          </div>

          <div className="relative w-48 shrink-0">
            <Search className={`w-3.5 h-3.5 text-white/40 absolute top-2 ${isFa ? 'right-2' : 'left-2'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFa ? 'جستجو...' : 'Search...'}
              className={`w-full bg-black/30 border border-white/10 rounded-md py-1 text-xs text-white placeholder-white/30 focus:outline-none ${
                isFa ? 'pr-7 pl-3' : 'pl-7 pr-3'
              }`}
            />
          </div>
        </div>

        {/* Modules List with Move, Toggle, Edit, and Delete */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {filteredModules.map((mod, index) => {
            const IconComponent = AVAILABLE_ICONS[mod.iconName] || Server;
            const isEditing = editingModuleId === mod.id;
            const isDefault = defaultTab === mod.id;

            if (isEditing) {
              return (
                <div key={mod.id} className="p-4 rounded-xl bg-[#22242c] border border-[#0071e3]/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0a84ff]">{isFa ? 'ویرایش ماژول:' : 'Edit Module:'} {mod.titleFa}</span>
                    <button onClick={() => setEditingModuleId(null)} className="text-white/40 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={editTitleFa}
                      onChange={(e) => setEditTitleFa(e.target.value)}
                      placeholder={isFa ? 'عنوان فارسی' : 'Persian Title'}
                      className="bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white"
                    />
                    <input
                      type="text"
                      value={editTitleEn}
                      onChange={(e) => setEditTitleEn(e.target.value)}
                      placeholder={isFa ? 'عنوان انگلیسی' : 'English Title'}
                      className="bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white"
                    />
                    <input
                      type="text"
                      value={editBadge}
                      onChange={(e) => setEditBadge(e.target.value)}
                      placeholder={isFa ? 'برچسب (Badge)' : 'Badge Label'}
                      className="bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white"
                    />
                    <select
                      value={editIconName}
                      onChange={(e) => setEditIconName(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white"
                    >
                      {Object.keys(AVAILABLE_ICONS).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={editDescFa}
                        onChange={(e) => setEditDescFa(e.target.value)}
                        placeholder={isFa ? 'توضیحات' : 'Description'}
                        className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingModuleId(null)}
                      className="apple-btn-secondary text-xs"
                    >
                      {isFa ? 'انصراف' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(mod.id)}
                      className="apple-btn-primary text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isFa ? 'ذخیره تغییرات' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              );
            }

            const isDragging = draggedId === mod.id;
            const isDragOver = dragOverId === mod.id && draggedId !== mod.id;

            return (
              <div 
                key={mod.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, mod.id)}
                onDragOver={(e) => handleDragOver(e, mod.id)}
                onDrop={(e) => handleDrop(e, mod.id)}
                onDragEnd={handleDragEnd}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 select-none ${
                  isDragging
                    ? 'opacity-40 scale-[0.99] border-dashed border-[#0a84ff] bg-[#0a84ff]/10 shadow-lg'
                    : isDragOver
                    ? 'border-[#0a84ff] ring-2 ring-[#0a84ff]/50 bg-[#0a84ff]/15 scale-[1.01]'
                    : mod.isEnabled 
                    ? 'bg-[#1c1d23] border-white/[0.08] hover:border-white/[0.16]' 
                    : 'bg-black/20 border-white/[0.03] opacity-50'
                }`}
              >
                {/* Left: Drag Handle, Reorder & Identity */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Drag Handle Grip */}
                  <div
                    className="p-1 rounded text-white/30 hover:text-[#0a84ff] hover:bg-white/[0.06] cursor-grab active:cursor-grabbing transition shrink-0"
                    title={isFa ? 'برای تغییر چیدمان بکشید و رها کنید (Drag & Drop)' : 'Drag and drop to reorder'}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Reorder Buttons (Move Up / Down) */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-white/[0.1] text-white/40 hover:text-white disabled:opacity-20 transition cursor-pointer"
                      title={isFa ? 'انتقال به بالا' : 'Move Up'}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === modules.length - 1}
                      className="p-0.5 rounded hover:bg-white/[0.1] text-white/40 hover:text-white disabled:opacity-20 transition cursor-pointer"
                      title={isFa ? 'انتقال به پایین' : 'Move Down'}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className={`p-2 rounded-lg shrink-0 ${
                    mod.isEnabled ? 'bg-white/[0.08] text-[#0a84ff]' : 'bg-white/[0.03] text-white/30'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Titles */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white/90 truncate">
                        {isFa ? mod.titleFa : mod.titleEn}
                      </span>
                      {mod.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-white/60 tabular-nums">
                          {mod.badge}
                        </span>
                      )}
                      {isDefault && (
                        <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30">
                          {isFa ? 'صفحه پیش‌فرض اولیه' : 'Default Launch'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/40 line-clamp-1 mt-0.5">
                      {isFa ? mod.descriptionFa : mod.descriptionEn}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Set as default tab */}
                  {!isDefault && mod.isEnabled && (
                    <button
                      onClick={() => onUpdateDefaultTab(mod.id)}
                      className="text-[10px] text-white/50 hover:text-[#30d158] px-2 py-0.5 rounded hover:bg-white/[0.06] transition"
                      title={isFa ? 'تنظیم به عنوان صفحه پیش‌فرض شروع برنامه' : 'Set as default startup screen'}
                    >
                      {isFa ? 'پیش‌فرض شود' : 'Set Default'}
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => handleStartEdit(mod)}
                    className="p-1.5 rounded-md hover:bg-white/[0.08] text-white/50 hover:text-white transition cursor-pointer"
                    title={isFa ? 'ویرایش عنوان و مشخصات' : 'Edit labels'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Enable / Disable visibility */}
                  <button
                    onClick={() => handleToggleEnable(mod.id)}
                    className={`p-1.5 rounded-md transition cursor-pointer ${
                      mod.isEnabled 
                        ? 'text-[#30d158] hover:bg-[#30d158]/10' 
                        : 'text-white/30 hover:bg-white/[0.08]'
                    }`}
                    title={mod.isEnabled ? (isFa ? 'پنهان‌سازی از منوها' : 'Hide from menus') : (isFa ? 'فعال‌سازی در منوها' : 'Show in menus')}
                  >
                    {mod.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete (custom modules only) */}
                  {mod.isCustom && (
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 rounded-md hover:bg-[#ff453a]/20 text-white/40 hover:text-[#ff453a] transition cursor-pointer"
                      title={isFa ? 'حذف دائمی این ماژول سفارشی' : 'Delete custom module'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1f2026] border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 shrink-0">
          <span>{isFa ? 'تمام تغییرات بلافاصله ذخیره شده و در منو و سایدبار اعمال می‌گردند.' : 'All changes are automatically saved to your workspace.'}</span>
          <button
            onClick={onClose}
            className="apple-btn-primary px-5 py-1.5 text-xs"
          >
            {isFa ? 'بستن پنل و ذخیره' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
