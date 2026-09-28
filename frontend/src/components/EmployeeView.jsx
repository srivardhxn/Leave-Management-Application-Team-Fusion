import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle, Clock, FileText, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import ProRataCard from './ProRataCard';
import ApplyLeaveForm from './ApplyLeaveForm';
import StatusStepper from './StatusStepper';
import ConflictBadge from './ConflictBadge';

export default function EmployeeView({ user, onUserUpdated }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await api.getMyRequests(user.id);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching employee leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user?.id]);

  const handleApplySuccess = () => {
    fetchMyRequests();
    if (onUserUpdated) onUserUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Pro-Rata Balance Highlight Card */}
      <ProRataCard user={user} onRefresh={fetchMyRequests} />

      {/* Main Grid: Form + Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leave Application Form */}
        <div className="lg:col-span-5">
          <ApplyLeaveForm user={user} onSuccess={handleApplySuccess} />
        </div>

        {/* Right Column: Requests History & State Machine Pipeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              My Leave Requests ({requests.length})
            </h3>
            <button
              onClick={fetchMyRequests}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No leave requests found</p>
              <p className="text-xs text-slate-500 mt-1">
                Use the form on the left to submit your first leave application.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {req.startDate} <span className="text-slate-500">to</span> {req.endDate}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 italic">
                        "{req.reason || 'No reason specified'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <ConflictBadge
                        hasConflict={req.hasTeamConflict}
                        conflictDetails={req.conflictDetails}
                      />
                    </div>
                  </div>

                  {/* Visual State Machine Stepper */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <StatusStepper
                      status={req.status}
                      escalationNote={req.escalationNote}
                    />
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500 font-mono text-right">
                    Submitted: {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
