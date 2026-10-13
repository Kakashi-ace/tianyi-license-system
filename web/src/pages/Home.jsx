import React, { useState, useEffect } from 'react';
import { Copy, Check, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-500 flex items-center justify-center font-black text-xl text-white shadow-md shadow-blue-600/20">
              弈
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wide text-slate-900">天弈 AI</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">PRO 2.0</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center space-x-1.5 shadow-sm bg-white"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>管理后台登录</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full space-y-12">
        <section className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            天弈 AI 官方卡密
          </h1>
          <p className="text-sm text-slate-600">
            添加客服联系方式获取专属卡密，软件内直接激活使用。
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between hover:border-slate-300 transition">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-800 font-bold text-lg">
                  微
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">客服微信</div>
                  <div className="text-base font-mono font-bold text-slate-900 tracking-wider">
                    {data.contacts.wechat || 'TianYi_AI_888'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy(data.contacts.wechat || 'TianYi_AI_888', 'wechat')}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              >
                {copiedKey === 'wechat' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'wechat' ? '已复制' : '复制'}</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between hover:border-blue-300 transition">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 font-bold text-lg">
                  企
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">客服 QQ</div>
                  <div className="text-base font-mono font-bold text-slate-900 tracking-wider">
                    {data.contacts.qq || '3517427283'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCopy(data.contacts.qq || '3517427283', 'qq')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              >
                {copiedKey === 'qq' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'qq' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">官方套餐</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition relative group shadow-sm"
              >
                {pkg.badge && (
                  <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {pkg.badge}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{pkg.duration_days >= 3650 ? '永久有效' : `${pkg.duration_days} 天`}</div>
                  </div>
                  <div className="flex items-baseline space-x-1 border-b border-slate-100 pb-3">
                    <span className="text-2xl font-extrabold text-blue-600 font-mono">{pkg.price}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                    {pkg.description}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => handleCopy(data.contacts.wechat || 'TianYi_AI_888', 'wechat')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>{copiedKey === 'wechat' ? '已复制微信' : '获取卡密'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 天弈 AI. 官方卡密授权系统</p>
      </footer>
    </div>
  );
}
