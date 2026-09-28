import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  GitBranch,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import EmployeeView from './components/EmployeeView';
import ManagerView from './components/ManagerView';
import HRView from './components/HRView';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('EMPLOYEE'); // 'EMPLOYEE' | 'MANAGER' | 'HR'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userList = await api.getUsers();
      setUsers(userList);

      // Default to Priya Sharma (Joined July 1, 12 days pro-rated) or first user
      const priya = userList.find((u) => u.name.includes('Priya')) || userList[0];
      setCurrentUser(priya);
      setActiveTab(priya.role);

      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch initial users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    setActiveTab(user.role);
  };

  const handleRefreshUser = async () => {
    if (!currentUser?.id) return;
    try {
      const updated = await api.login(currentUser.id);
      setCurrentUser(updated);
      const updatedList = await api.getUsers();
      setUsers(updatedList);
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-sm font-medium">Initializing LeaveFlow Pro Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar with Role Switcher & Live Heartbeat */}
      <Navbar
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onSchedulerTriggered={handleRefreshUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hackathon Architecture Badge Banner */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              Spring StateMachine
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Pro-Rata Calculator
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Smart Conflict Engine (&gt;20%)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              @Scheduled Cron Escalation
            </span>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('EMPLOYEE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'EMPLOYEE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Employee View
            </button>
            <button
              onClick={() => setActiveTab('MANAGER')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'MANAGER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Manager View
            </button>
            <button
              onClick={() => setActiveTab('HR')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'HR'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HR Command Center
            </button>
          </div>
        </div>

        {/* Dynamic View based on Active Tab */}
        {activeTab === 'EMPLOYEE' && (
          <EmployeeView user={currentUser} onUserUpdated={handleRefreshUser} />
        )}

        {activeTab === 'MANAGER' && (
          <ManagerView user={currentUser} onActionTaken={handleRefreshUser} />
        )}

        {activeTab === 'HR' && (
          <HRView user={currentUser} onActionTaken={handleRefreshUser} />
        )}
      </main>

      {/* Footer with Spec Validation */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>H2 In-Memory DB Online (sa / empty pass) • Port 8080</span>
          </div>

          <div className="text-center sm:text-right font-mono text-[11px] text-slate-400">
            StateMachine: SUBMITTED → MANAGER_PENDING → HR_PENDING → APPROVED / REJECTED
          </div>
        </div>
      </footer>
    </div>
  );
}
