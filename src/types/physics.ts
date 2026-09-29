/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ParticleCategory =
  | 'quark'
  | 'lepton'
  | 'gauge_boson'
  | 'scalar_boson'
  | 'baryon'
  | 'meson'
  | 'nucleus'
  | 'custom';

export interface ParticleDefinition {
  id: string;
  name: string;
  symbol: string;
  category: ParticleCategory;
  generation?: 1 | 2 | 3;
  restMassMeV: number;     // in MeV/c^2
  charge: number;          // in elementary charges e (can be fractional for quarks)
  spin: string;            // e.g. "1/2", "1", "0"
  radius: number;          // visual render radius
  color: string;           // visual primary hex/rgb
  secondaryColor?: string;
  description: string;
  isAntiparticle?: boolean;
}

export interface ParticleState {
  id: string;
  definitionId: string;
  name: string;
  symbol: string;
  color: string;
  category: ParticleCategory;
  
  // 3D Spatial coordinates in laboratory frame (in femtometers / simulation scale)
  x: number;
  y: number;
  z: number;
  
  // 3D Velocity in units of c (-1 < vx, vy, vz < 1, |v| < 1)
  vx: number;
  vy: number;
  vz: number;
  
  // Relativistic parameters
  mass: number;            // in MeV/c^2
  charge: number;          // in elementary charge e
  beta: number;            // |v| / c
  gamma: number;           // 1 / sqrt(1 - beta^2)
  px: number;              // relativistic momentum x (MeV/c)
  py: number;              // relativistic momentum y (MeV/c)
  pz: number;              // relativistic momentum z (MeV/c)
  pTotal: number;          // total 3-momentum |p| (MeV/c)
  energy: number;          // total relativistic energy E = gamma * m * c^2 (MeV)
  kineticEnergy: number;   // K = E - m*c^2 (MeV)
  
  // Visual geometry
  radius: number;
  
  // 3D Trajectory history for trails
  trail: Array<{ x: number; y: number; z: number; time: number }>;
  
  // Collision lifecycle flags
  isPrimaryBeam: 'A' | 'B' | null;
  isReactionProduct: boolean;
  annihilated?: boolean;
  scatteringAngleDeg?: number;
}

export interface MandelstamVariables {
  s: number; // (p1 + p2)^2 in (MeV)^2
  t: number; // (p1 - p3)^2 momentum transfer squared
  u: number; // (p1 - p4)^2
  sqrtS: number; // Invariant mass in MeV
  sumInvariantCheck: number; // s + t + u
}

export interface CollisionVertex3D {
  x: number;
  y: number;
  z: number;
  timePs: number;
  closestApproachFm: number;   // r_min distance in femtometers
  energyTotalMeV: number;
  invariantMassMeV: number;
  mandelstam: MandelstamVariables;
  beamAAngleInDeg: number;
  beamBAngleInDeg: number;
  productAnglesDeg: number[];
  reactionChannel?: string;
  cmDeflectionAngleDeg: number;
}

export interface ExperimentPreset {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  theoryNotes: string[];
  particleA: string;
  particleB: string;
  betaA: number;
  betaB: number;
  angleADeg: number;
  angleBDeg: number;
  impactParameter: number; // in pixels / scale
  coulombEnabled: boolean;
  reactionsEnabled: boolean;
  coulombStrength: number;
  defaultSlowMo: number;
  focusHighlights: string[];
}

export interface SimulationConfig {
  running: boolean;
  slowMoFactor: number;       // speed multiplier (0.001 to 0.2)
  frameIntervalPs: number;    // simulation step dt in picoseconds
  subSteps: number;           // RK4 sub-steps per animation frame
  coulombEnabled: boolean;
  coulombStrength: number;
  reactionsEnabled: boolean;
  relativisticKinematics: boolean;
  frameOfReference: 'lab' | 'com';
  
  // 3D Visualization overlays
  showScatteringAngles: boolean;
  showProtractorGrid: boolean;
  showMomentumVectors: boolean;
  showVelocityVectors: boolean;
  showLorentzContraction: boolean;
  showTrails: boolean;
  showEnergyLevels: boolean;
  showDetectorWireframe: boolean;
  trailLength: number;
}
