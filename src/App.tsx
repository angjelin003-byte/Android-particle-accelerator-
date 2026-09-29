/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSimulation } from './physics/useSimulation';
import { ParticleScene3D } from './components/ParticleScene3D';
import { FoldableControlPanel } from './components/FoldableControlPanel';
import { EnergySpectrumBar } from './components/EnergySpectrumBar';
import { TopTelemetryBar } from './components/TopTelemetryBar';
import { ExperimentModal } from './components/ExperimentModal';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  // Collapse panel by default on mobile screens (< 768px) to maximize 3D viewport
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [trailLength, setTrailLength] = useState<number>(200);

  const {
    config,
    setConfig,
    activePreset,
    applyPreset,
    simState,
    resetSimulation,
    togglePlay,
    stepForward,
    particleAId,
    setParticleAId,
    particleBId,
    setParticleBId,
    betaA,
    setBetaA,
    betaB,
    setBetaB,
    impactParameter,
    setImpactParameter,
    customMassA,
    setCustomMassA,
    customMassB,
    setCustomMassB,
    customChargeA,
    setCustomChargeA,
    customChargeB,
    setCustomChargeB,
  } = useSimulation('relativistic_billiards');

  // Ergonomic keyboard shortcuts for laboratory workstation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 's' || e.key === 'S') {
        stepForward();
      } else if (e.key === 'r' || e.key === 'R') {
        resetSimulation();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setIsPanelCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, resetSimulation]);

  return (
    <ThemeProvider>
      <div className={`flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none`}>
      {/* 1. TOP COMPACT TELEMETRY BAR */}
      <TopTelemetryBar
        activePreset={activePreset}
        onSelectPreset={applyPreset}
        isRunning={config.running}
        onTogglePlay={togglePlay}
        onStepForward={stepForward}
        onReset={resetSimulation}
        onOpenGuide={() => setIsGuideOpen(true)}
        isPanelCollapsed={isPanelCollapsed}
        onTogglePanel={() => setIsPanelCollapsed((prev) => !prev)}
      />

      {/* 2. MAIN 3D WORKSPACE ZONE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Foldable Left Control Panel */}
        <FoldableControlPanel
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => setIsPanelCollapsed((prev) => !prev)}
          config={config}
          onConfigChange={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
          particleAId={particleAId}
          onParticleAIdChange={setParticleAId}
          particleBId={particleBId}
          onParticleBIdChange={setParticleBId}
          betaA={betaA}
          onBetaAChange={setBetaA}
          betaB={betaB}
          onBetaBChange={setBetaB}
          impactParameter={impactParameter}
          onImpactParameterChange={setImpactParameter}
          customMassA={customMassA}
          onCustomMassAChange={setCustomMassA}
          customMassB={customMassB}
          onCustomMassBChange={setCustomMassB}
          customChargeA={customChargeA}
          onCustomChargeAChange={setCustomChargeA}
          customChargeB={customChargeB}
          onCustomChargeBChange={setCustomChargeB}
          onPlayPause={togglePlay}
          onStep={stepForward}
          onReset={resetSimulation}
          layout={layout}
          setLayout={setLayout}
          trailLength={trailLength}
          setTrailLength={setTrailLength}
        />

        {/* Center 3D Interactive WebGL Scene */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-50 dark:bg-slate-950">
          <ParticleScene3D
            particles={simState.particles}
            vertex={simState.vertex}
            config={config}
            impactParameter={impactParameter}
            onImpactParameterChange={setImpactParameter}
            scatteringAngles={simState.scatteringAngles}
            trailLength={trailLength}
          />
        </main>
      </div>

      {/* 3. COMPACT BOTTOM ENERGY & TELEMETRY SPECTRUM BAR */}
      {config.showEnergyLevels && (
        <EnergySpectrumBar
          particles={simState.particles}
          initialEnergy={simState.initialTotalEnergy}
          currentEnergy={simState.currentTotalEnergy}
          invariantMass={simState.currentInvariantMass}
          scatteringAngles={simState.scatteringAngles}
        />
      )}

      {/* 4. GUIDED EXPERIMENT THEORY MODAL */}
      <ExperimentModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        activePreset={activePreset}
        onSelectPreset={applyPreset}
      />
      </div>
    </ThemeProvider>
  );
}
