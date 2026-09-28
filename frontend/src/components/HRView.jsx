import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  PieChart as PieIcon,
  ShieldAlert,
  Flame,
  UserCheck,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import ConflictBadge from './ConflictBadge';

export default function HRView({ user, onActionTaken }) {
  const [hrPending, setHrPending] = useState([]);
  const [escalatedList, setEscalatedList] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingData, escalatedData, allData, statsData] = await Promise.all([
        api.getHRPending(),
        api.getEscalatedRequests(),
        api.getAllRequests(),
        api.getStats(),
      ]);

      setHrPending(pendingData);
      setEscalatedList(escalatedData);
      setAllRequests(allData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching HR view data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await api.approveRequest(id, 'Final HR Approval Granted');
      await fetchData();
      if (onActionTaken) onActionTaken();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoadingId(id);
      await api.rejectRequest(id, 'Rejected by HR Operations');
      await fetchData();
      if (onActionTaken) onActionTaken();
    } catch (err) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Recharts Data Prep
  const pieData = stats
    ? [
        { name: 'Approved', value: stats.approved, color: '#10b981' },
        { name: 'Manager Pending', value: stats.pendingManager, color: '#f59e0b' },
        { name: 'HR Pending', value: stats.pendingHR, color: '#8b5cf6' },
        { name: 'Auto-Escalated', value: stats.escalated, color: '#f43f5e' },
      ].filter((d) => d.value > 0)
    : [];

  const teamDistribution = [
    {
      team: 'Alpha (Eng)',
      totalLeaves: allRequests.filter((r) => r.teamId === 1).length,
      conflicts: allRequests.filter((r) => r.teamId === 1 && r.hasTeamConflict).length,
    },
    {
      team: 'Beta (Design)',
      totalLeaves: allRequests.filter((r) => r.teamId === 2).length,
      conflicts: allRequests.filter((r) => r.teamId === 2 && r.hasTeamConflict).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HR Executive Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              HR Executive Operations
            </span>
            <span className="text-xs text-slate-400">
              Logged as: <strong className="text-slate-200">{user?.name}</strong> (Chief People Officer)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Final Approval Chain & Company Insights
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect escalated exceptions, sign off on pending leaves, and monitor organizational capacity.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition self-start md:self-auto"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Total Requests</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {stats?.totalRequests ?? 0}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-purple-400 block">HR Pending Sign-off</span>
          <span className="text-2xl font-black text-purple-400 font-mono mt-1 block">
            {stats?.pendingHR ?? 0}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03]">
          <span className="text-[11px] font-medium text-rose-400 block flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Auto-Escalated
          </span>
          <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
            {stats?.escalated ?? 0}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03]">
          <span className="text-[11px] font-medium text-amber-400 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Team Conflicts (&gt;20%)
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            {stats?.conflictCount ?? 0}
          </span>
        </div>
      </div>

      {/* MANDATORY REQUIREMENT: Highlighted "Auto-Escalated Requests" Section */}
      <div className="glass-panel rounded-2xl border-2 border-rose-500/30 overflow-hidden shadow-lg shadow-rose-950/20">
        <div className="p-4 bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Auto-Escalated Requests (Manager Timeout Bypasses)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                  {escalatedList.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                These requests bypassed Manager sign-off after exceeding the 2-minute response threshold.
              </p>
            </div>
          </div>
        </div>

        {escalatedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No escalated requests at this time. All manager reviews are running within SLA.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {escalatedList.map((req) => (
              <div key={req.id} className="p-4 bg-rose-950/10 hover:bg-rose-950/20 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={req.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={req.userName}
                      className="w-9 h-9 rounded-full border border-rose-500/30 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.userName}</span>
                        <span className="text-xs text-slate-400">• {req.teamName}</span>
                        <span className="text-xs font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {req.totalDays} days ({req.startDate} to {req.endDate})
                        </span>
                      </div>

                      {/* Escalation Note Box */}
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <strong>Audit Note:</strong> {req.escalationNote}
                      </div>

                      <p className="text-xs text-slate-400 mt-1.5 italic">
                        Reason: "{req.reason || 'None provided'}"
                      </p>
                    </div>
                  </div>

                  {/* Actions if still pending in HR */}
                  {req.status === 'HR_PENDING' ? (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>HR Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>HR Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-end md:self-center">
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Final Approvals Queue (All HR_PENDING) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              HR Final Sign-Off Queue ({hrPending.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Approving here will finalize the StateMachine and deduct employee leave balance.
          </span>
        </div>

        {hrPending.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No requests currently waiting for HR review.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {hrPending.map((req) => (
              <div key={req.id} className="p-4 hover:bg-slate-900/40 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={req.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={req.userName}
                      className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{req.userName}</span>
                        <span className="text-xs text-slate-400">• {req.teamName}</span>
                        <ConflictBadge
                          hasConflict={req.hasTeamConflict}
                          conflictDetails={req.conflictDetails}
                        />
                      </div>
                      <div className="mt-1 text-xs text-slate-300">
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {req.startDate} → {req.endDate} ({req.totalDays} days)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 italic">
                        "{req.reason || 'None'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-600/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Deduct Days</span>
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics Dashboards using Recharts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Status Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Leave Request Status Distribution
            </h4>
          </div>
          <div className="h-56">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                No leave data to plot
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Team Leave & Capacity Volume */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Department Leave Volume & Conflicts
            </h4>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamDistribution}>
                <XAxis dataKey="team" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalLeaves" name="Total Leaves" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conflicts" name="Capacity Conflicts (>20%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
