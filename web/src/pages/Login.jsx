import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../api';

export default function Login({ onLoginSuccess, onNavigateHome }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入管理员账号与密码');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await loginAdmin(username, password);
      if (res.success && res.token) {
        localStorage.setItem('tianyi_admin_token', res.token);
        localStorage.setItem('tianyi_admin_user', JSON.stringify(res.admin));
        onLoginSuccess();
      } else {
        setError(res.message || '登录失败，请核对账号密码');
      }
    } catch (err) {
      setError('网络请求失败，请检查后端服务连通性: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E4EBE7] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0F131A] border border-[#222A38] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-400 mx-auto flex items-center justify-center font-black text-2xl text-amber-300 shadow-lg shadow-emerald-950/40">
            弈
          </div>
          <h2 className="text-2xl font-black text-white">天弈 AI 卡密管理后台</h2>
          <p className="text-xs text-slate-400">仅限管理员登录 · 掌控全域卡密生成与套餐运维</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">管理员账号</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入管理账号"
                className="w-full pl-10 pr-4 py-2.5 bg-[#171D28] border border-[#263142] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">登录密码</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码"
                className="w-full pl-10 pr-4 py-2.5 bg-[#171D28] border border-[#263142] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <span>{loading ? '正在验证身份...' : '立即登录管理系统'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={onNavigateHome}
            className="text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            ← 返回客户端导购与公开首页
          </button>
        </div>
      </div>
    </div>
  );
}
