/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExperimentPreset, AppTheme } from '../types/physics';
import { EXPERIMENT_PRESETS } from '../physics/presets';
import { Play, Pause, StepForward, RotateCcw, BookOpen, Layers, Menu, Sun, Moon } from 'lucide-react';

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
  theme: AppTheme;
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`h-11 md:h-12 border-b px-3 md:px-5 flex items-center justify-between gap-2 md:gap-4 select-none shrink-0 z-30 transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Zone 1: Brand title & Panel toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePanel}
          className={`p-1.5 md:hidden rounded transition-colors ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle Control Panel"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">
          Relativistic 3D Collider Lab
        </span>
        <span className={`hidden lg:inline text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Standard Model · Relativistic Dynamics
        </span>
      </div>

      {/* Zone 2: Preset Selector */}
      <div className="flex items-center gap-1.5 max-w-xs md:max-w-md">
        <div
          className={`flex items-center gap-1.5 border rounded px-2 py-1 text-[11px] transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <select
            value={activePreset.id}
            onChange={(e) => {
              const selected = EXPERIMENT_PRESETS.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset(selected);
            }}
            className={`bg-transparent border-0 text-[11px] font-medium focus:outline-none cursor-pointer pr-1 truncate max-w-[120px] sm:max-w-[210px] ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {EXPERIMENT_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenGuide}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors whitespace-nowrap ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border-slate-700/80'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-cyan-700 border-slate-200'
          }`}
          title="View Physical Theory & Experiment Guide"
        >
          <BookOpen className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <span>Theory</span>
        </button>
      </div>

      {/* Zone 3: Primary Actions & Theme Toggle */}
      <div className="flex items-center gap-1.5">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded border transition-colors ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title={isDark ? 'Switch to Light Lab Mode' : 'Switch to Dark Deep-Space Mode'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
            isRunning
              ? isDark
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
              : isDark
              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm'
              : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm'
          }`}
          title={isRunning ? 'Pause Simulation (Space)' : 'Run Simulation (Space)'}
        >
          {isRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Run'}</span>
        </button>

        <button
          onClick={onStepForward}
          className={`p-1.5 rounded border transition-colors ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title="Single Step Advance (S)"
          aria-label="Single Step Advance"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          className={`p-1.5 rounded border transition-colors ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title="Reset Collision (R)"
          aria-label="Reset Collision"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
