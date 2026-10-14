import React, { useState } from 'react';
import { X, Rocket, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { publishVersion } from '../versionApi';

export default function VersionModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    version: '',
    build_number: '',
    channel: 'stable',
    title: '',
    changelog: '',
    download_url: '',
    file_sha256: '',
    file_size: '',
    force_update: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.version.trim() || !formData.build_number || !formData.download_url.trim() || !formData.title.trim()) {
      setErrorMsg('请填写完整的版本号、构建号、标题与下载链接');
      return;
    }

    try {
      setSubmitting(true);
      const res = await publishVersion(formData);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMsg(res.message || '发布失败');
      }
    } catch (err) {
      setErrorMsg('网络请求异常: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">一键发布新版本</h3>
              <p className="text-xs text-slate-500 font-medium">推送至全网客户端，支持强制阻断自更新</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">版本号 (Semantic)</label>
              <input
                type="text"
                placeholder="例如: 1.0.1"
                value={formData.version}
                onChange={e => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">构建号 (Build Number)</label>
              <input
                type="number"
                placeholder="例如: 101 (递增数字)"
                value={formData.build_number}
                onChange={e => setFormData({ ...formData, build_number: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">发布渠道</label>
              <select
                value={formData.channel}
                onChange={e => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium"
              >
                <option value="stable">Stable 正式稳定版</option>
                <option value="beta">Beta 公测体验版</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">文件大小 (字节/Bytes 可选)</label>
              <input
                type="number"
                placeholder="如: 18452090"
                value={formData.file_size}
                onChange={e => setFormData({ ...formData, file_size: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">更新公告标题</label>
            <input
              type="text"
              placeholder="例如: 天弈 AI 1.0.1 核心算法与高刷悬浮条体验升级"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">安装包/更新包直接下载直链 (URL)</label>
            <input
              type="url"
              placeholder="https://.../Xiangqi-update-latest.jar 或 .exe"
              value={formData.download_url}
              onChange={e => setFormData({ ...formData, download_url: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">SHA-256 完整性校验散列 (可选)</label>
            <input
              type="text"
              placeholder="用于客户端自动校验下载文件防篡改与完整性"
              value={formData.file_sha256}
              onChange={e => setFormData({ ...formData, file_sha256: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">更新日志 (Changelog)</label>
            <textarea
              rows={4}
              placeholder="1. 修复连续对局棋局取反异常&#10;2. 增加思考进度条与悬浮条对齐&#10;3. 增强全屏游戏穿透稳定性"
              value={formData.changelog}
              onChange={e => setFormData({ ...formData, changelog: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none leading-relaxed font-sans"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">强制全网更新 (Mandatory Update)</span>
              </div>
              <p className="text-[11px] text-slate-500">开启后客户端在启动时必须先更新并重启，不可跳过或取消</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.force_update}
                onChange={e => setFormData({ ...formData, force_update: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/25 flex items-center space-x-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? '正在发布...' : '确认发布并推送'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
