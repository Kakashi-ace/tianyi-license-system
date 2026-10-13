import React from 'react';
import { Copy, Check, Trash2, PowerOff, Edit3, Save, X } from 'lucide-react';

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
  onDelete
}) {
  return (
    <tr className="hover:bg-slate-50/80 transition">
      <td className="py-3 px-4 whitespace-nowrap">
        {u.is_online ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>在线</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>离线 ({u.last_active_desc})</span>
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-slate-800 font-semibold max-w-[130px] truncate" title={u.hwid}>
            {u.hwid}
          </span>
          <button
            onClick={() => onCopy(u.hwid)}
            className="text-slate-400 hover:text-blue-600 transition"
            title="复制机器码"
          >
            {copiedHwid === u.hwid ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
      <td className="py-3 px-4">
        {u.card_key ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                👑 {u.license_type || '已激活'}
              </span>
              <span className="font-mono text-[11px] text-slate-700">{u.card_key}</span>
            </div>
            {u.license_expire_at && (
              <div className="text-[10px] text-slate-400">
                到期: {new Date(u.license_expire_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : u.license_type === 'TRIAL' ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ⏳ 免费试用中
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            🆓 未购卡密 免费用户
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="text-slate-800 font-semibold">{u.client_version || '2.0 大师旗舰版'}</div>
        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{u.os_info || 'Windows'}</div>
      </td>
      <td className="py-3 px-4 font-mono text-slate-600">{u.ip_address || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="text-slate-800 font-medium">
          {u.last_heartbeat_at ? new Date(u.last_heartbeat_at).toLocaleTimeString() : '-'}
        </div>
        <div className="text-[10px] text-slate-400">
          首次: {u.first_seen_at ? new Date(u.first_seen_at).toLocaleDateString() : '-'}
        </div>
      </td>
      <td className="py-3 px-4">
        {editingId === u.id ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingRemark}
              onChange={e => setEditingRemark(e.target.value)}
              className="px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none w-28"
            />
            <button onClick={() => onSaveRemark(u.id)} className="text-blue-600 hover:text-blue-800">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => { setEditingId(u.id); setEditingRemark(u.remark || ''); }}
            className="flex items-center gap-1 cursor-pointer text-slate-600 hover:text-blue-600 group"
          >
            <span className="text-[11px] truncate max-w-[100px]">{u.remark || '点击添加备注'}</span>
            <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition" />
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onKick(u.id)}
            className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
            title="强制标记离线"
          >
            <PowerOff className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
          </button>
          <button
            onClick={() => onDelete(u.id)}
            className="px-2 py-1 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
            title="删除记录"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
