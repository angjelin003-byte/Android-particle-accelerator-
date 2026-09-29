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

export default function App() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerHeight > window.innerWidth && window.innerWidth < 768 : false;
  });

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

  // Handle Orientation Changes (Horizontal vs Vertical compatibility)
  useEffect(() => {
    const handleResize = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortrait(portrait);
      if (portrait) {
        setIsPanelCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Sync Theme with document root
  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [config.theme]);

  // Keyboard shortcuts for laboratory workstation
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

  const toggleTheme = () => {
    setConfig((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const isDark = config.theme === 'dark';

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. TOP TELEMETRY BAR */}
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
        theme={config.theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. MAIN 3D WORKSPACE ZONE (Adapts for horizontal vs vertical viewport) */}
      <div className={`flex-1 flex overflow-hidden relative ${isPortrait ? 'flex-col' : 'flex-row'}`}>
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
        />

        {/* Center 3D Interactive WebGL Scene */}
        <main
          className={`flex-1 relative overflow-hidden transition-colors ${
            isDark ? 'bg-slate-950' : 'bg-slate-50'
          }`}
        >
          <ParticleScene3D
            particles={simState.particles}
            vertex={simState.vertex}
            config={config}
            onConfigChange={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
            impactParameter={impactParameter}
            onImpactParameterChange={setImpactParameter}
            scatteringAngles={simState.scatteringAngles}
            onResetSimulation={resetSimulation}
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
          theme={config.theme}
        />
      )}

      {/* 4. GUIDED EXPERIMENT THEORY MODAL */}
      <ExperimentModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        activePreset={activePreset}
        onSelectPreset={applyPreset}
        theme={config.theme}
      />
    </div>
  );
}
