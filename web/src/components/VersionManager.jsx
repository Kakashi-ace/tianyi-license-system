import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  ShieldAlert,
  Download,
  Hash,
  FileCode2,
  Radio
} from 'lucide-react';
import { fetchVersions, toggleVersionActive, deleteVersion } from '../versionApi';
import VersionModal from './VersionModal';

export default function VersionManager({ onShowActionModal }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchVersions();
      if (res.success) {
        setVersions(res.list || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (v) => {
    const nextState = v.is_active ? 0 : 1;
    await toggleVersionActive(v.id, nextState);
    showToast(nextState ? `已将 ${v.version} 设为全网推送版本` : `已停止推送版本 ${v.version}`);
    loadData();
  };

  const handleDelete = (v) => {
    if (onShowActionModal) {
      onShowActionModal({
        isOpen: true,
        type: 'danger',
        title: '删除版本记录',
        targetBadge: `版本: ${v.version} (Build ${v.build_number})`,
        description: '确定删除此历史版本发布记录吗？已发布的客户端若未下载将无法访问该记录。',
        confirmText: '确认删除',
        onConfirm: async () => {
          await deleteVersion(v.id);
          showToast(`已删除版本 ${v.version}`);
          loadData();
        }
      });
    }
  };

  const activeVer = versions.find(v => v.is_active === 1);

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-base font-black text-slate-900">版本发布与全网推送管理</h2>
            {activeVer && (
              <span className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>全网生效: {activeVer.version} (Build {activeVer.build_number})</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            支持一键发布新版本安装包、设置强制阻断式自更新。客户端启动时将自动识别并更新替换。
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>发布新版本</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {versions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Rocket className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
            <p className="text-xs">暂无任何版本记录，点击上方“发布新版本”开始全网推送</p>
          </div>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                v.is_active === 1
                  ? 'border-blue-400 shadow-md shadow-blue-500/5 ring-1 ring-blue-300'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-black text-slate-900 font-mono">v{v.version}</span>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Build {v.build_number}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {v.channel}
                    </span>
                    {v.force_update === 1 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>强制阻断更新</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        可选更新
                      </span>
                    )}
                    {v.is_active === 1 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span>全网推送中</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-400">
                        已归档未推送
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-800">{v.title}</h3>

                  {v.changelog && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl whitespace-pre-wrap font-sans leading-relaxed">
                      {v.changelog}
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center space-x-1 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded max-w-sm truncate">
                      <span className="text-slate-400 shrink-0">URL:</span>
                      <span className="truncate">{v.download_url}</span>
                      <button
                        onClick={() => handleCopy(v.download_url, `url-${v.id}`)}
                        className="text-slate-400 hover:text-blue-600 shrink-0 ml-1"
                      >
                        {copiedId === `url-${v.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {v.file_size > 0 && (
                      <span className="font-mono">{(v.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{v.download_count || 0} 次更新</span>
                    </span>
                    <span className="text-slate-400">{v.created_at ? v.created_at.slice(0, 16).replace('T', ' ') : ''}</span>
                  </div>
                </div>

                <div className="flex items-center md:flex-col justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(v)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
                      v.is_active === 1
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{v.is_active === 1 ? '停止推送' : '设为推送'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(v)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="删除版本"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <VersionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadData();
        }}
      />
    </div>
  );
}
