import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function StatusStepper({ status, escalationNote, compact = false }) {
  const steps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'MANAGER_PENDING', label: 'Manager Review' },
    { key: 'HR_PENDING', label: 'HR Final Review' },
    { key: 'APPROVED', label: 'Approved' },
  ];

  const isRejected = status === 'REJECTED';

  const getStepIndex = (st) => {
    switch (st) {
      case 'SUBMITTED': return 0;
      case 'MANAGER_PENDING': return 1;
      case 'HR_PENDING': return 2;
      case 'APPROVED': return 3;
      case 'REJECTED': return 2; // failed during review
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  if (compact) {
    let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    let icon = <Clock className="w-3.5 h-3.5 mr-1" />;

    if (status === 'APPROVED') {
      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    } else if (status === 'REJECTED') {
      badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      icon = <XCircle className="w-3.5 h-3.5 mr-1" />;
    } else if (status === 'HR_PENDING') {
      badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    } else if (status === 'MANAGER_PENDING') {
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
          {icon}
          {status.replace('_', ' ')}
        </span>
        {escalationNote && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            ESCALATED
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />

        {steps.map((step, idx) => {
          const isDone = !isRejected && (idx < currentIndex || (status === 'APPROVED' && idx === 3));
          const isCurrent = !isRejected && idx === currentIndex;
          const isCurrentPending = isCurrent && status !== 'APPROVED';

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                    : isCurrentPending
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 animate-pulse'
                    : isRejected && idx === currentIndex
                    ? 'bg-rose-500 text-white ring-4 ring-rose-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isRejected && idx === currentIndex ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 transition-colors ${
                  isDone
                    ? 'text-emerald-400'
                    : isCurrentPending
                    ? 'text-blue-400 font-semibold'
                    : isRejected && idx === currentIndex
                    ? 'text-rose-400 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isRejected && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Request has been rejected during review chain.</span>
        </div>
      )}

      {escalationNote && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-mono text-[11px]">{escalationNote}</span>
        </div>
      )}
    </div>
  );
}
