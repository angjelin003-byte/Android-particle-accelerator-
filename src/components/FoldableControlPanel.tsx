/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SimulationConfig,
  ParticleDefinition,
  ParticleCategory,
} from '../types/physics';
import { PARTICLE_REGISTRY } from '../physics/constants';
import { calculateGamma } from '../physics/relativisticMath';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  Gauge,
  Eye,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Atom,
  Flame,
  Zap,
  Box,
  Layers,
  Sun,
  Moon,
  Layout,
  LayoutTemplate,
} from 'lucide-react';

interface FoldableControlPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  config: SimulationConfig;
  onConfigChange: (updates: Partial<SimulationConfig>) => void;
  particleAId: string;
  onParticleAIdChange: (id: string) => void;
  particleBId: string;
  onParticleBIdChange: (id: string) => void;
  betaA: number;
  onBetaAChange: (v: number) => void;
  betaB: number;
  onBetaBChange: (v: number) => void;
  impactParameter: number;
  onImpactParameterChange: (b: number) => void;
  customMassA: number;
  onCustomMassAChange: (m: number) => void;
  customMassB: number;
  onCustomMassBChange: (m: number) => void;
  customChargeA: number;
  onCustomChargeAChange: (q: number) => void;
  customChargeB: number;
  onCustomChargeBChange: (q: number) => void;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  layout: 'vertical' | 'horizontal';
  setLayout: (layout: 'vertical' | 'horizontal') => void;
  trailLength: number;
  setTrailLength: (len: number) => void;
}

