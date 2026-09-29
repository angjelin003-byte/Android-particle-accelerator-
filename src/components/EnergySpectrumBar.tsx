/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ParticleState } from '../types/physics';
import { ShieldCheck, Compass, Zap } from 'lucide-react';

interface EnergySpectrumBarProps {
  particles: ParticleState[];
  initialEnergy: number;
  currentEnergy: number;
  invariantMass: number;
  scatteringAngles: {
    theta1Deg: number;
    theta2Deg: number;
    totalOpeningDeg: number;
    classicalComparisonDeg: number;
  } | null;
}

export const EnergySpectrumBar: React.FC<EnergySpectrumBarProps> = ({
  particles,
  initialEnergy,
  currentEnergy,
  invariantMass,
  scatteringAngles,
}) => {
  const activeParticles = particles.filter((p) => !p.annihilated);

  const totalRestMass = activeParticles.reduce((sum, p) => sum + (p.mass > 0 ? p.mass : 0), 0);
  const totalKinetic = activeParticles.reduce((sum, p) => sum + p.kineticEnergy, 0);
  const totalEnergy = currentEnergy > 0 ? currentEnergy : 1;

  const restMassPercent = Math.min(100, Math.max(0, (totalRestMass / totalEnergy) * 100));
  const kineticPercent = Math.min(100, Math.max(0, (totalKinetic / totalEnergy) * 100));
  const energyDelta = initialEnergy > 0 ? Math.abs((currentEnergy - initialEnergy) / initialEnergy) * 100 : 0;

  // Format energy units (MeV or GeV)
  const formatE = (mev: number) => {
    if (mev >= 1000) return `${(mev / 1000).toFixed(2)} GeV`;
    return `${mev.toFixed(1)} MeV`;
  };

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 px-3 py-2 select-none shrink-0 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
        
        {/* 1. RELATIVISTIC ENERGY LEVEL BAR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Relativistic Energy Spectrum
            </span>
            <span className="font-mono text-cyan-400 font-semibold tabular-nums">
              {formatE(totalEnergy)}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${restMassPercent}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-150"
              title={`Rest Mass: ${formatE(totalRestMass)}`}
            />
            <div
              style={{ width: `${kineticPercent}%` }}
              className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-150"
              title={`Kinetic: ${formatE(totalKinetic)}`}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>
              Rest E₀: <strong className="text-slate-200">{formatE(totalRestMass)}</strong>
            </span>
            <span>
              Kinetic K: <strong className="text-slate-200">{formatE(totalKinetic)}</strong>
            </span>
          </div>
        </div>

        {/* 2. SCATTERING ANGLE ANALYSIS */}
        <div className="p-1.5 px-2 bg-slate-950/70 border border-slate-800 rounded flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Angles:</span>
            {scatteringAngles ? (
              <span className="text-amber-300 font-semibold">
                θ₁={scatteringAngles.theta1Deg.toFixed(1)}° · θ₂={scatteringAngles.theta2Deg.toFixed(1)}°
              </span>
            ) : (
              <span className="text-slate-500">Deflecting...</span>
            )}
          </div>

          {scatteringAngles && (
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-bold">
                Θ = {scatteringAngles.totalOpeningDeg.toFixed(1)}°
              </span>
              <span className="text-slate-500 line-through text-[9px]">90° limit</span>
            </div>
          )}
        </div>

        {/* 3. INVARIANT MASS & PRECISION CHECK */}
        <div className="p-1.5 px-2.5 bg-slate-950/70 border border-slate-800 rounded flex items-center justify-between text-[11px]">
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Invariant Mass √(s)</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums">
              {formatE(invariantMass)}
            </span>
          </div>

          <div className="text-right border-l border-slate-800 pl-2">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Conservation
            </span>
            <span className="font-mono text-emerald-400 font-semibold text-[10px] tabular-nums block">
              ΔE: {energyDelta < 0.001 ? '<0.001%' : `${energyDelta.toFixed(3)}%`}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
