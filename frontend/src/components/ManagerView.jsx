import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Clock, RefreshCw, Zap, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import ConflictBadge from './ConflictBadge';
import StatusStepper from './StatusStepper';

export default function ManagerView({ user, onActionTaken }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, id: null, type: null, note: '' });

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await api.getManagerPending(user?.id);
      setPendingRequests(data);
    } catch (err) {
      console.error('Error fetching manager pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 8000); // Polling for live escalation demonstration
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await api.approveRequest(id, 'Approved by team manager');
      await fetchPending();
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
      await api.rejectRequest(id, 'Rejected due to operational requirements');
      await fetchPending();
      if (onActionTaken) onActionTaken();
    } catch (err) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleManualEscalate = async (id) => {
    try {
      setActionLoadingId(id);
      await api.escalateRequest(id, 'Auto-escalated due to manager timeout.');
      await fetchPending();
      if (onActionTaken) onActionTaken();
    } catch (err) {
      alert(err.message || 'Failed to escalate');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTriggerScheduler = async () => {
    try {
      setLoading(true);
      const res = await api.triggerEscalationJob();
      await fetchPending();
      if (onActionTaken) onActionTaken();
      alert(`Scheduler triggered: ${res.message}`);
    } catch (err) {
      alert(err.message || 'Failed to trigger scheduler');
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate request age and remaining time before auto-escalation
  const getEscalationCountdown = (submittedAtStr) => {
    const submitted = new Date(submittedAtStr).getTime();
    const now = Date.now();
    const elapsedSec = Math.floor((now - submitted) / 1000);
    const timeoutSec = 120; // 2 minutes hackathon rule
    const remaining = Math.max(0, timeoutSec - elapsedSec);

    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const ageFormatted = `${min}m ${sec}s`;

    return {
      ageFormatted,
      elapsedSec,
      remaining,
      isOverdue: remaining === 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Manager Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Manager Approval Hub
            </span>
            <span className="text-xs text-slate-400">
              Supervising: <strong className="text-slate-200">{user?.teamName || 'Engineering'}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Team Leave Requests Review
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review your direct reports' leave requests. High team overlap (&gt;20%) is highlighted automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerScheduler}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition shadow-sm"
            title="Runs the Spring @Scheduled auto-escalation check"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Auto-Escalation Check</span>
          </button>

          <button
            onClick={fetchPending}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pending Requests Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Pending Manager Approvals ({pendingRequests.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-Escalation Threshold: 2 Minutes
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-slate-200">Inbox Clean!</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are no pending requests for your team at this moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {pendingRequests.map((req) => {
              const countdown = getEscalationCountdown(req.submittedAt);
              const isLoading = actionLoadingId === req.id;

              return (
                <div
                  key={req.id}
                  className={`p-5 transition hover:bg-slate-900/50 ${
                    req.hasTeamConflict
                      ? 'border-l-4 border-l-amber-500 bg-amber-500/[0.02]'
                      : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Employee Profile & Details */}
                    <div className="flex items-start gap-3.5">
                      <img
                        src={req.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={req.userName}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {req.userName}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {req.teamName}
                          </span>
                          {/* Conflict Badge */}
                          <ConflictBadge
                            hasConflict={req.hasTeamConflict}
                            conflictDetails={req.conflictDetails}
                          />
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-300">
                          <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {req.startDate} → {req.endDate}
                          </span>
                          <span className="text-blue-400 font-semibold font-mono">
                            {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1.5 italic">
                          "{req.reason || 'No reason provided'}"
                        </p>
                      </div>
                    </div>

                    {/* Timer & Review Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end lg:self-center">
                      {/* Auto-escalation indicator */}
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Age: {countdown.ageFormatted}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {countdown.isOverdue ? (
                            <span className="text-rose-400 font-semibold animate-pulse">
                              Pending Auto-Escalation!
                            </span>
                          ) : (
                            <span>Auto-escalates in {countdown.remaining}s</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-600/30 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/80 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        {/* Force Escalate Quick Button for Judges */}
                        <button
                          onClick={() => handleManualEscalate(req.id)}
                          disabled={isLoading}
                          title="Simulate 2-minute timeout escalation immediately for demo judging"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Timeout Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
