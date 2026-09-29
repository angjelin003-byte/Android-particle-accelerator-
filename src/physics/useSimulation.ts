/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ParticleState,
  SimulationConfig,
  CollisionVertex3D,
  ExperimentPreset,
  ParticleDefinition,
} from '../types/physics';
import {
  PARTICLE_REGISTRY,
  C_SPEED_PIXELS_PER_NS,
  COULOMB_K_SCALE,
} from './constants';
import {
  computeRelativisticProperties3D,
  calculateCoMParameters3D,
  lorentzBoost3D,
  calculateMandelstam,
  calculateClosestApproachFm,
  calculateRutherfordAngleRad,
  transformAngleCoMToLabDeg,
  FourMomentum3D,
} from './relativisticMath';
import { EXPERIMENT_PRESETS } from './presets';

export interface SimulationState3D {
  particles: ParticleState[];
  vertex: CollisionVertex3D | null;
  timeElapsedPs: number;
  initialTotalEnergy: number;
  initialTotalMomentum: { px: number; py: number; pz: number; pTotal: number };
  initialInvariantMass: number;
  currentTotalEnergy: number;
  currentTotalMomentum: { px: number; py: number; pz: number; pTotal: number };
  currentInvariantMass: number;
  scatteringAngles: {
    theta1Deg: number;
    theta2Deg: number;
    totalOpeningDeg: number;
    classicalComparisonDeg: number;
  } | null;
  fps: number;
  hasCollided: boolean;
  minSeparationReachedFm: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  running: true,
  slowMoFactor: 0.02,
  frameIntervalPs: 0.25,
  subSteps: 8,
  coulombEnabled: true,
  coulombStrength: 1.0,
  reactionsEnabled: true,
  relativisticKinematics: true,
  frameOfReference: 'lab',
  theme: 'dark',
  sizeScaleMode: 'realistic',
  showTrails: true,
  trailLength: 140,
  trailStyle: 'ribbon',
  trailWidth: 2.5,
  trailOpacity: 0.7,
  trailColorMode: 'particle',
  interactionSphereEnabled: true,
  interactionSphereRadius: 240,
  autoReloadOnExit: true,
  showScatteringAngles: true,
  showProtractorGrid: true,
  showMomentumVectors: true,
  showVelocityVectors: false,
  showLorentzContraction: true,
  showEnergyLevels: true,
  showDetectorWireframe: true,
};

