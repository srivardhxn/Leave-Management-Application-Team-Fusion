import React, { useState, useEffect } from 'react';
import { Calendar, Send, AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { api } from '../services/api';

export default function ApplyLeaveForm({ user, onSuccess }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictPreview, setConflictPreview] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Set default dates to upcoming next month
  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 14);

    const format = (d) => d.toISOString().split('T')[0];
    setStartDate(format(start));
    setEndDate(format(end));
    setReason('Annual wellness break and family vacation');
  }, []);

  // Pre-flight conflict check whenever dates change
  useEffect(() => {
    if (!user?.id || !startDate || !endDate || startDate > endDate) {
      setConflictPreview(null);
      return;
    }

    let active = true;
    setCheckingConflict(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkConflict(user.id, startDate, endDate);
        if (active) {
          setConflictPreview(res);
        }
      } catch (e) {
        console.error('Failed to preview conflict', e);
      } finally {
        if (active) setCheckingConflict(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.id, startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.applyLeave({
        userId: user.id,
        startDate,
        endDate,
        reason,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const getDaysCount = () => {
    if (!startDate || !endDate || startDate > endDate) return 0;
    const diff = new Date(endDate) - new Date(startDate);
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = getDaysCount();

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Apply for Time Off
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit your leave request for multi-tier manager and HR approval.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
          {daysCount} {daysCount === 1 ? 'Day' : 'Days'} Selected
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Reason / Notes for Approvers
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g., Vacation, personal errands, medical checkup..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition resize-none placeholder:text-slate-600"
          />
        </div>

        {/* Real-Time Smart Conflict Detection Preview */}
        {conflictPreview && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              conflictPreview.hasConflict
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {conflictPreview.hasConflict ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-semibold flex items-center justify-between">
                  <span>
                    {conflictPreview.hasConflict
                      ? 'Team Capacity Warning Detected (>20%)'
                      : 'Optimal Team Capacity'}
                  </span>
                  <span className="font-mono text-[11px] opacity-80">
                    {conflictPreview.conflictPercentage.toFixed(1)}% team on leave
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-slate-300">
                  {conflictPreview.details}
                </p>
                {conflictPreview.hasConflict && (
                  <p className="text-[10px] text-amber-400/90 mt-1 italic">
                    ℹ️ You can still submit! Policy does not block requests; a warning will be flagged for your manager.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || daysCount <= 0}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Processing State Machine...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Leave Request ({daysCount} Days)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