export const FoldableControlPanel: React.FC<FoldableControlPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  config,
  onConfigChange,
  particleAId,
  onParticleAIdChange,
  particleBId,
  onParticleBIdChange,
  betaA,
  onBetaAChange,
  betaB,
  onBetaBChange,
  impactParameter,
  onImpactParameterChange,
  customMassA,
  onCustomMassAChange,
  customMassB,
  onCustomMassBChange,
  customChargeA,
  onCustomChargeAChange,
  customChargeB,
  onCustomChargeBChange,
  onPlayPause,
  onStep,
  onReset,
  layout,
  setLayout,
  trailLength,
  setTrailLength,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'beams' | 'slowmo' | 'physics' | 'visuals'>('beams');
  const [beamSubCategory, setBeamSubCategory] = useState<'all' | 'quark' | 'lepton' | 'gauge_boson' | 'scalar_boson' | 'hadron'>('all');

  const partA = PARTICLE_REGISTRY[particleAId] || PARTICLE_REGISTRY.electron;
  const partB = PARTICLE_REGISTRY[particleBId] || PARTICLE_REGISTRY.electron;

  const gammaA = calculateGamma(betaA);
  const gammaB = calculateGamma(betaB);

  // Filter particles by Standard Model category
  const filteredParticles = Object.values(PARTICLE_REGISTRY).filter((p) => {
    if (beamSubCategory === 'all') return true;
    if (beamSubCategory === 'hadron') {
      return p.category === 'baryon' || p.category === 'meson' || p.category === 'nucleus';
    }
    return p.category === beamSubCategory;
  });

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 z-20 ${
        isCollapsed ? 'w-11 md:w-12' : 'w-76 md:w-88'
      }`}
    >
      {/* Collapse Toggle Handle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-slate-700 shadow-md z-30 transition-colors"
        title={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
        aria-label={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* When Collapsed: Vertical Icon Strip */}
      {isCollapsed ? (
        <div className="flex flex-col items-center py-3 gap-3 text-slate-400">
          <button
            onClick={onPlayPause}
            className={`p-2 rounded-lg transition-colors ${
              config.running ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-200'
            }`}
            title={config.running ? 'Pause' : 'Play'}
          >
            {config.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            onClick={onStep}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            title="Single Frame Step"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            title="Reset Collision"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-5 h-px bg-slate-800 my-1" />

          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('beams');
            }}
            className="p-2 hover:text-cyan-400 transition-colors"
            title="Elementary Particles & Beams"
          >
            <Atom className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('slowmo');
            }}
            className="p-2 hover:text-cyan-400 transition-colors"
            title="Time Dilation & Slow-Mo"
          >
            <Gauge className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('physics');
            }}
            className="p-2 hover:text-cyan-400 transition-colors"
            title="Interaction Forces"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('visuals');
            }}
            className="p-2 hover:text-cyan-400 transition-colors"
            title="3D Visualization Options"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* When Expanded: High-Density Compact Console */
        <div className="flex flex-col h-full overflow-hidden text-xs">
          {/* Header & Quick Play Bar */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div>
              <h2 className="font-semibold text-slate-100 flex items-center gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Collider Controls
              </h2>
              <p className="text-[10px] text-slate-400">All Standard Model Particles</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setLayout(layout === 'vertical' ? 'horizontal' : 'vertical')}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                title="Toggle Layout"
              >
                {layout === 'vertical' ? <LayoutTemplate className="w-3.5 h-3.5" /> : <Layout className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onPlayPause}
                className={`px-2.5 py-1 rounded font-medium text-[11px] flex items-center gap-1 transition-colors ${
                  config.running
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400'
                }`}
                title={config.running ? 'Pause (Space)' : 'Play (Space)'}
              >
                {config.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{config.running ? 'Pause' : 'Run'}</span>
              </button>

              <button
                onClick={onStep}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                title="Step"
              >
                <StepForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onReset}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 text-[11px]">
            <button
              onClick={() => setActiveTab('beams')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'beams'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Particles
            </button>
            <button
              onClick={() => setActiveTab('slowmo')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'slowmo'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Slow-Mo
            </button>
            <button
              onClick={() => setActiveTab('physics')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'physics'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Forces
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'visuals'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D View
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-slate-300">
            {/* TAB 1: ALL ELEMENTARY PARTICLES & BEAMS */}
            {activeTab === 'beams' && (
              <div className="space-y-4">
                {/* Standard Model Category Filters */}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Standard Model Sector
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'quark', label: 'Quarks' },
                      { id: 'lepton', label: 'Leptons' },
                      { id: 'gauge_boson', label: 'Gauge Bosons' },
                      { id: 'scalar_boson', label: 'Higgs' },
                      { id: 'hadron', label: 'Hadrons/Au' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setBeamSubCategory(sec.id as any)}
                        className={`py-0.5 px-1 rounded transition-colors text-center truncate ${
                          beamSubCategory === sec.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                            : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BEAM A */}
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-400 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Incident Beam A
                    </span>
                    <span className="font-mono text-cyan-300/90 text-[11px]">
                      γ = {gammaA > 100 ? '∞' : gammaA.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <select
                      value={particleAId}
                      onChange={(e) => onParticleAIdChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      {filteredParticles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.symbol}) · {p.restMassMeV > 0 ? `${p.restMassMeV >= 1000 ? `${(p.restMassMeV/1000).toFixed(2)} GeV` : `${p.restMassMeV.toFixed(3)} MeV`}` : 'Massless'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {particleAId === 'custom' ? (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400">Mass (MeV)</label>
                        <input
                          type="number"
                          step="1"
                          value={customMassA}
                          onChange={(e) => onCustomMassAChange(Math.max(0.01, parseFloat(e.target.value) || 1))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Charge (e)</label>
                        <input
                          type="number"
                          step="1"
                          value={customChargeA}
                          onChange={(e) => onCustomChargeAChange(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                      <span>Mass: {partA.restMassMeV >= 1000 ? `${(partA.restMassMeV / 1000).toFixed(2)} GeV` : `${partA.restMassMeV.toFixed(3)} MeV`}</span>
                      <span>Charge: {partA.charge > 0 ? `+${partA.charge}` : partA.charge}e</span>
                    </div>
                  )}

                  {/* Speed beta Slider */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-0.5">
                      <span className="text-slate-400">Velocity β</span>
                      <span className="font-mono text-cyan-400 font-semibold">{betaA.toFixed(3)}c</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.999"
                      step="0.001"
                      value={betaA}
                      onChange={(e) => onBetaAChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* BEAM B / TARGET */}
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Beam B / Target
                    </span>
                    <span className="font-mono text-amber-300/90 text-[11px]">
                      γ = {gammaB > 100 ? '∞' : gammaB.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <select
                      value={particleBId}
                      onChange={(e) => onParticleBIdChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                    >
                      {filteredParticles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.symbol}) · {p.restMassMeV > 0 ? `${p.restMassMeV >= 1000 ? `${(p.restMassMeV/1000).toFixed(2)} GeV` : `${p.restMassMeV.toFixed(3)} MeV`}` : 'Massless'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {particleBId === 'custom' ? (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400">Mass (MeV)</label>
                        <input
                          type="number"
                          step="1"
                          value={customMassB}
                          onChange={(e) => onCustomMassBChange(Math.max(0.01, parseFloat(e.target.value) || 1))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Charge (e)</label>
                        <input
                          type="number"
                          step="1"
                          value={customChargeB}
                          onChange={(e) => onCustomChargeBChange(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                      <span>Mass: {partB.restMassMeV >= 1000 ? `${(partB.restMassMeV / 1000).toFixed(2)} GeV` : `${partB.restMassMeV.toFixed(3)} MeV`}</span>
                      <span>Charge: {partB.charge > 0 ? `+${partB.charge}` : partB.charge}e</span>
                    </div>
                  )}

                  {/* Target Speed Slider */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-0.5">
                      <span className="text-slate-400">Target Velocity β</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {betaB === 0 ? 'Rest (0.00c)' : `${betaB.toFixed(3)}c`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.00"
                      max="0.999"
                      step="0.001"
                      value={betaB}
                      onChange={(e) => onBetaBChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Impact Parameter */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-0.5">
                      <span className="text-slate-400">Impact Parameter (b)</span>
                      <span className="font-mono text-amber-400 font-semibold">{impactParameter} fm</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      step="1"
                      value={impactParameter}
                      onChange={(e) => onImpactParameterChange(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SLOW-MO */}
            {activeTab === 'slowmo' && (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Time Dilation Factor
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {(config.slowMoFactor * 100).toFixed(2)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.002"
                    max="0.20"
                    step="0.002"
                    value={config.slowMoFactor}
                    onChange={(e) => onConfigChange({ slowMoFactor: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.002x</span>
                    <span>0.05x</span>
                    <span>0.20x</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Frame Interval (Δt)</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {config.frameIntervalPs.toFixed(2)} ps
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.50"
                    step="0.05"
                    value={config.frameIntervalPs}
                    onChange={(e) => onConfigChange({ frameIntervalPs: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">RK4 Sub-Steps</span>
                    <span className="font-mono text-cyan-400 font-semibold">{config.subSteps}x</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="16"
                    step="2"
                    value={config.subSteps}
                    onChange={(e) => onConfigChange({ subSteps: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: FORCES & REACTIONS */}
            {activeTab === 'physics' && (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">Relativistic Dynamics</span>
                    <input
                      type="checkbox"
                      checked={config.relativisticKinematics}
                      onChange={(e) => onConfigChange({ relativisticKinematics: e.target.checked })}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Exact 4-momentum boosts and Lorentz contraction along 3D velocity vectors.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-cyan-400" /> Coulomb Deflection
                    </span>
                    <input
                      type="checkbox"
                      checked={config.coulombEnabled}
                      onChange={(e) => onConfigChange({ coulombEnabled: e.target.checked })}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>Coupling</span>
                      <span className="font-mono text-cyan-400">{config.coulombStrength.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={config.coulombStrength}
                      onChange={(e) => onConfigChange({ coulombStrength: parseFloat(e.target.value) })}
                      disabled={!config.coulombEnabled}
                      className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-amber-400" /> Reaction Channels
                    </span>
                    <input
                      type="checkbox"
                      checked={config.reactionsEnabled}
                      onChange={(e) => onConfigChange({ reactionsEnabled: e.target.checked })}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Enables W⁺W⁻ → H⁰, gg → tt̄, e⁺e⁻ → 2γ, e⁺e⁻ → τ⁺τ⁻, pp̄ → pions.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: 3D VIEW & VISUAL OVERLAYS */}
            {activeTab === 'visuals' && (
              <div className="space-y-4">
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> Trail Length
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">{trailLength}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={trailLength}
                    onChange={(e) => setTrailLength(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  {[
                    {
                      key: 'showDetectorWireframe',
                      label: '3D Detector Wireframe Barrel',
                      desc: 'Cylindrical drift chamber geometry',
                    },
                    {
                      key: 'showLorentzContraction',
                      label: '3D Lorentz Contraction Ellipsoids',
                      desc: 'Contracts particle along velocity vector by 1/γ',
                    },
                    {
                      key: 'showProtractorGrid',
                      label: '3D Polar Protractor & Spokes',
                      desc: 'Concentric degree rings in collision plane',
                    },
                    {
                      key: 'showMomentumVectors',
                      label: '3D Momentum Vectors (p)',
                      desc: 'Conical arrows with MeV/c magnitudes',
                    },
                    {
                      key: 'showTrails',
                      label: '3D Trajectory Trails',
                      desc: 'Illuminated phosphorescence lines',
                    },
                    {
                      key: 'showEnergyLevels',
                      label: 'Energy Level Spectrum Bar',
                      desc: 'Bottom invariant mass and energy bar',
                    },
                  ].map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="flex items-start justify-between p-2 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="pr-2">
                        <span className="font-medium text-slate-200 block text-[11px]">{label}</span>
                        <span className="text-[9px] text-slate-500 block leading-tight">{desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config[key as keyof SimulationConfig] as boolean}
                        onChange={(e) =>
                          onConfigChange({ [key]: e.target.checked } as Partial<SimulationConfig>)
                        }
                        className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
