/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExperimentPreset, AppTheme } from '../types/physics';
import { EXPERIMENT_PRESETS } from '../physics/presets';
import { X, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

interface ExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePreset: ExperimentPreset;
  onSelectPreset: (preset: ExperimentPreset) => void;
  theme: AppTheme;
}

export const ExperimentModal: React.FC<ExperimentModalProps> = ({
  isOpen,
  onClose,
  activePreset,
  onSelectPreset,
  theme,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl max-h-[85vh] border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 px-6 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className="text-base font-bold">Physics Theory &amp; Experiment Laboratory</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Guided relativistic collision experiments &amp; quantum reaction channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Active Preset Focus Card */}
          <div
            className={`p-4 rounded-lg space-y-3 border ${
              isDark ? 'bg-slate-950/80 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  Active Experiment
                </span>
                <h3 className="text-lg font-bold">{activePreset.title}</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activePreset.subtitle}</p>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-1 border rounded ${
                  isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}
              >
                {activePreset.badge}
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{activePreset.description}</p>

            <div
              className={`p-3 rounded border space-y-1.5 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Key Relativistic &amp; Quantum Invariants
              </h4>
              <ul className={`space-y-1 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {activePreset.theoryNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* List of All Curated Experiments */}
          <div className="space-y-3">
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                        ? isDark
                          ? 'bg-slate-800/80 border-cyan-500 ring-1 ring-cyan-500'
                          : 'bg-cyan-50 border-cyan-500 ring-1 ring-cyan-500'
                        : isDark
                        ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs">{preset.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/20 text-slate-500">
                          {preset.badge}
                        </span>
                      </div>
                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {preset.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/50 text-[10px] font-mono">
                      <span className="text-slate-500">
                        {preset.particleA} + {preset.particleB}
                      </span>
                      <span className="text-cyan-500 font-semibold flex items-center gap-1">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
