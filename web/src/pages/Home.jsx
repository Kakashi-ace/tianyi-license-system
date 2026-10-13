import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageCircle, Copy, Check, Sparkles, ExternalLink, Zap, Lock, Cpu, Clock, Award } from 'lucide-react';
import { fetchPublicInfo } from '../api';

export default function Home({ onNavigateLogin }) {
  const [data, setData] = useState({ contacts: {}, packages: [] });
  const [copiedKey, setCopiedKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicInfo()
      .then(res => {
        if (res.success) setData(res);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E4EBE7] flex flex-col">
      <header className="border-b border-[#1E2530] bg-[#0E1117]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-400 flex items-center justify-center font-black text-xl text-amber-300 shadow-lg shadow-emerald-900/30">
              弈
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wide text-white">天弈 AI</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">PRO 2.0</span>
              </div>
              <p className="text-xs text-slate-400">官方商业化卡密授权服务平台</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-[#2A3444] text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/5 transition flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>管理后台登录</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full space-y-16">
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pikafish 满血超算算力 · 毫秒级多端自动连线</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            天弈 AI 官方卡密专属通道
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            购买卡密请添加下方客服联系方式，支持单机独享绑定、实时开通下发激活码。软件内输入卡密即刻尊享顶级大师算力与全自动下棋。
          </p>
        </section>

        <section className="bg-gradient-to-b from-[#111620] to-[#0D1017] border border-[#232B3B] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1E2530]">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                <MessageCircle className="w-4 h-4" />
                <span>官方客服与购买咨询通道</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">添加客服联系方式直接购卡</h2>
              <p className="text-xs text-slate-400 mt-1">
                {data.contacts.notice || '选定套餐后，添加下方客服微信或QQ即可快速获取专属授权卡密。'}
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>一人一码 · 正版设备绑定 · 售后无忧</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-[#151A24] border border-[#252E3E] rounded-xl p-5 flex items-center justify-between hover:border-emerald-500/40 transition">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
                  微
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">客服微信 (推荐)</div>
                  <div className="text-lg font-mono font-bold text-white tracking-wider">
                    {data.contacts.wechat || 'TianYi_AI_888'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy(data.contacts.wechat || 'TianYi_AI_888', 'wechat')}
                className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                {copiedKey === 'wechat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'wechat' ? '已复制' : '复制微信号'}</span>
              </button>
            </div>

            <div className="bg-[#151A24] border border-[#252E3E] rounded-xl p-5 flex items-center justify-between hover:border-blue-500/40 transition">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xl">
                  企
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">客服 QQ</div>
                  <div className="text-lg font-mono font-bold text-white tracking-wider">
                    {data.contacts.qq || '3517427283'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy(data.contacts.qq || '3517427283', 'qq')}
                className="px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                {copiedKey === 'qq' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'qq' ? '已复制' : '复制QQ号'}</span>
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">OFFICIAL PACKAGES</div>
            <h2 className="text-3xl font-black text-white">官方授权套餐体系</h2>
            <p className="text-xs text-slate-400">仅展示各套餐时长与特权，选好套餐后添加上方客服获取专属卡密即可激活</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-[#0E1219] border border-[#212836] rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20 transition relative group"
              >
                {pkg.badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                    {pkg.badge}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                    <div className="text-xs text-slate-400 mt-1">有效期 {pkg.duration_days >= 3650 ? '终身永久' : `${pkg.duration_days} 天`}</div>
                  </div>
                  <div className="flex items-baseline space-x-1 border-b border-[#1E2530] pb-4">
                    <span className="text-3xl font-extrabold text-emerald-400 font-mono">{pkg.price}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
                    {pkg.description || '解锁天弈AI满血算力，享受全自动棋盘捕捉与极速走棋。'}
                  </p>
                </div>
                <div className="pt-6">
                  <button
                    onClick={() => handleCopy(data.contacts.wechat || 'TianYi_AI_888', 'wechat')}
                    className="w-full py-2.5 rounded-xl bg-[#171E2B] hover:bg-emerald-500/20 border border-[#2A3548] hover:border-emerald-500/50 text-white text-xs font-bold transition flex items-center justify-center space-x-2"
                  >
                    <span>联系客服购买此套餐</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#1E2530]">
          <div className="bg-[#0E1117] p-5 rounded-xl border border-[#1A212B] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-white">1. 一键全自动下棋</h4>
            <p className="text-xs text-slate-400">无需繁琐调参，按下 F10 即可自动识别棋盘对局并执行最佳着法。</p>
          </div>
          <div className="bg-[#0E1117] p-5 rounded-xl border border-[#1A212B] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-white">2. Pikafish 超算底座</h4>
            <p className="text-xs text-slate-400">内嵌 2026 最新满血神经网络开局库与残局库，深度算力远超人类大师。</p>
          </div>
          <div className="bg-[#0E1117] p-5 rounded-xl border border-[#1A212B] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-white">3. 一机一码终身保障</h4>
            <p className="text-xs text-slate-400">云端 TiDB 与高可用后端保障激活状态，支持电脑硬件换绑与续期。</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1E2530] bg-[#0E1117] py-6 text-center text-xs text-slate-500">
        <p>© 2026 天弈 AI (TianYi AI). 保留所有权利 · 官方卡密管理与授权系统</p>
      </footer>
    </div>
  );
}
