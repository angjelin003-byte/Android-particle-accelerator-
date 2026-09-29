/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SimulationConfig,
  ParticleDefinition,
  ParticleCategory,
  TrailStyle,
  SizeScaleMode,
} from '../types/physics';
import { PARTICLE_REGISTRY } from '../physics/constants';
import { calculateGamma } from '../physics/relativisticMath';
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
  Shield,
  Sparkles,
  Sun,
  Moon,
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
}) => {
  const [activeTab, setActiveTab] = useState<'beams' | 'slowmo' | 'physics' | 'visuals'>('beams');
  const [beamSubCategory, setBeamSubCategory] = useState<'all' | 'atom' | 'lepton' | 'hadron' | 'quark' | 'boson'>('all');

  const partA = PARTICLE_REGISTRY[particleAId] || PARTICLE_REGISTRY.electron;
  const partB = PARTICLE_REGISTRY[particleBId] || PARTICLE_REGISTRY.electron;

  const gammaA = calculateGamma(betaA);
  const gammaB = calculateGamma(betaB);

  const isDark = config.theme === 'dark';

  // Filter particles by Standard Model & Atomic category
  const filteredParticles = Object.values(PARTICLE_REGISTRY).filter((p) => {
    if (beamSubCategory === 'all') return true;
    if (beamSubCategory === 'atom') return p.category === 'atom';
    if (beamSubCategory === 'lepton') return p.category === 'lepton';
    if (beamSubCategory === 'quark') return p.category === 'quark';
    if (beamSubCategory === 'boson') return p.category === 'gauge_boson' || p.category === 'scalar_boson';
    if (beamSubCategory === 'hadron') {
      return p.category === 'baryon' || p.category === 'meson' || p.category === 'nucleus';
    }
    return true;
  });

  return (
    <aside
      className={`relative flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20 border-r ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      } ${isCollapsed ? 'w-11 md:w-12' : 'w-76 md:w-88'}`}
    >
      {/* Collapse Toggle Handle */}
      <button
        onClick={onToggleCollapse}
        className={`absolute -right-3 top-4 p-1 rounded-full border shadow-md z-30 transition-colors ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
        }`}
        title={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
        aria-label={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* When Collapsed: Vertical Icon Strip */}
      {isCollapsed ? (
        <div className="flex flex-col items-center py-3 gap-3">
          <button
            onClick={onPlayPause}
            className={`p-2 rounded-lg transition-colors ${
              config.running
                ? 'bg-cyan-500/20 text-cyan-500'
                : isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-100 text-slate-700'
            }`}
            title={config.running ? 'Pause' : 'Play'}
          >
            {config.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            onClick={onStep}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Single Frame Step"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReset}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Reset Collision"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className={`w-5 h-px my-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('beams');
            }}
            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
            title="Elementary Particles & Atoms"
          >
            <Atom className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('slowmo');
            }}
            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
            title="Time Dilation & Slow-Mo"
          >
            <Gauge className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('physics');
            }}
            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
            title="Interaction Forces & Chamber"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              setActiveTab('visuals');
            }}
            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
            title="3D Visualization & Trails"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* When Expanded: High-Density Lab Console */
        <div className="flex flex-col h-full overflow-hidden text-xs">
          {/* Header & Quick Play Bar */}
          <div
            className={`p-3 border-b flex items-center justify-between transition-colors ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            <div>
              <h2 className="font-semibold flex items-center gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-cyan-500" /> Collider Controls
              </h2>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Standard Model & Atomic Targetry
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onPlayPause}
                className={`px-2.5 py-1 rounded font-medium text-[11px] flex items-center gap-1 transition-colors ${
                  config.running
                    ? isDark
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : isDark
                    ? 'bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400'
                    : 'bg-cyan-600 text-white font-semibold hover:bg-cyan-500'
                }`}
                title={config.running ? 'Pause (Space)' : 'Play (Space)'}
              >
                {config.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{config.running ? 'Pause' : 'Run'}</span>
              </button>

              <button
                onClick={onStep}
                className={`p-1 rounded transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Single Frame Step"
              >
                <StepForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onReset}
                className={`p-1 rounded transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Reset Collision"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div
            className={`flex border-b p-1 text-[11px] transition-colors ${
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100/60'
            }`}
          >
            <button
              onClick={() => setActiveTab('beams')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'beams'
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'bg-white text-cyan-700 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Particles
            </button>
            <button
              onClick={() => setActiveTab('slowmo')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'slowmo'
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'bg-white text-cyan-700 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kinematics
            </button>
            <button
              onClick={() => setActiveTab('physics')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'physics'
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'bg-white text-cyan-700 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chamber
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors text-center ${
                activeTab === 'visuals'
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'bg-white text-cyan-700 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overlays
            </button>
          </div>

          {/* Tab Contents Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* TAB 1: PARTICLES & ATOMS SELECTION */}
            {activeTab === 'beams' && (
              <div className="space-y-4">
                {/* Subcategory Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Class Filter</span>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'atom', 'lepton', 'hadron', 'boson', 'quark'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBeamSubCategory(cat)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
                          beamSubCategory === cat
                            ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30'
                            : isDark
                            ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'All Particles' : cat === 'atom' ? 'Atoms (H,Au,Si,Al)' : cat + 's'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BEAM A CONTROL */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2.5 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-500 flex items-center gap-1.5">
                      <Atom className="w-3.5 h-3.5" /> Projectile (Beam A)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      γ = {gammaA.toFixed(2)}
                    </span>
                  </div>

                  <select
                    value={particleAId}
                    onChange={(e) => onParticleAIdChange(e.target.value)}
                    className={`w-full rounded p-1.5 text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {filteredParticles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.symbol}) {p.category === 'atom' ? `[Atom Z=${p.atomicNumberZ}]` : ''}
                      </option>
                    ))}
                  </select>

                  <div className="text-[10px] space-y-0.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Rest Mass:</span>
                      <span className="text-slate-200 font-semibold">
                        {partA.restMassMeV >= 1000
                          ? `${(partA.restMassMeV / 1000).toFixed(2)} GeV/c²`
                          : `${partA.restMassMeV.toFixed(3)} MeV/c²`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Electric Charge:</span>
                      <span className="text-slate-200 font-semibold">
                        {partA.charge > 0 ? `+${partA.charge}e` : `${partA.charge}e`}
                      </span>
                    </div>
                    {partA.atomicRadiusPm && (
                      <div className="flex justify-between text-cyan-400">
                        <span>Atomic Radius:</span>
                        <span>{partA.atomicRadiusPm} pm (Bohr scale)</span>
                      </div>
                    )}
                  </div>

                  {/* Velocity Beta Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Velocity β = v/c:</span>
                      <span className="font-semibold text-cyan-400">{(betaA * 100).toFixed(1)}% c</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={0.999}
                      step={0.005}
                      value={betaA}
                      onChange={(e) => onBetaAChange(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* BEAM B CONTROL */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2.5 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-500 flex items-center gap-1.5">
                      <Atom className="w-3.5 h-3.5" /> Target (Beam B)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                      {betaB === 0 ? 'Stationary' : `γ = ${gammaB.toFixed(2)}`}
                    </span>
                  </div>

                  <select
                    value={particleBId}
                    onChange={(e) => onParticleBIdChange(e.target.value)}
                    className={`w-full rounded p-1.5 text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {filteredParticles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.symbol}) {p.category === 'atom' ? `[Atom Z=${p.atomicNumberZ}]` : ''}
                      </option>
                    ))}
                  </select>

                  <div className="text-[10px] space-y-0.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Rest Mass:</span>
                      <span className="text-slate-200 font-semibold">
                        {partB.restMassMeV >= 1000
                          ? `${(partB.restMassMeV / 1000).toFixed(2)} GeV/c²`
                          : `${partB.restMassMeV.toFixed(3)} MeV/c²`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Electric Charge:</span>
                      <span className="text-slate-200 font-semibold">
                        {partB.charge > 0 ? `+${partB.charge}e` : `${partB.charge}e`}
                      </span>
                    </div>
                    {partB.atomicRadiusPm && (
                      <div className="flex justify-between text-amber-400">
                        <span>Atomic Radius:</span>
                        <span>{partB.atomicRadiusPm} pm (Bohr scale)</span>
                      </div>
                    )}
                  </div>

                  {/* Velocity Beta Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Velocity β = v/c:</span>
                      <span className="font-semibold text-amber-400">
                        {betaB === 0 ? '0.0% (Stationary Target)' : `${(betaB * 100).toFixed(1)}% c`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={0.99}
                      step={0.01}
                      value={betaB}
                      onChange={(e) => onBetaBChange(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* IMPACT PARAMETER (b) SLIDER */}
                <div
                  className={`p-2.5 rounded-lg border space-y-1.5 ${
                    isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Impact Parameter (b):</span>
                    <span className="font-semibold text-cyan-400">{impactParameter} fm</span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    step={1}
                    value={impactParameter}
                    onChange={(e) => onImpactParameterChange(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    b = 0 is head-on. Non-zero b generates Coulomb deflection and asymmetric scattering.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: KINEMATICS & SLOW-MO */}
            {activeTab === 'slowmo' && (
              <div className="space-y-4">
                <div
                  className={`p-2.5 rounded-lg border space-y-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-xs text-cyan-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" /> Relativistic Slow-Mo Calibration
                  </span>
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Simulation Speed:</span>
                      <span className="font-semibold text-cyan-400">{(config.slowMoFactor * 1000).toFixed(0)} ms/ps</span>
                    </div>
                    <input
                      type="range"
                      min={0.002}
                      max={0.08}
                      step={0.002}
                      value={config.slowMoFactor}
                      onChange={(e) => onConfigChange({ slowMoFactor: Number(e.target.value) })}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Sub-steps integration accuracy */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-xs text-slate-300">RK4 Integration Precision</span>
                  <div className="flex gap-2">
                    {[4, 8, 16].map((steps) => (
                      <button
                        key={steps}
                        onClick={() => onConfigChange({ subSteps: steps })}
                        className={`flex-1 py-1 rounded border font-mono text-[11px] transition-colors ${
                          config.subSteps === steps
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                            : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {steps} Sub-steps
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CHAMBER & SPHERE OF INTERACTION */}
            {activeTab === 'physics' && (
              <div className="space-y-4">
                {/* Sphere of Interaction Settings */}
                <div
                  className={`p-3 rounded-lg border space-y-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-cyan-400">
                      <Shield className="w-3.5 h-3.5" /> Sphere of Interaction
                    </span>
                    <input
                      type="checkbox"
                      checked={config.interactionSphereEnabled}
                      onChange={(e) => onConfigChange({ interactionSphereEnabled: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                  </div>

                  {config.interactionSphereEnabled && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-400">Chamber Radius R:</span>
                          <span className="font-semibold text-cyan-400">{config.interactionSphereRadius} fm</span>
                        </div>
                        <input
                          type="range"
                          min={120}
                          max={380}
                          step={10}
                          value={config.interactionSphereRadius}
                          onChange={(e) => onConfigChange({ interactionSphereRadius: Number(e.target.value) })}
                          className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-800">
                        <div className="text-[11px] leading-tight">
                          <div className="font-medium text-slate-200">Auto-Reload on Exit</div>
                          <div className="text-[10px] text-slate-400">
                            Reloads simulation when at least 1 particle exits the chamber
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.autoReloadOnExit}
                          onChange={(e) => onConfigChange({ autoReloadOnExit: e.target.checked })}
                          className="w-4 h-4 accent-cyan-500 rounded"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Coulomb Interaction Toggle */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-amber-400">
                      <Zap className="w-3.5 h-3.5" /> Coulomb Scattering
                    </span>
                    <input
                      type="checkbox"
                      checked={config.coulombEnabled}
                      onChange={(e) => onConfigChange({ coulombEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </div>

                  {config.coulombEnabled && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-400">Coupling Constant α:</span>
                        <span className="font-semibold text-amber-400">{config.coulombStrength.toFixed(1)}×</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={3.0}
                        step={0.1}
                        value={config.coulombStrength}
                        onChange={(e) => onConfigChange({ coulombStrength: Number(e.target.value) })}
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Reactions Toggle */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs flex items-center gap-1.5 text-rose-400">
                      <Flame className="w-3.5 h-3.5" /> High-Energy Reactions
                    </div>
                    <div className="text-[10px] text-slate-400">Annihilation, Higgs & Tau creation</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.reactionsEnabled}
                    onChange={(e) => onConfigChange({ reactionsEnabled: e.target.checked })}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: VISUAL OVERLAYS, TRAIL EDITOR & THEME */}
            {activeTab === 'visuals' && (
              <div className="space-y-4">
                {/* Size Scaling Mode */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-xs text-slate-300">Particle Size Scale in Viewport</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfigChange({ sizeScaleMode: 'realistic' })}
                      className={`flex-1 py-1.5 rounded border text-[11px] font-mono transition-colors ${
                        config.sizeScaleMode === 'realistic'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Realistic Scale
                    </button>
                    <button
                      onClick={() => onConfigChange({ sizeScaleMode: 'enhanced' })}
                      className={`flex-1 py-1.5 rounded border text-[11px] font-mono transition-colors ${
                        config.sizeScaleMode === 'enhanced'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Enhanced Size
                    </button>
                  </div>
                </div>

                {/* Trail Style in Viewport */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5" /> Particle Trail Style
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['ribbon', 'dashed', 'velocity_heatmap', 'sparks'] as TrailStyle[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => onConfigChange({ trailStyle: st })}
                        className={`px-2 py-1 text-[10px] font-mono rounded border capitalize transition-colors ${
                          config.trailStyle === st
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                            : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3D Visual Overlays Checkboxes */}
                <div
                  className={`p-2.5 rounded-lg border space-y-2 text-xs ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Lorentz Length Contraction</span>
                    <input
                      type="checkbox"
                      checked={config.showLorentzContraction}
                      onChange={(e) => onConfigChange({ showLorentzContraction: e.target.checked })}
                      className="accent-cyan-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Relativistic Momentum Vectors</span>
                    <input
                      type="checkbox"
                      checked={config.showMomentumVectors}
                      onChange={(e) => onConfigChange({ showMomentumVectors: e.target.checked })}
                      className="accent-cyan-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Polar Protractor & Degree Spokes</span>
                    <input
                      type="checkbox"
                      checked={config.showProtractorGrid}
                      onChange={(e) => onConfigChange({ showProtractorGrid: e.target.checked })}
                      className="accent-cyan-500 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Drift Chamber Wireframe</span>
                    <input
                      type="checkbox"
                      checked={config.showDetectorWireframe}
                      onChange={(e) => onConfigChange({ showDetectorWireframe: e.target.checked })}
                      className="accent-cyan-500 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