export function useSimulation(initialPresetId: string = 'relativistic_billiards') {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [activePreset, setActivePreset] = useState<ExperimentPreset>(() => {
    return EXPERIMENT_PRESETS.find((p) => p.id === initialPresetId) || EXPERIMENT_PRESETS[0];
  });

  // Particle beam inputs (user-controllable in real time)
  const [particleAId, setParticleAId] = useState<string>('electron');
  const [particleBId, setParticleBId] = useState<string>('electron');
  const [betaA, setBetaA] = useState<number>(0.92);
  const [betaB, setBetaB] = useState<number>(0.0);
  const [angleADeg, setAngleADeg] = useState<number>(0);
  const [angleBDeg, setAngleBDeg] = useState<number>(0);
  const [impactParameter, setImpactParameter] = useState<number>(14);
  const [impactParameterZ, setImpactParameterZ] = useState<number>(0);
  const [customMassA, setCustomMassA] = useState<number>(0.511);
  const [customMassB, setCustomMassB] = useState<number>(0.511);
  const [customChargeA, setCustomChargeA] = useState<number>(-1);
  const [customChargeB, setCustomChargeB] = useState<number>(-1);

  // Live state reference for requestAnimationFrame
  const particlesRef = useRef<ParticleState[]>([]);
  const vertexRef = useRef<CollisionVertex3D | null>(null);
  const timeElapsedPsRef = useRef<number>(0);
  const hasCollidedRef = useRef<boolean>(false);
  const enteredSphereRef = useRef<boolean>(false);
  const initialEnergyRef = useRef<number>(0);
  const initialMomentumRef = useRef<{ px: number; py: number; pz: number; pTotal: number }>({
    px: 0, py: 0, pz: 0, pTotal: 0,
  });
  const initialInvariantMassRef = useRef<number>(0);
  const minSepRef = useRef<number>(Infinity);

  // Public state exposed to UI
  const [simState, setSimState] = useState<SimulationState3D>({
    particles: [],
    vertex: null,
    timeElapsedPs: 0,
    initialTotalEnergy: 0,
    initialTotalMomentum: { px: 0, py: 0, pz: 0, pTotal: 0 },
    initialInvariantMass: 0,
    currentTotalEnergy: 0,
    currentTotalMomentum: { px: 0, py: 0, pz: 0, pTotal: 0 },
    currentInvariantMass: 0,
    scatteringAngles: null,
    fps: 60,
    hasCollided: false,
    minSeparationReachedFm: 0,
  });

  // Construct a single 3D particle state
  const createParticle = useCallback(
    (
      def: ParticleDefinition,
      x: number,
      y: number,
      z: number,
      vx: number,
      vy: number,
      vz: number,
      role: 'A' | 'B' | null,
      customMass?: number,
      customCharge?: number
    ): ParticleState => {
      const mass = customMass !== undefined ? customMass : def.restMassMeV;
      const charge = customCharge !== undefined ? customCharge : def.charge;
      const relProps = computeRelativisticProperties3D(mass, vx, vy, vz);

      return {
        id: `${def.id}_${Math.random().toString(36).substring(2, 7)}`,
        definitionId: def.id,
        name: def.name,
        symbol: def.symbol,
        color: def.color,
        category: def.category,
        x,
        y,
        z,
        vx,
        vy,
        vz,
        mass,
        charge,
        beta: relProps.beta,
        gamma: relProps.gamma,
        px: relProps.px,
        py: relProps.py,
        pz: relProps.pz,
        pTotal: relProps.pTotal,
        energy: relProps.energy,
        kineticEnergy: relProps.kineticEnergy,
        radius: def.radius,
        nuclearRadiusFm: def.nuclearRadiusFm,
        atomicRadiusPm: def.atomicRadiusPm,
        atomicNumberZ: def.atomicNumberZ,
        massNumberA: def.massNumberA,
        electronShells: def.electronShells,
        isAtom: def.category === 'atom',
        trail: [{ x, y, z, time: 0, beta: relProps.beta }],
        isPrimaryBeam: role,
        isReactionProduct: false,
      };
    },
    []
  );

  // Initialize or reset collision geometry
  const resetSimulation = useCallback(
    (customConfig?: Partial<SimulationConfig>) => {
      const defA = PARTICLE_REGISTRY[particleAId] || PARTICLE_REGISTRY.electron;
      const defB = PARTICLE_REGISTRY[particleBId] || PARTICLE_REGISTRY.electron;

      const radA = (angleADeg * Math.PI) / 180;
      const radB = (angleBDeg * Math.PI) / 180;

      const vxA = betaA * Math.cos(radA);
      const vyA = betaA * Math.sin(radA);
      const vzA = 0;

      const vxB = -betaB * Math.cos(radB);
      const vyB = -betaB * Math.sin(radB);
      const vzB = 0;

      const startXA = -260;
      const startYA = 0;
      const startZA = 0;

      const startXB = betaB === 0 ? 0 : 260;
      const startYB = impactParameter;
      const startZB = impactParameterZ;

      const pA = createParticle(
        defA,
        startXA,
        startYA,
        startZA,
        vxA,
        vyA,
        vzA,
        'A',
        defA.id === 'custom' ? customMassA : undefined,
        defA.id === 'custom' ? customChargeA : undefined
      );

      const pB = createParticle(
        defB,
        startXB,
        startYB,
        startZB,
        vxB,
        vyB,
        vzB,
        'B',
        defB.id === 'custom' ? customMassB : undefined,
        defB.id === 'custom' ? customChargeB : undefined
      );

      particlesRef.current = [pA, pB];
      vertexRef.current = null;
      timeElapsedPsRef.current = 0;
      hasCollidedRef.current = false;
      enteredSphereRef.current = false;
      minSepRef.current = Math.hypot(startXB - startXA, startYB - startYA, startZB - startZA);

      const totE = pA.energy + pB.energy;
      const totPx = pA.px + pB.px;
      const totPy = pA.py + pB.py;
      const totPz = pA.pz + pB.pz;
      const pTot = Math.sqrt(totPx * totPx + totPy * totPy + totPz * totPz);

      initialEnergyRef.current = totE;
      initialMomentumRef.current = { px: totPx, py: totPy, pz: totPz, pTotal: pTot };

      const s = Math.max(0, totE * totE - pTot * pTot);
      initialInvariantMassRef.current = Math.sqrt(s);

      setSimState({
        particles: [pA, pB],
        vertex: null,
        timeElapsedPs: 0,
        initialTotalEnergy: totE,
        initialTotalMomentum: { px: totPx, py: totPy, pz: totPz, pTotal: pTot },
        initialInvariantMass: Math.sqrt(s),
        currentTotalEnergy: totE,
        currentTotalMomentum: { px: totPx, py: totPy, pz: totPz, pTotal: pTot },
        currentInvariantMass: Math.sqrt(s),
        scatteringAngles: null,
        fps: 60,
        hasCollided: false,
        minSeparationReachedFm: minSepRef.current,
      });

      if (customConfig) {
        setConfig((prev) => ({ ...prev, ...customConfig }));
      }
    },
    [
      particleAId,
      particleBId,
      angleADeg,
      angleBDeg,
      betaA,
      betaB,
      impactParameter,
      impactParameterZ,
      customMassA,
      customMassB,
      customChargeA,
      customChargeB,
      createParticle,
    ]
  );

  // Apply Preset
  const applyPreset = useCallback(
    (preset: ExperimentPreset) => {
      setActivePreset(preset);
      setParticleAId(preset.particleA);
      setParticleBId(preset.particleB);
      setBetaA(preset.betaA);
      setBetaB(preset.betaB);
      setAngleADeg(preset.angleADeg);
      setAngleBDeg(preset.angleBDeg);
      setImpactParameter(preset.impactParameter);
      setImpactParameterZ(0);

      setConfig((prev) => ({
        ...prev,
        slowMoFactor: preset.defaultSlowMo,
        coulombEnabled: preset.coulombEnabled,
        coulombStrength: preset.coulombStrength,
        reactionsEnabled: preset.reactionsEnabled,
        running: true,
      }));
    },
    []
  );

  useEffect(() => {
    resetSimulation();
  }, [
    particleAId,
    particleBId,
    betaA,
    betaB,
    angleADeg,
    angleBDeg,
    impactParameter,
    impactParameterZ,
    customMassA,
    customMassB,
    customChargeA,
    customChargeB,
    resetSimulation,
  ]);

  // Integration step using Runge-Kutta 4th Order for 3D relativistic Coulomb & reactions
  const stepSimulation = useCallback(
    (dtScale: number) => {
      const parts = [...particlesRef.current];
      if (parts.length < 2) return;

      const subSteps = config.subSteps;
      const baseDt = (config.frameIntervalPs * config.slowMoFactor * dtScale) / subSteps;
      const c = C_SPEED_PIXELS_PER_NS;

      for (let step = 0; step < subSteps; step++) {
        const pA = parts.find((p) => p.isPrimaryBeam === 'A' && !p.annihilated);
        const pB = parts.find((p) => p.isPrimaryBeam === 'B' && !p.annihilated);

        // Distance of closest approach tracking
        if (pA && pB) {
          const dx = pB.x - pA.x;
          const dy = pB.y - pA.y;
          const dz = pB.z - pA.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist < minSepRef.current) {
            minSepRef.current = dist;
          }

          // Mathematical center coordinates
          const vertexX = (pA.x + pB.x) / 2;
          const vertexY = (pA.y + pB.y) / 2;
          const vertexZ = (pA.z + pB.z) / 2;

          const fourP_A: FourMomentum3D = {
            E: pA.energy,
            px: pA.px,
            py: pA.py,
            pz: pA.pz,
            mass: pA.mass,
          };
          const fourP_B: FourMomentum3D = {
            E: pB.energy,
            px: pB.px,
            py: pB.py,
            pz: pB.pz,
            mass: pB.mass,
          };

          const com = calculateCoMParameters3D(fourP_A, fourP_B);
          const rCollision = pA.radius + pB.radius + 3;

          // 1. Quantum Reactions & Annihilation Channels
          if (config.reactionsEnabled && !hasCollidedRef.current && dist <= rCollision) {
            hasCollidedRef.current = true;

            // Channel A: Higgs Boson Fusion W+ + W- -> H0
            if (
              (pA.definitionId === 'w_plus' && pB.definitionId === 'w_minus') ||
              (pA.definitionId === 'w_minus' && pB.definitionId === 'w_plus')
            ) {
              pA.annihilated = true;
              pB.annihilated = true;
              const defHiggs = PARTICLE_REGISTRY.higgs_boson;
              const higgs = createParticle(defHiggs, vertexX, vertexY, vertexZ, com.bx, com.by, com.bz, null);
              higgs.isReactionProduct = true;
              parts.push(higgs);

              const mandel = calculateMandelstam(fourP_A, fourP_B, fourP_A, fourP_B);
              vertexRef.current = {
                x: vertexX,
                y: vertexY,
                z: vertexZ,
                timePs: timeElapsedPsRef.current,
                closestApproachFm: minSepRef.current,
                energyTotalMeV: com.invariantMass,
                invariantMassMeV: com.invariantMass,
                mandelstam: mandel,
                beamAAngleInDeg: angleADeg,
                beamBAngleInDeg: angleBDeg,
                productAnglesDeg: [0],
                reactionChannel: 'W⁺ + W⁻ → H⁰ (125.25 GeV)',
                cmDeflectionAngleDeg: 0,
              };
              break;
            }

            // Channel B: Gluon-Gluon Fusion -> Top Quark Pair g + g -> t + t_bar
            if (pA.definitionId === 'gluon' && pB.definitionId === 'gluon') {
              pA.annihilated = true;
              pB.annihilated = true;
              const defTop = PARTICLE_REGISTRY.top_quark;
              const top1 = createParticle(defTop, vertexX, vertexY, vertexZ, 0.4, 0.4, 0, null);
              const top2 = createParticle(defTop, vertexX, vertexY, vertexZ, -0.4, -0.4, 0, null);
              top1.isReactionProduct = true;
              top2.isReactionProduct = true;
              parts.push(top1, top2);

              const mandel = calculateMandelstam(fourP_A, fourP_B, fourP_A, fourP_B);
              vertexRef.current = {
                x: vertexX,
                y: vertexY,
                z: vertexZ,
                timePs: timeElapsedPsRef.current,
                closestApproachFm: minSepRef.current,
                energyTotalMeV: com.invariantMass,
                invariantMassMeV: com.invariantMass,
                mandelstam: mandel,
                beamAAngleInDeg: angleADeg,
                beamBAngleInDeg: angleBDeg,
                productAnglesDeg: [45, 225],
                reactionChannel: 'g + g → t + t̄ (345.5 GeV)',
                cmDeflectionAngleDeg: 90,
              };
              break;
            }

            // Channel C: Tau Lepton Pair Creation e- + e+ -> tau- + tau+
            if (
              activePreset.id === 'tau_creation' &&
              ((pA.definitionId === 'electron' && pB.definitionId === 'positron') ||
                (pA.definitionId === 'positron' && pB.definitionId === 'electron'))
            ) {
              pA.annihilated = true;
              pB.annihilated = true;
              const defTau = PARTICLE_REGISTRY.tau_minus;
              const tau1 = createParticle(defTau, vertexX, vertexY, vertexZ, 0.6, 0.5, 0.1, null);
              const tau2 = createParticle(defTau, vertexX, vertexY, vertexZ, -0.6, -0.5, -0.1, null);
              tau1.isReactionProduct = true;
              tau2.isReactionProduct = true;
              parts.push(tau1, tau2);

              const mandel = calculateMandelstam(fourP_A, fourP_B, fourP_A, fourP_B);
              vertexRef.current = {
                x: vertexX,
                y: vertexY,
                z: vertexZ,
                timePs: timeElapsedPsRef.current,
                closestApproachFm: minSepRef.current,
                energyTotalMeV: com.invariantMass,
                invariantMassMeV: com.invariantMass,
                mandelstam: mandel,
                beamAAngleInDeg: angleADeg,
                beamBAngleInDeg: angleBDeg,
                productAnglesDeg: [40, 220],
                reactionChannel: 'e⁻ + e⁺ → τ⁻ + τ⁺ (3.55 GeV)',
                cmDeflectionAngleDeg: 80,
              };
              break;
            }

            // Channel D: Standard Electron-Positron Annihilation -> 2 Photons
            if (
              (pA.definitionId === 'electron' && pB.definitionId === 'positron') ||
              (pA.definitionId === 'positron' && pB.definitionId === 'electron')
            ) {
              pA.annihilated = true;
              pB.annihilated = true;
              const defPhoton = PARTICLE_REGISTRY.photon;
              const g1 = createParticle(defPhoton, vertexX, vertexY, vertexZ, 0.707, 0.707, 0, null);
              const g2 = createParticle(defPhoton, vertexX, vertexY, vertexZ, -0.707, -0.707, 0, null);
              g1.isReactionProduct = true;
              g2.isReactionProduct = true;
              parts.push(g1, g2);

              const mandel = calculateMandelstam(fourP_A, fourP_B, fourP_A, fourP_B);
              vertexRef.current = {
                x: vertexX,
                y: vertexY,
                z: vertexZ,
                timePs: timeElapsedPsRef.current,
                closestApproachFm: minSepRef.current,
                energyTotalMeV: com.invariantMass,
                invariantMassMeV: com.invariantMass,
                mandelstam: mandel,
                beamAAngleInDeg: angleADeg,
                beamBAngleInDeg: angleBDeg,
                productAnglesDeg: [45, 225],
                reactionChannel: 'e⁻ + e⁺ → 2γ (Annihilation)',
                cmDeflectionAngleDeg: 90,
              };
              break;
            }

            // Channel E: Proton-Antiproton Annihilation -> Pions
            if (
              (pA.definitionId === 'proton' && pB.definitionId === 'antiproton') ||
              (pA.definitionId === 'antiproton' && pB.definitionId === 'proton')
            ) {
              pA.annihilated = true;
              pB.annihilated = true;
              const pi0 = PARTICLE_REGISTRY.pion_neutral;
              const piP = PARTICLE_REGISTRY.pion_plus;
              const p1 = createParticle(pi0, vertexX, vertexY, vertexZ, 0.7 * Math.cos(0.2), 0.7 * Math.sin(0.2), 0.1, null);
              const p2 = createParticle(piP, vertexX, vertexY, vertexZ, 0.7 * Math.cos(2.3), 0.7 * Math.sin(2.3), -0.1, null);
              const p3 = createParticle(pi0, vertexX, vertexY, vertexZ, 0.7 * Math.cos(4.4), 0.7 * Math.sin(4.4), 0.05, null);
              p1.isReactionProduct = true;
              p2.isReactionProduct = true;
              p3.isReactionProduct = true;
              parts.push(p1, p2, p3);

              const mandel = calculateMandelstam(fourP_A, fourP_B, fourP_A, fourP_B);
              vertexRef.current = {
                x: vertexX,
                y: vertexY,
                z: vertexZ,
                timePs: timeElapsedPsRef.current,
                closestApproachFm: minSepRef.current,
                energyTotalMeV: com.invariantMass,
                invariantMassMeV: com.invariantMass,
                mandelstam: mandel,
                beamAAngleInDeg: angleADeg,
                beamBAngleInDeg: angleBDeg,
                productAnglesDeg: [11.5, 131.8, 252.1],
                reactionChannel: 'p⁺ + p̄⁻ → π⁺ + π⁻ + π⁰',
                cmDeflectionAngleDeg: 120,
              };
              break;
            }
          }
        }

        // 2. 3D Relativistic Force Integration (RK4 Coulomb)
        const activeParticles = parts.filter((p) => !p.annihilated);
        const forces: Array<{ fx: number; fy: number; fz: number }> = activeParticles.map(() => ({
          fx: 0,
          fy: 0,
          fz: 0,
        }));

        if (config.coulombEnabled) {
          const kCoulomb = COULOMB_K_SCALE * config.coulombStrength;

          for (let i = 0; i < activeParticles.length; i++) {
            for (let j = i + 1; j < activeParticles.length; j++) {
              const pi = activeParticles[i];
              const pj = activeParticles[j];

              const dx = pj.x - pi.x;
              const dy = pj.y - pi.y;
              const dz = pj.z - pi.z;
              const r2 = dx * dx + dy * dy + dz * dz;
              const r = Math.sqrt(r2);

              const epsilon = 12.0;
              const rSoftened2 = r2 + epsilon * epsilon;

              const fMag = (kCoulomb * pi.charge * pj.charge) / rSoftened2;
              const fx = (fMag * dx) / (r + 1e-6);
              const fy = (fMag * dy) / (r + 1e-6);
              const fz = (fMag * dz) / (r + 1e-6);

              forces[i].fx -= fx;
              forces[i].fy -= fy;
              forces[i].fz -= fz;
              forces[j].fx += fx;
              forces[j].fy += fy;
              forces[j].fz += fz;

              // Vertex recording at closest approach
              if (
                !vertexRef.current &&
                pi.isPrimaryBeam === 'A' &&
                pj.isPrimaryBeam === 'B' &&
                r < 32
              ) {
                const totE = pi.energy + pj.energy;
                const totPx = pi.px + pj.px;
                const totPy = pi.py + pj.py;
                const totPz = pi.pz + pj.pz;
                const s = Math.max(0, totE * totE - (totPx * totPx + totPy * totPy + totPz * totPz));

                const fourP_i: FourMomentum3D = { E: pi.energy, px: pi.px, py: pi.py, pz: pi.pz, mass: pi.mass };
                const fourP_j: FourMomentum3D = { E: pj.energy, px: pj.px, py: pj.py, pz: pj.pz, mass: pj.mass };
                const mandel = calculateMandelstam(fourP_i, fourP_j, fourP_i, fourP_j);

                const rMinCalc = calculateClosestApproachFm(
                  impactParameter,
                  pi.charge,
                  pj.charge,
                  Math.max(1, (totE - pi.mass - pj.mass) / 2)
                );

                const thetaCmRad = calculateRutherfordAngleRad(
                  impactParameter,
                  pi.charge,
                  pj.charge,
                  Math.hypot(pi.px, pi.py, pi.pz),
                  Math.hypot(pi.vx, pi.vy, pi.vz)
                );

                vertexRef.current = {
                  x: (pi.x + pj.x) / 2,
                  y: (pi.y + pj.y) / 2,
                  z: (pi.z + pj.z) / 2,
                  timePs: timeElapsedPsRef.current,
                  closestApproachFm: rMinCalc,
                  energyTotalMeV: totE,
                  invariantMassMeV: Math.sqrt(s),
                  mandelstam: mandel,
                  beamAAngleInDeg: angleADeg,
                  beamBAngleInDeg: angleBDeg,
                  productAnglesDeg: [],
                  cmDeflectionAngleDeg: (thetaCmRad * 180) / Math.PI,
                };
              }
            }
          }
        }

        // 3. Elastic Contact Bounce in 3D
        for (let i = 0; i < activeParticles.length; i++) {
          for (let j = i + 1; j < activeParticles.length; j++) {
            const pi = activeParticles[i];
            const pj = activeParticles[j];
            if (pi.mass === 0 || pj.mass === 0) continue;

            const dx = pj.x - pi.x;
            const dy = pj.y - pi.y;
            const dz = pj.z - pi.z;
            const dist = Math.hypot(dx, dy, dz);
            const rMin = (pi.radius + pj.radius) * 0.95;

            const relVx = pj.vx - pi.vx;
            const relVy = pj.vy - pi.vy;
            const relVz = pj.vz - pi.vz;
            const approaching = dx * relVx + dy * relVy + dz * relVz < 0;

            if (dist < rMin && approaching) {
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              // Elastic impulse
              const k = 2 * (pi.mass * pj.mass) / (pi.mass + pj.mass);
              const vDotN = relVx * nx + relVy * ny + relVz * nz;
              const jImpulse = k * vDotN;

              pi.px += (jImpulse * nx) / 10;
              pi.py += (jImpulse * ny) / 10;
              pi.pz += (jImpulse * nz) / 10;
              pj.px -= (jImpulse * nx) / 10;
              pj.py -= (jImpulse * ny) / 10;
              pj.pz -= (jImpulse * nz) / 10;
            }
          }
        }

        // 4. Update 3D particle positions & 4-momenta
        for (let i = 0; i < activeParticles.length; i++) {
          const p = activeParticles[i];
          if (p.mass === 0) {
            const pNorm = Math.hypot(p.vx, p.vy, p.vz);
            const dirX = pNorm > 1e-9 ? p.vx / pNorm : 1;
            const dirY = pNorm > 1e-9 ? p.vy / pNorm : 0;
            const dirZ = pNorm > 1e-9 ? p.vz / pNorm : 0;
            p.vx = dirX;
            p.vy = dirY;
            p.vz = dirZ;
            p.x += dirX * c * baseDt;
            p.y += dirY * c * baseDt;
            p.z += dirZ * c * baseDt;
          } else {
            p.px += forces[i].fx * baseDt;
            p.py += forces[i].fy * baseDt;
            p.pz += forces[i].fz * baseDt;

            const pSq = p.px * p.px + p.py * p.py + p.pz * p.pz;
            const energy = Math.sqrt(pSq + p.mass * p.mass);
            p.energy = energy;
            p.kineticEnergy = energy - p.mass;

            p.vx = p.px / energy;
            p.vy = p.py / energy;
            p.vz = p.pz / energy;
            p.pTotal = Math.sqrt(pSq);
            p.beta = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
            p.gamma = p.energy / p.mass;

            p.x += p.vx * c * baseDt;
            p.y += p.vy * c * baseDt;
            p.z += p.vz * c * baseDt;
          }

          if (step % 2 === 0) {
            p.trail.push({ x: p.x, y: p.y, z: p.z, time: timeElapsedPsRef.current, beta: p.beta });
            if (p.trail.length > config.trailLength) {
              p.trail.shift();
            }
          }
        }
      }

      // Check if particles entered the chamber (closest approach started)
      const pA_active = parts.find((p) => p.isPrimaryBeam === 'A' && !p.annihilated);
      const pB_active = parts.find((p) => p.isPrimaryBeam === 'B' && !p.annihilated);
      const sphereR = config.interactionSphereRadius;
      if (
        (pA_active && Math.hypot(pA_active.x, pA_active.y, pA_active.z) < sphereR * 0.8) ||
        (pB_active && Math.hypot(pB_active.x, pB_active.y, pB_active.z) < sphereR * 0.8) ||
        hasCollidedRef.current ||
        vertexRef.current
      ) {
        enteredSphereRef.current = true;
      }

      // Sphere of Interaction: when at least 1 particle exits the sphere, reload interaction
      if (config.interactionSphereEnabled && config.autoReloadOnExit && enteredSphereRef.current) {
        const sphereR2 = sphereR * sphereR;
        let particleExited = false;
        for (const p of parts) {
          if (p.annihilated) continue;
          const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
          if (r2 > sphereR2) {
            particleExited = true;
            break;
          }
        }
        if (particleExited) {
          resetSimulation();
          return;
        }
      }

      timeElapsedPsRef.current += config.frameIntervalPs * config.slowMoFactor * dtScale;
      particlesRef.current = parts;

      // 5. Scattering Angles Calculation
      const pA = parts.find((p) => p.isPrimaryBeam === 'A');
      const pB = parts.find((p) => p.isPrimaryBeam === 'B');
      let angles = null;

      if (pA && pB && (pA.x > -50 || hasCollidedRef.current || vertexRef.current)) {
        const inAngleA = (angleADeg * Math.PI) / 180;
        const curAngleA = Math.atan2(pA.vy, pA.vx);
        let dThetaA = Math.abs(curAngleA - inAngleA) * (180 / Math.PI);
        if (dThetaA > 180) dThetaA = 360 - dThetaA;

        const inAngleB = (angleBDeg * Math.PI) / 180;
        const curAngleB = Math.atan2(pB.vy, pB.vx);
        let dThetaB = Math.abs(curAngleB - inAngleB) * (180 / Math.PI);
        if (dThetaB > 180) dThetaB = 360 - dThetaB;

        angles = {
          theta1Deg: dThetaA,
          theta2Deg: dThetaB,
          totalOpeningDeg: dThetaA + dThetaB,
          classicalComparisonDeg: 90.0,
        };
      }

      const activeParts = parts.filter((p) => !p.annihilated);
      const curE = activeParts.reduce((acc, p) => acc + p.energy, 0);
      const curPx = activeParts.reduce((acc, p) => acc + p.px, 0);
      const curPy = activeParts.reduce((acc, p) => acc + p.py, 0);
      const curPz = activeParts.reduce((acc, p) => acc + p.pz, 0);
      const curPTot = Math.sqrt(curPx * curPx + curPy * curPy + curPz * curPz);
      const curInvMass = Math.sqrt(Math.max(0, curE * curE - curPTot * curPTot));

      setSimState({
        particles: parts,
        vertex: vertexRef.current,
        timeElapsedPs: timeElapsedPsRef.current,
        initialTotalEnergy: initialEnergyRef.current,
        initialTotalMomentum: initialMomentumRef.current,
        initialInvariantMass: initialInvariantMassRef.current,
        currentTotalEnergy: curE,
        currentTotalMomentum: { px: curPx, py: curPy, pz: curPz, pTotal: curPTot },
        currentInvariantMass: curInvMass,
        scatteringAngles: angles,
        fps: 60,
        hasCollided: hasCollidedRef.current,
        minSeparationReachedFm: minSepRef.current,
      });
    },
    [
      config.subSteps,
      config.frameIntervalPs,
      config.slowMoFactor,
      config.reactionsEnabled,
      config.coulombEnabled,
      config.coulombStrength,
      config.trailLength,
      activePreset.id,
      angleADeg,
      angleBDeg,
      impactParameter,
      createParticle,
    ]
  );

  // Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dtMs = now - lastTime;
      lastTime = now;
      const dtScale = Math.min(2.0, Math.max(0.2, dtMs / 16.666));

      if (config.running) {
        stepSimulation(dtScale);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [config.running, stepSimulation]);

  const stepForward = useCallback(() => {
    stepSimulation(1.0);
  }, [stepSimulation]);

  const togglePlay = useCallback(() => {
    setConfig((prev) => ({ ...prev, running: !prev.running }));
  }, []);

  return {
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
    angleADeg,
    setAngleADeg,
    angleBDeg,
    setAngleBDeg,
    impactParameter,
    setImpactParameter,
    impactParameterZ,
    setImpactParameterZ,
    customMassA,
    setCustomMassA,
    customMassB,
    setCustomMassB,
    customChargeA,
    setCustomChargeA,
    customChargeB,
    setCustomChargeB,
  };
}
