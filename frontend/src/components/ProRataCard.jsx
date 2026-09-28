import React, { useState } from 'react';
import { Calendar, Sparkles, Calculator, Check, ArrowRight, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ProRataCard({ user, onRefresh }) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [simDate, setSimDate] = useState('2026-07-01'); // Default July 1 as in hackathon spec!
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const balance = user?.leaveBalance ?? 24.0;
  const annualTotal = 24.0;
  const percentage = Math.min(100, Math.round((balance / annualTotal) * 100));

  const handleSimulate = async () => {
    try {
      setSimLoading(true);
      const res = await api.calculateProRata(simDate, 2026, 24.0);
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left balance stats */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Pro-Rata Entitlement Active
            </span>
            <span className="text-xs text-slate-400">
              Joined: <strong className="text-slate-200 font-mono">{user?.joinDate}</strong>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            <span>{balance.toFixed(1)}</span>
            <span className="text-sm font-medium text-slate-400">/ {annualTotal} Annual Days Remaining</span>
          </h2>

          <p className="text-xs text-slate-400 mt-1.5 max-w-md">
            {user?.name} joined on {user?.joinDate}. The annual allowance of 24 days is automatically pro-rated for the year.
          </p>

          {/* Progress bar */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Available Allowance</span>
              <span className="font-mono font-medium text-slate-300">{percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 shadow-sm shadow-blue-500/50"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side CTA / Simulator trigger */}
        <div className="flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <button
            onClick={() => {
              setShowSimulator(!showSimulator);
              if (!simResult) handleSimulate();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
          >
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>{showSimulator ? 'Close Pro-Rata Inspector' : 'Inspect Pro-Rata Math'}</span>
          </button>
          <span className="text-[11px] text-slate-500 mt-1.5">
            Test any join date (e.g. July 1 → 12 days)
          </span>
        </div>
      </div>

      {/* Simulator / Formula Inspector Dropdown */}
      {showSimulator && (
        <div className="mt-6 pt-5 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Pro-Rata Calculation Algorithm (Hackathon Spec)
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Formula: (24 days ÷ 12) × remaining months
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Test Employee Join Date:
                </label>
                <input
                  type="date"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={simLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Calculate via Backend</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimDate('2026-07-01');
                    setTimeout(() => handleSimulate(), 50);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] py-2 px-2 rounded-lg border border-slate-700 text-center transition"
                >
                  July 1 (12d)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimDate('2026-01-01');
                    setTimeout(() => handleSimulate(), 50);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] py-2 px-2 rounded-lg border border-slate-700 text-center transition"
                >
                  Jan 1 (24d)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimDate('2026-10-01');
                    setTimeout(() => handleSimulate(), 50);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] py-2 px-2 rounded-lg border border-slate-700 text-center transition"
                >
                  Oct 1 (6d)
                </button>
              </div>
            </div>

            {simResult && (
              <div className="mt-3.5 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-mono text-[11px]">{simResult.explanation}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Calculated Allowance:</span>
                  <span className="font-extrabold text-emerald-400 text-base font-mono">
                    {simResult.calculatedBalance} days
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
