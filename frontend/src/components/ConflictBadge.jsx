import React, { useState } from 'react';
import { AlertTriangle, Users, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function ConflictBadge({ hasConflict, conflictDetails, alwaysShowSafe = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!hasConflict) {
    if (!alwaysShowSafe) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Users className="w-3.5 h-3.5" />
        Team Capacity OK
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <div
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20 cursor-pointer hover:bg-amber-500/30 transition-all select-none group"
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
        <span className="tracking-wide">Team Capacity Warning!</span>
        <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-mono font-normal">
          &gt;20% Out
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
        )}
      </div>

      {expanded && conflictDetails && (
        <div className="absolute left-0 mt-2 z-50 w-72 sm:w-80 p-3 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl shadow-xl shadow-black/60 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-2 mb-1.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="font-semibold text-amber-300">Conflict Details</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed pl-6">
            {conflictDetails}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic pl-6">
            Policy: Non-blocking warning attached to review workflow.
          </div>
        </div>
      )}
    </div>
  );
}
