import React from 'react';

export default function UserStatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-700 font-bold">实时在线设备</span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
        </div>
        <div className="text-3xl font-black text-blue-700 font-mono mt-2">{stats.onlineUsers || 0}</div>
        <div className="text-[10px] text-blue-500 mt-1">120秒内活跃终端</div>
      </div>
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <span className="text-xs text-slate-500 font-bold">累计终端用户</span>
        <div className="text-3xl font-black text-slate-900 font-mono mt-2">{stats.totalUsers || 0}</div>
        <div className="text-[10px] text-slate-400 mt-1">含未购卡密用户</div>
      </div>
      <div className="bg-white border border-indigo-200 p-4 rounded-2xl shadow-sm">
        <span className="text-xs text-indigo-700 font-bold">今日活跃设备</span>
        <div className="text-3xl font-black text-indigo-700 font-mono mt-2">{stats.todayActiveUsers || 0}</div>
        <div className="text-[10px] text-indigo-500 mt-1">今日心跳活跃终端</div>
      </div>
      <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-sm">
        <span className="text-xs text-amber-700 font-bold">商业授权转化</span>
        <div className="text-3xl font-black text-amber-700 font-mono mt-2">{stats.activatedUsers || 0}</div>
        <div className="text-[10px] text-amber-600 mt-1">未购卡密: {stats.freeUsers || 0} 台</div>
      </div>
      <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-sm">
        <span className="text-xs text-rose-700 font-bold">封禁黑名单</span>
        <div className="text-3xl font-black text-rose-700 font-mono mt-2">{stats.blacklistedUsers || 0}</div>
        <div className="text-[10px] text-rose-500 mt-1">已完全拦截服务</div>
      </div>
    </div>
  );
}
