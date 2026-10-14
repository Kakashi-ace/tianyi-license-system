import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import { fetchUsers, updateUserRemark, kickUser, deleteUser, blacklistDevice, unblockDevice } from '../api';
import UserStatCards from './UserStatCards';
import UserTableRow from './UserTableRow';
import ActionModal from './ActionModal';

export default function UserMonitor() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [licenseType, setLicenseType] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, todayActiveUsers: 0, activatedUsers: 0, freeUsers: 0, blacklistedUsers: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingRemark, setEditingRemark] = useState('');
  const [copiedHwid, setCopiedHwid] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

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

  const handleKick = (id, hwid) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: '强制标记设备离线',
      targetBadge: `机器码: ${hwid}`,
      description: '确定将该设备强制标记为离线状态吗？客户端将在下一次心跳周期重新连线上报。',
      confirmText: '强制离线',
      onConfirm: async () => {
        await kickUser(id);
        setModalConfig(null);
        loadData();
      }
    });
  };

  const handleDelete = (id, hwid) => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: '彻底删除设备记录',
      targetBadge: `机器码: ${hwid}`,
      description: '确定要从数据库中彻底清除该设备登记吗？下次启动软件将重新以新用户登记入库。',
      confirmText: '彻底删除',
      onConfirm: async () => {
        await deleteUser(id);
        setModalConfig(null);
        loadData();
      }
    });
  };

  const handleBlacklist = (hwid) => {
    setModalConfig({
      isOpen: true,
      type: 'danger',
      title: '拉黑并封禁该终端设备',
      targetBadge: `机器码: ${hwid}`,
      description: '设备被封禁后，其发起的一切激活、心跳与推演请求将被直接阻断拦截，客户端将强制停止对局并锁定。',
      inputConfig: {
        label: '封禁原因说明',
        placeholder: '请输入封禁原因...',
        defaultValue: '违规多开或恶意破解',
        presets: ['违规多开', '恶意破解', '倒卖卡密', '异常高频']
      },
      confirmText: '立即封禁',
      onConfirm: async (reason) => {
        await blacklistDevice(hwid, reason || '违规使用已被系统封禁');
        setModalConfig(null);
        loadData();
      }
    });
  };

  const handleUnblock = (hwid) => {
    setModalConfig({
      isOpen: true,
      type: 'info',
      title: '解除设备黑名单封禁',
      targetBadge: `机器码: ${hwid}`,
      description: '确定解除对该设备的黑名单拦截吗？解除后该设备将恢复正常使用商业授权与免费试用权限。',
      confirmText: '恢复正常使用',
      onConfirm: async () => {
        await unblockDevice(hwid);
        setModalConfig(null);
        loadData();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>全量终端用户监控与设备安全风控</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            实时掌控设备在线状态、一卡一机绑定与封禁黑名单管理，保障商业授权安全
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
          <option value="ALL">全部设备状态</option>
          <option value="ONLINE">🟢 仅看在线</option>
          <option value="OFFLINE">⚪ 仅看离线</option>
          <option value="BLACKLISTED">🚫 仅看封禁设备</option>
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
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold">
                <th className="py-3 px-3.5 w-24">状态</th>
                <th className="py-3 px-3.5 w-36">终端设备 (HWID)</th>
                <th className="py-3 px-3.5 w-44">授权与卡密</th>
                <th className="py-3 px-3.5 w-36">客户端与系统</th>
                <th className="py-3 px-3.5 w-32">网络 IP</th>
                <th className="py-3 px-3.5 w-28">活跃时间</th>
                <th className="py-3 px-3.5 min-w-[100px]">管理员备注</th>
                <th className="py-3 px-3.5 w-28 text-right">操作</th>
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
                    onBlacklist={handleBlacklist}
                    onUnblock={handleUnblock}
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

      <ActionModal {...modalConfig} onClose={() => setModalConfig(null)} />
    </div>
  );
}
