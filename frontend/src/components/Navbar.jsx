import React, { useState } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  Zap,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({
  users,
  currentUser,
  onSelectUser,
  onSchedulerTriggered,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const handleSimulateScheduler = async () => {
    try {
      setTriggering(true);
      const res = await api.triggerEscalationJob();
      if (onSchedulerTriggered) onSchedulerTriggered();
      alert(`⚡ Escalation Engine Check Completed: ${res.message}`);
    } catch (err) {
      alert(`Scheduler trigger failed: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'HR':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'MANAGER':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Leave<span className="text-blue-400">Flow</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:block">
              Spring StateMachine • Pro-Rata • Smart Conflict Detection
            </span>
          </div>
        </div>

        {/* Live Engine Indicator & Demo Controls */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-400">@Scheduled Cron:</span>
            <span className="text-emerald-400 font-semibold">Active (Every 60s)</span>
          </div>

          <button
            onClick={handleSimulateScheduler}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition shadow-sm"
            title="Force run the auto-escalation cron job immediately"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${triggering ? 'animate-spin' : ''}`} />
            <span>{triggering ? 'Running...' : 'Run Auto-Escalation'}</span>
          </button>
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentUser?.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-700"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentUser?.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${getRoleBadge(
                    currentUser?.role
                  )}`}
                >
                  {currentUser?.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser?.teamName || currentUser?.jobTitle}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User switcher dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Switch Role / Persona (Seeded)
                </span>
                <span className="text-[10px] text-blue-400 font-mono">Demo Instant Switch</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {users.map((u) => {
                  const isSelected = u.id === currentUser?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition ${
                        isSelected
                          ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{u.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${getRoleBadge(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.jobTitle} • {u.teamName}
                        </div>
                        {u.role === 'EMPLOYEE' && (
                          <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                            Joined {u.joinDate} • Balance: {u.leaveBalance}d
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
