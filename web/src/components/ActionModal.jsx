import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ActionModal({
  isOpen,
  type = 'warning',
  title,
  description,
  targetBadge,
  inputConfig,
  confirmText = '确定',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onClose
}) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen && inputConfig) {
      setInputValue(inputConfig.defaultValue || '');
    }
  }, [isOpen, inputConfig]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputConfig) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: ShieldAlert,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
        };
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
        };
      default:
        return {
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border shrink-0 ${theme.iconBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {targetBadge && (
                <div className="mt-1.5 inline-block px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 truncate max-w-full">
                  {targetBadge}
                </div>
              )}
              {description && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              )}
            </div>
          </div>

          {inputConfig && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              {inputConfig.label && (
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {inputConfig.label}
                </label>
              )}
              <input
                type={inputConfig.type || 'text'}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={inputConfig.placeholder || '请输入...'}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {inputConfig.presets && inputConfig.presets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {inputConfig.presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputValue(preset.value || preset)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] text-slate-600 border border-slate-200 transition"
                    >
                      {preset.label || preset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition active:scale-[0.98] disabled:opacity-50 ${theme.btnBg}`}
          >
            {loading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
