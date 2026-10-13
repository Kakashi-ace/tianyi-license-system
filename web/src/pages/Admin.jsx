import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Layers,
  Settings,
  History,
  LayoutDashboard,
  Plus,
  RefreshCw,
  LogOut,
  Search,
  Copy,
  Check,
  Trash2,
  Unlink,
  CalendarPlus,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  fetchDashboard,
  fetchCards,
  generateCards,
  unbindCard,
  extendCard,
  deleteCard,
  fetchPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
  fetchSystemConfig,
  saveSystemConfig,
  fetchLogs
} from '../api';

export default function Admin({ onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [recentLogs, setRecentLogs] = useState([]);
  const [cards, setCards] = useState([]);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [cardsPage, setCardsPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [packages, setPackages] = useState([]);
  const [configs, setConfigs] = useState({});
  const [logs, setLogs] = useState([]);
  const [copiedKey, setCopiedKey] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(5);
  const [genPackageId, setGenPackageId] = useState('');
  const [genCustomDays, setGenCustomDays] = useState(30);
  const [genNote, setGenNote] = useState('');
  const [newCardList, setNewCardList] = useState([]);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgForm, setPkgForm] = useState({ id: null, name: '', price: '¥39.9', duration_days: 30, description: '', badge: '', sort_order: 1, is_active: 1 });
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  const loadDashboard = () => {
    fetchDashboard().then(res => {
      if (res.success) {
        setStats(res.stats);
        setRecentLogs(res.recentLogs);
      }
    });
  };

  const loadCards = () => {
    fetchCards({ page: cardsPage, limit: 15, keyword: searchKeyword, status: statusFilter }).then(res => {
      if (res.success) {
        setCards(res.cards);
        setCardsTotal(res.total);
      }
    });
  };

  const loadPackages = () => {
    fetchPackagesAdmin().then(res => {
      if (res.success) setPackages(res.packages);
    });
  };

  const loadConfig = () => {
    fetchSystemConfig().then(res => {
      if (res.success) setConfigs(res.configs);
    });
  };

  const loadAuditLogs = () => {
    fetchLogs(1, 30).then(res => {
      if (res.success) setLogs(res.logs);
    });
  };

  useEffect(() => {
    loadDashboard();
    loadPackages();
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'cards') loadCards();
    if (tab === 'packages') loadPackages();
    if (tab === 'settings') loadConfig();
    if (tab === 'logs') loadAuditLogs();
  }, [tab, cardsPage, statusFilter]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleUnbind = async (id) => {
    if (!window.confirm('确认解绑此卡密的设备机器码？解绑后客户可在新电脑重新绑定。')) return;
    const res = await unbindCard(id);
    if (res.success) loadCards();
  };

  const handleExtend = async (id) => {
    const days = window.prompt('请输入需要延长的天数：', '30');
    if (!days || isNaN(days)) return;
    const res = await extendCard(id, parseInt(days, 10));
    if (res.success) {
      alert(res.message);
      loadCards();
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('确定要彻底删除此卡密吗？')) return;
    const res = await deleteCard(id);
    if (res.success) loadCards();
  };

  const handleGenerateCards = async (e) => {
    e.preventDefault();
    const res = await generateCards({
      count: genCount,
      packageId: genPackageId ? parseInt(genPackageId, 10) : null,
      customDays: genPackageId ? null : genCustomDays,
      note: genNote
    });
    if (res.success) {
      setNewCardList(res.cards);
      loadCards();
      loadDashboard();
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (pkgForm.id) {
      await updatePackage(pkgForm.id, pkgForm);
    } else {
      await createPackage(pkgForm);
    }
    setShowPkgModal(false);
    loadPackages();
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('确定要删除此套餐吗？已生成的卡密不受影响。')) return;
    await deletePackage(id);
    loadPackages();
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMsg('');
    const res = await saveSystemConfig(configs);
    setConfigSaving(false);
    if (res.success) {
      setConfigMsg('客服联系方式与系统设置已实时保存！客户端与前台瞬间同步。');
      setTimeout(() => setConfigMsg(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/20">
              弈
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900">天弈 AI 卡密运维中枢</span>
              <span className="text-[10px] ml-2 text-slate-400 font-mono">TiDB Cloud + Render</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-500">管理员: <strong className="text-blue-700">admin</strong></span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-56 shrink-0 space-y-1.5">
          <button
            onClick={() => setTab('dashboard')}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition ${
              tab === 'dashboard' ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>数据大屏看板</span>
          </button>
          <button
            onClick={() => setTab('cards')}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition ${
              tab === 'cards' ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>卡密资产管理</span>
          </button>
          <button
            onClick={() => setTab('packages')}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition ${
              tab === 'packages' ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>套餐价格配置</span>
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition ${
              tab === 'settings' ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>客服与系统公告</span>
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition ${
              tab === 'logs' ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>激活审计日志</span>
          </button>
        </aside>

        <main className="flex-1 space-y-6 min-w-0">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold">总生成卡密</div>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-2">{stats.totalCards || 0}</div>
                  <div className="text-[10px] text-slate-400 mt-1">云端 TiDB 存储归档</div>
                </div>
                <div className="bg-white border border-blue-200 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs text-blue-700 font-semibold">已激活使用</div>
                  <div className="text-3xl font-black text-blue-700 font-mono mt-2">{stats.activatedCards || 0}</div>
                  <div className="text-[10px] text-blue-600 mt-1">正版客户设备在线</div>
                </div>
                <div className="bg-white border border-indigo-200 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs text-indigo-700 font-semibold">库存未激活</div>
                  <div className="text-3xl font-black text-indigo-700 font-mono mt-2">{stats.unusedCards || 0}</div>
                  <div className="text-[10px] text-indigo-600 mt-1">待售与下发卡密池</div>
                </div>
                <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs text-amber-700 font-semibold">今日激活数</div>
                  <div className="text-3xl font-black text-amber-700 font-mono mt-2">{stats.todayActivations || 0}</div>
                  <div className="text-[10px] text-amber-600 mt-1">今日新增尊享会员</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">最近激活与验证动态</h3>
                  <button onClick={loadDashboard} className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>刷新</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-3">动作</th>
                        <th className="py-2.5 px-3">卡密</th>
                        <th className="py-2.5 px-3">设备机器码</th>
                        <th className="py-2.5 px-3">状态</th>
                        <th className="py-2.5 px-3">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action === 'ACTIVATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{log.card_key || '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 max-w-[180px] truncate">{log.machine_id || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className={log.status === 'SUCCESS' ? 'text-blue-700 font-semibold' : 'text-rose-600 font-semibold'}>{log.message}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{log.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'cards' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="搜索卡密 / 机器码 / 备注..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadCards()}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs text-slate-900 px-3 py-2 rounded-xl focus:outline-none"
                  >
                    <option value="ALL">全部状态</option>
                    <option value="UNUSED">仅未激活</option>
                    <option value="ACTIVATED">仅已激活</option>
                    <option value="EXPIRED">仅已过期</option>
                  </select>
                  <button onClick={loadCards} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700 transition">
                    搜索
                  </button>
                </div>
                <button
                  onClick={() => {
                    setNewCardList([]);
                    setShowGenModal(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>批量生成卡密</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-3 px-4">卡密代码</th>
                        <th className="py-3 px-4">所属套餐</th>
                        <th className="py-3 px-4">时长</th>
                        <th className="py-3 px-4">状态</th>
                        <th className="py-3 px-4">绑定设备机器码</th>
                        <th className="py-3 px-4">到期时间</th>
                        <th className="py-3 px-4 text-right">操作管理</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cards.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center space-x-2">
                            <span>{c.card_key}</span>
                            <button
                              onClick={() => handleCopy(c.card_key, c.id)}
                              className="text-slate-400 hover:text-blue-600 transition"
                            >
                              {copiedKey === c.id ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{c.package_name || '-'}</td>
                          <td className="py-3 px-4 text-slate-600 font-mono">{c.duration_days >= 3650 ? '永久' : `${c.duration_days}天`}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'ACTIVATED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              c.status === 'UNUSED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {c.status === 'ACTIVATED' ? '已激活' : c.status === 'UNUSED' ? '未激活' : '已过期'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 max-w-[140px] truncate">{c.machine_id || '未绑定'}</td>
                          <td className="py-3 px-4 text-slate-600">{c.expire_at || '-'}</td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {c.machine_id && (
                              <button
                                onClick={() => handleUnbind(c.id)}
                                title="解绑设备机器码"
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[11px] font-bold transition"
                              >
                                解绑
                              </button>
                            )}
                            <button
                              onClick={() => handleExtend(c.id)}
                              title="延长到期时间"
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold transition"
                            >
                              续期
                            </button>
                            <button
                              onClick={() => handleDeleteCard(c.id)}
                              title="删除卡密"
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold transition"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white">
                  <span>共 {cardsTotal} 张卡密</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={cardsPage <= 1}
                      onClick={() => setCardsPage(p => p - 1)}
                      className="px-3 py-1 bg-slate-50 rounded border border-slate-200 disabled:opacity-40"
                    >
                      上一页
                    </button>
                    <span>第 {cardsPage} 页</span>
                    <button
                      disabled={cards.length < 15}
                      onClick={() => setCardsPage(p => p + 1)}
                      className="px-3 py-1 bg-slate-50 rounded border border-slate-200 disabled:opacity-40"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'packages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">套餐价格与权益配置</h3>
                  <p className="text-xs text-slate-500">客户端和公开首页将直接拉取展示此处已启用的套餐</p>
                </div>
                <button
                  onClick={() => {
                    setPkgForm({ id: null, name: '', price: '¥39.9', duration_days: 30, description: '', badge: '', sort_order: packages.length + 1, is_active: 1 });
                    setShowPkgModal(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建套餐</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-blue-500 hover:shadow-md transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-slate-900">{pkg.name}</span>
                        {pkg.badge && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-blue-600 font-mono">{pkg.price}</div>
                      <div className="text-xs text-slate-500">有效天数: {pkg.duration_days >= 3650 ? '永久' : `${pkg.duration_days}天`}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{pkg.description || '无详细描述'}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${pkg.is_active ? 'text-blue-700' : 'text-slate-400'}`}>
                        {pkg.is_active ? '● 已启用展示' : '○ 已下架隐藏'}
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            setPkgForm(pkg);
                            setShowPkgModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 text-base">客服联系方式与系统设置</h3>
                <p className="text-xs text-slate-500 mt-1">此处保存的信息将实时推送至客户端软件的卡密激活弹窗与前台购买指引页面。</p>
              </div>

              {configMsg && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{configMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">客服微信号 (软件与前台醒目展示)</label>
                  <input
                    type="text"
                    value={configs.contact_wechat || ''}
                    onChange={(e) => setConfigs({ ...configs, contact_wechat: e.target.value })}
                    placeholder="例如: TianYi_AI_VIP"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">客服 QQ 号</label>
                  <input
                    type="text"
                    value={configs.contact_qq || ''}
                    onChange={(e) => setConfigs({ ...configs, contact_qq: e.target.value })}
                    placeholder="例如: 3517427283"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Telegram 交流群 / 频道 (可选)</label>
                  <input
                    type="text"
                    value={configs.contact_telegram || ''}
                    onChange={(e) => setConfigs({ ...configs, contact_telegram: e.target.value })}
                    placeholder="例如: https://t.me/tianyi_chess"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">购买说明与官方公告</label>
                  <textarea
                    rows={3}
                    value={configs.notice_text || ''}
                    onChange={(e) => setConfigs({ ...configs, notice_text: e.target.value })}
                    placeholder="例如: 购买卡密请直接添加客服微信或QQ，转账后秒发激活码..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">免费试用时长 (默认 1 小时)</label>
                  <input
                    type="number"
                    value={configs.trial_duration_hours || '1'}
                    onChange={(e) => setConfigs({ ...configs, trial_duration_hours: e.target.value })}
                    className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={configSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    {configSaving ? '正在保存...' : '保存客服设置并生效'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'logs' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">系统审计与激活日志流水</h3>
                <button onClick={loadAuditLogs} className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>刷新</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">流水ID</th>
                      <th className="py-2.5 px-3">行为</th>
                      <th className="py-2.5 px-3">卡密</th>
                      <th className="py-2.5 px-3">设备机器码</th>
                      <th className="py-2.5 px-3">IP</th>
                      <th className="py-2.5 px-3">状态/消息</th>
                      <th className="py-2.5 px-3">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{l.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-700">{l.action}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{l.card_key || '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 max-w-[150px] truncate">{l.machine_id || '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{l.ip || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className={l.status === 'SUCCESS' ? 'text-blue-700 font-semibold' : 'text-rose-600 font-semibold'}>{l.message}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{l.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl text-slate-800">
            <h3 className="font-bold text-lg text-slate-900">批量生成新卡密</h3>
            
            {newCardList.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2 rounded-xl">
                  成功生成 {newCardList.length} 张新卡密！请点击一键复制保存：
                </div>
                <div className="max-h-60 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 space-y-1">
                  {newCardList.map((k, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                      <span>{k}</span>
                      <button onClick={() => handleCopy(k, idx)} className="text-slate-400 hover:text-blue-600">
                        {copiedKey === idx ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleCopy(newCardList.join('\n'), 'all')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    {copiedKey === 'all' ? '已复制全部' : '一键复制全部卡密'}
                  </button>
                  <button
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    关闭
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateCards} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">生成张数 (1 ~ 100 张)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={genCount}
                    onChange={(e) => setGenCount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">绑定套餐</label>
                  <select
                    value={genPackageId}
                    onChange={(e) => setGenPackageId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">自定义天数</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.duration_days}天 · {p.price})</option>
                    ))}
                  </select>
                </div>

                {!genPackageId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">自定义有效天数</label>
                    <input
                      type="number"
                      min="1"
                      value={genCustomDays}
                      onChange={(e) => setGenCustomDays(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">备注说明 (可选)</label>
                  <input
                    type="text"
                    placeholder="例如: 客户微信张三购买"
                    value={genNote}
                    onChange={(e) => setGenNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    立即生成
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showPkgModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl text-slate-800">
            <h3 className="font-bold text-lg text-slate-900">{pkgForm.id ? '编辑套餐' : '新建套餐'}</h3>
            <form onSubmit={handleSavePackage} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">套餐名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 月卡"
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">展示价格</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: ¥39.9"
                    value={pkgForm.price}
                    onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">有效天数</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={pkgForm.duration_days}
                    onChange={(e) => setPkgForm({ ...pkgForm, duration_days: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">角标亮点 (可选)</label>
                  <input
                    type="text"
                    placeholder="例如: 热门爆款"
                    value={pkgForm.badge}
                    onChange={(e) => setPkgForm({ ...pkgForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">排序权重</label>
                  <input
                    type="number"
                    value={pkgForm.sort_order}
                    onChange={(e) => setPkgForm({ ...pkgForm, sort_order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">特权说明</label>
                <textarea
                  rows={2}
                  placeholder="例如: 30天不限局数畅玩 · 专享AI深度变招与开局云库"
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pkgActive"
                  checked={Boolean(pkgForm.is_active)}
                  onChange={(e) => setPkgForm({ ...pkgForm, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pkgActive" className="text-xs text-slate-700">在客户端与前台页面启用展示</label>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  保存套餐
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
