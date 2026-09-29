/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ParticleState, AppTheme } from '../types/physics';
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
  theme: AppTheme;
}

export const EnergySpectrumBar: React.FC<EnergySpectrumBarProps> = ({
  particles,
  initialEnergy,
  currentEnergy,
  invariantMass,
  scatteringAngles,
  theme,
}) => {
  const isDark = theme === 'dark';
  const activeParticles = particles.filter((p) => !p.annihilated);

  const totalRestMass = activeParticles.reduce((sum, p) => sum + (p.mass > 0 ? p.mass : 0), 0);
  const totalKinetic = activeParticles.reduce((sum, p) => sum + p.kineticEnergy, 0);
  const totalEnergy = currentEnergy > 0 ? currentEnergy : 1;

  const restMassPercent = Math.min(100, Math.max(0, (totalRestMass / totalEnergy) * 100));
  const kineticPercent = Math.min(100, Math.max(0, (totalKinetic / totalEnergy) * 100));
  const energyDelta = initialEnergy > 0 ? Math.abs((currentEnergy - initialEnergy) / initialEnergy) * 100 : 0;

  const formatE = (mev: number) => {
    if (mev >= 1000) return `${(mev / 1000).toFixed(2)} GeV`;
    return `${mev.toFixed(1)} MeV`;
  };

  return (
    <div
      className={`w-full border-t px-3 py-2 select-none shrink-0 text-xs transition-colors duration-200 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
        {/* 1. RELATIVISTIC ENERGY LEVEL BAR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-500" /> Relativistic Energy Spectrum
            </span>
            <span className="font-mono text-cyan-500 font-semibold tabular-nums">
              {formatE(totalEnergy)}
            </span>
          </div>

          <div
            className={`w-full h-2 rounded-full overflow-hidden flex border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
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

          <div
            className={`flex justify-between items-center text-[10px] font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>
              Rest E₀: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{formatE(totalRestMass)}</strong>
            </span>
            <span>
              Kinetic K: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{formatE(totalKinetic)}</strong>
            </span>
          </div>
        </div>

        {/* 2. SCATTERING ANGLE ANALYSIS */}
        <div
          className={`p-1.5 px-2 border rounded flex items-center justify-between text-[11px] font-mono ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-amber-500 shrink-0" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Angles:</span>
            {scatteringAngles ? (
              <span className="text-amber-500 font-semibold">
                θ₁={scatteringAngles.theta1Deg.toFixed(1)}° · θ₂={scatteringAngles.theta2Deg.toFixed(1)}°
              </span>
            ) : (
              <span className="text-slate-400">Deflecting...</span>
            )}
          </div>

          {scatteringAngles && (
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-500 font-bold">
                Θ={scatteringAngles.totalOpeningDeg.toFixed(1)}°
              </span>
              <span
                className={`text-[9px] px-1 py-0.5 rounded ${
                  scatteringAngles.totalOpeningDeg < 90
                    ? 'bg-emerald-500/20 text-emerald-500 font-semibold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {scatteringAngles.totalOpeningDeg < 90 ? '< 90° Relativistic' : '= 90° Classical'}
              </span>
            </div>
          )}
        </div>

        {/* 3. FOUR-MOMENTUM & INVARIANT MASS CONSERVATION */}
        <div
          className={`p-1.5 px-2 border rounded flex items-center justify-between text-[11px] font-mono ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Invariant Mass √(s): </span>
              <span className="font-semibold text-emerald-500">{formatE(invariantMass)}</span>
            </div>
          </div>

          <div className="text-right text-[10px]">
            <span className={energyDelta < 0.05 ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
              ΔE: {energyDelta.toFixed(3)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
