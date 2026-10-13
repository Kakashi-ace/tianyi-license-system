import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import { fetchUsers, updateUserRemark, kickUser, deleteUser } from '../api';
import UserStatCards from './UserStatCards';
import UserTableRow from './UserTableRow';

export default function UserMonitor() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [licenseType, setLicenseType] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, todayActiveUsers: 0, activatedUsers: 0, freeUsers: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingRemark, setEditingRemark] = useState('');
  const [copiedHwid, setCopiedHwid] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetchUsers({ page, limit: 15, keyword, status, licenseType })
      .then(res => {
        if (res.success) {
          setUsers(res.users);
          setTotal(res.total);
          if (res.stats) setStats(res.stats);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    let timer;
    if (autoRefresh) {
      timer = setInterval(loadData, 15000);
    }
    return () => clearInterval(timer);
  }, [page, status, licenseType, autoRefresh]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHwid(text);
    setTimeout(() => setCopiedHwid(''), 2000);
  };

  const handleSaveRemark = async (id) => {
    await updateUserRemark(id, editingRemark);
    setEditingId(null);
    loadData();
  };

  const handleKick = async (id) => {
    if (!window.confirm('确认强制标记该用户设备为离线状态？')) return;
    await kickUser(id);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认彻底删除该设备记录？下次启动软件将重新以新用户登记。')) return;
    await deleteUser(id);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>全量终端用户监控</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            无论是否购买卡密，只要使用软件即自动识别纳入管理，实时掌控活跃度与在线状态
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>15s 实时在线轮询</span>
          </label>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <UserStatCards stats={stats} />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadData()}
            placeholder="搜索机器码 / 卡密 / 备注 / IP..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">全部在线状态</option>
          <option value="ONLINE">🟢 仅看在线</option>
          <option value="OFFLINE">⚪ 仅看离线</option>
        </select>
        <select
          value={licenseType}
          onChange={e => setLicenseType(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">全部授权状态</option>
          <option value="ACTIVATED">👑 已购商业卡密</option>
          <option value="TRIAL">⏳ 免费试用中</option>
          <option value="FREE">🆓 未购卡密 免费用户</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          搜索筛选
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                <th className="py-3 px-4">在线状态</th>
                <th className="py-3 px-4">终端机器码 (HWID)</th>
                <th className="py-3 px-4">授权卡密状态</th>
                <th className="py-3 px-4">客户端版本与系统</th>
                <th className="py-3 px-4">网络 IP</th>
                <th className="py-3 px-4">最近活跃 / 首次使用</th>
                <th className="py-3 px-4">管理员备注</th>
                <th className="py-3 px-4 text-right">操作管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    暂无符合条件的终端用户数据
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <UserTableRow
                    key={u.id}
                    user={u}
                    copiedHwid={copiedHwid}
                    onCopy={handleCopy}
                    editingId={editingId}
                    editingRemark={editingRemark}
                    setEditingId={setEditingId}
                    setEditingRemark={setEditingRemark}
                    onSaveRemark={handleSaveRemark}
                    onKick={handleKick}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>共 {total} 位终端用户</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              上一页
            </button>
            <span>第 {page} 页</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 15 >= total}
              className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
