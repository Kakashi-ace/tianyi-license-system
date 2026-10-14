import React from 'react';
import { Copy, Check, Trash2, PowerOff, Edit3, Save, X, Ban, ShieldCheck } from 'lucide-react';

export default function UserTableRow({
  user: u,
  copiedHwid,
  onCopy,
  editingId,
  editingRemark,
  setEditingId,
  setEditingRemark,
  onSaveRemark,
  onKick,
  onDelete,
  onBlacklist,
  onUnblock
}) {
  const ips = (u.ip_address || '').split(',').map(s => s.trim()).filter(Boolean);
  const primaryIp = ips[0] || '-';
  const hasExtraIps = ips.length > 1;

  return (
    <tr className={`transition border-b border-slate-100 last:border-b-0 ${
      u.is_blacklisted ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'
    }`}>
      <td className="py-3 px-3.5 whitespace-nowrap">
        {u.is_blacklisted ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              <span>已封禁</span>
            </span>
          </div>
        ) : u.is_online ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>在线</span>
            </span>
          </div>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>离线</span>
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {u.last_active_desc || '离线'}
            </div>
          </div>
        )}
      </td>

      <td className="py-3 px-3.5">
        <div className="flex items-center gap-1">
          <span className="font-mono text-slate-800 font-semibold text-xs truncate max-w-[110px]" title={u.hwid}>
            {u.hwid}
          </span>
          <button
            type="button"
            onClick={() => onCopy(u.hwid)}
            className="text-slate-400 hover:text-blue-600 transition p-0.5"
            title="复制机器码"
          >
            {copiedHwid === u.hwid ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        {u.is_blacklisted && u.blacklist_reason && (
          <div className="text-[10px] text-rose-600 font-medium truncate max-w-[120px] mt-0.5" title={u.blacklist_reason}>
            原因: {u.blacklist_reason}
          </div>
        )}
      </td>

      <td className="py-3 px-3.5">
        {u.card_key ? (
          <div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                {u.license_type || '已激活'}
              </span>
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[90px]" title={u.card_key}>
                {u.card_key}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {u.license_expire_at ? `到期: ${new Date(u.license_expire_at).toLocaleDateString()}` : '永久有效'}
            </div>
          </div>
        ) : u.license_type === 'TRIAL' ? (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ⏳ 试用中
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            免费用户
          </span>
        )}
      </td>

      <td className="py-3 px-3.5">
        <div className="text-slate-800 font-semibold text-xs truncate max-w-[120px]" title={u.client_version}>
          {u.client_version || '2.0 大师旗舰版'}
        </div>
        <div className="text-[10px] text-slate-400 truncate max-w-[120px]" title={u.os_info}>
          {u.os_info || 'Windows'}
        </div>
      </td>

      <td className="py-3 px-3.5">
        <div className="font-mono text-xs text-slate-700 truncate max-w-[100px]" title={u.ip_address}>
          {primaryIp}
        </div>
        {hasExtraIps && (
          <span
            className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-500 border border-slate-200 cursor-help"
            title={`全部 IP: ${u.ip_address}`}
          >
            +{ips.length - 1} 代理
          </span>
        )}
      </td>

      <td className="py-3 px-3.5 whitespace-nowrap">
        <div className="text-slate-800 font-medium text-xs">
          {u.last_heartbeat_at ? new Date(u.last_heartbeat_at).toLocaleTimeString() : '-'}
        </div>
        <div className="text-[10px] text-slate-400">
          首次: {u.first_seen_at ? new Date(u.first_seen_at).toLocaleDateString() : '-'}
        </div>
      </td>

      <td className="py-3 px-3.5">
        {editingId === u.id ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingRemark}
              onChange={e => setEditingRemark(e.target.value)}
              className="px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none w-24"
            />
            <button onClick={() => onSaveRemark(u.id)} className="text-blue-600 hover:text-blue-800 p-0.5">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => { setEditingId(u.id); setEditingRemark(u.remark || ''); }}
            className="flex items-center gap-1 cursor-pointer text-slate-600 hover:text-blue-600 group"
          >
            <span className="text-[11px] truncate max-w-[90px]">{u.remark || '添加备注'}</span>
            <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
          </div>
        )}
      </td>

      <td className="py-3 px-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          {u.is_blacklisted ? (
            <button
              type="button"
              onClick={() => onUnblock(u.hwid)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition border border-emerald-200 active:scale-95"
              title="解除黑名单封禁"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBlacklist(u.hwid)}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition border border-rose-200 active:scale-95"
              title="拉黑封禁该设备"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onKick(u.id, u.hwid)}
            disabled={u.is_blacklisted}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition disabled:opacity-30 border border-slate-200/60 active:scale-95"
            title="强制标记离线"
          >
            <PowerOff className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(u.id, u.hwid)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200/60 active:scale-95"
            title="彻底删除设备记录"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
