/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExperimentPreset } from '../types/physics';
import { EXPERIMENT_PRESETS } from '../physics/presets';
import { Play, Pause, StepForward, RotateCcw, BookOpen, Layers, Menu } from 'lucide-react';

interface TopTelemetryBarProps {
  activePreset: ExperimentPreset;
  onSelectPreset: (preset: ExperimentPreset) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onOpenGuide: () => void;
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  activePreset,
  onSelectPreset,
  isRunning,
  onTogglePlay,
  onStepForward,
  onReset,
  onOpenGuide,
  isPanelCollapsed,
  onTogglePanel,
}) => {
  return (
    <header className="h-11 md:h-12 bg-slate-900 border-b border-slate-800 px-3 md:px-5 flex items-center justify-between gap-2 md:gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Single text wordmark & Mobile panel toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePanel}
          className="p-1 md:hidden text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Toggle Control Panel"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-xs md:text-sm font-bold text-slate-100 tracking-tight whitespace-nowrap">
          Relativistic 3D Collider Lab
        </span>
        <span className="hidden lg:inline text-[10px] text-slate-500 font-mono">
          Standard Model · 3D Relativistic Kinematics
        </span>
      </div>

      {/* Zone 2: Preset Selector */}
      <div className="flex items-center gap-1.5 max-w-xs md:max-w-md">
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200">
          <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
          <select
            value={activePreset.id}
            onChange={(e) => {
              const selected = EXPERIMENT_PRESETS.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset(selected);
            }}
            className="bg-transparent border-0 text-slate-100 text-[11px] font-medium focus:outline-none cursor-pointer pr-1 truncate max-w-[130px] sm:max-w-[200px]"
          >
            {EXPERIMENT_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenGuide}
          className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 rounded text-[11px] font-medium border border-slate-700/80 transition-colors whitespace-nowrap"
          title="View Physical Theory & Experiment Guide"
        >
          <BookOpen className="w-3 h-3 text-cyan-400" />
          <span>Guide</span>
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm'
          }`}
          title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Run'}</span>
        </button>

        <button
          onClick={onStepForward}
          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
          title="Single Step Advance (S)"
          aria-label="Single Step Advance"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
          title="Reset Collision (R)"
          aria-label="Reset Collision"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
