/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExperimentPreset } from '../types/physics';
import { EXPERIMENT_PRESETS } from '../physics/presets';
import { X, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

interface ExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePreset: ExperimentPreset;
  onSelectPreset: (preset: ExperimentPreset) => void;
}

export const ExperimentModal: React.FC<ExperimentModalProps> = ({
  isOpen,
  onClose,
  activePreset,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Physics Theory &amp; Experiment Laboratory
              </h2>
              <p className="text-xs text-slate-400">
                Guided relativistic collision experiments &amp; quantum reaction channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Active Preset Focus Card */}
          <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  Active Experiment
                </span>
                <h3 className="text-lg font-bold text-slate-100">{activePreset.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{activePreset.subtitle}</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                {activePreset.badge}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activePreset.description}</p>

            <div className="p-3 bg-slate-900/90 rounded border border-slate-800 space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Key Relativistic &amp; Quantum Invariants
              </h4>
              <ul className="space-y-1 text-xs text-slate-400 font-mono">
                {activePreset.theoryNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* List of All Curated Experiments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Browse All Experiment Presets
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPERIMENT_PRESETS.map((preset) => {
                const isActive = preset.id === activePreset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-100">{preset.title}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{preset.badge}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{preset.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 mt-2.5 pt-2 border-t border-slate-800/60">
                      <span>{isActive ? 'Currently Loaded' : 'Load Simulation Preset'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Equations integrated with 4th-order Runge-Kutta &amp; 4-vector Lorentz boosts
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
