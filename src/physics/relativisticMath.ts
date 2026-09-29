/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MandelstamVariables } from '../types/physics';

export interface FourMomentum3D {
  E: number;   // Total Energy (MeV)
  px: number;  // Momentum x (MeV/c)
  py: number;  // Momentum y (MeV/c)
  pz: number;  // Momentum z (MeV/c)
  mass: number; // Rest mass (MeV/c^2)
}

export function clampBeta(beta: number): number {
  return Math.min(Math.max(beta, -0.9999), 0.9999);
}

export function calculateGamma(beta: number): number {
  const b = clampBeta(Math.abs(beta));
  return 1 / Math.sqrt(Math.max(1e-12, 1 - b * b));
}

/**
 * Computes 3D relativistic momentum, gamma, and energy
 */
export function computeRelativisticProperties3D(
  mass: number,
  vx: number,
  vy: number,
  vz: number = 0
): {
  beta: number;
  gamma: number;
  px: number;
  py: number;
  pz: number;
  pTotal: number;
  energy: number;
  kineticEnergy: number;
} {
  const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const beta = clampBeta(vMag);
  
  if (mass === 0) {
    // Massless particle (e.g. photon, gluon)
    const normX = vMag > 1e-9 ? vx / vMag : 1;
    const normY = vMag > 1e-9 ? vy / vMag : 0;
    const normZ = vMag > 1e-9 ? vz / vMag : 0;
    const defaultEnergy = 100; // 100 MeV reference
    return {
      beta: 1.0,
      gamma: Infinity,
      px: defaultEnergy * normX,
      py: defaultEnergy * normY,
      pz: defaultEnergy * normZ,
      pTotal: defaultEnergy,
      energy: defaultEnergy,
      kineticEnergy: defaultEnergy,
    };
  }

  const gamma = calculateGamma(beta);
  const px = gamma * mass * vx;
  const py = gamma * mass * vy;
  const pz = gamma * mass * vz;
  const pTotal = Math.sqrt(px * px + py * py + pz * pz);
  const energy = gamma * mass; // In c = 1 units
  const kineticEnergy = (gamma - 1) * mass;

  return {
    beta,
    gamma,
    px,
    py,
    pz,
    pTotal,
    energy,
    kineticEnergy,
  };
}

/**
 * 3D Lorentz Boost of 4-momentum by 3D boost velocity (bx, by, bz)
 */
export function lorentzBoost3D(
  p: FourMomentum3D,
  bx: number,
  by: number,
  bz: number = 0
): FourMomentum3D {
  const b2 = bx * bx + by * by + bz * bz;
  if (b2 < 1e-12) return { ...p };

  const bMag = Math.sqrt(b2);
  if (bMag >= 0.9999) {
    const scale = 0.9998 / bMag;
    bx *= scale;
    by *= scale;
    bz *= scale;
  }

  const gamma = 1 / Math.sqrt(1 - (bx * bx + by * by + bz * bz));
  const bDotP = bx * p.px + by * p.py + bz * p.pz;

  // E' = gamma * (E - b . p)
  // p' = p + ((gamma - 1) * (b . p) / b^2 - gamma * E) * b
  const newE = gamma * (p.E - bDotP);
  const factor = (gamma - 1) * (bDotP / (bx * bx + by * by + bz * bz)) - gamma * p.E;
  const newPx = p.px + factor * bx;
  const newPy = p.py + factor * by;
  const newPz = p.pz + factor * bz;

  return {
    E: Math.max(p.mass, newE),
    px: newPx,
    py: newPy,
    pz: newPz,
    mass: p.mass,
  };
}

/**
 * Center-of-Momentum Frame Parameters in 3D
 */
export function calculateCoMParameters3D(
  p1: FourMomentum3D,
  p2: FourMomentum3D
): {
  bx: number;
  by: number;
  bz: number;
  betaCoM: number;
  gammaCoM: number;
  invariantMass: number;
} {
  const totalE = p1.E + p2.E;
  const totalPx = p1.px + p2.px;
  const totalPy = p1.py + p2.py;
  const totalPz = p1.pz + p2.pz;

  const bx = totalPx / totalE;
  const by = totalPy / totalE;
  const bz = totalPz / totalE;
  const betaCoM = clampBeta(Math.sqrt(bx * bx + by * by + bz * bz));
  const gammaCoM = calculateGamma(betaCoM);

  const s = totalE * totalE - (totalPx * totalPx + totalPy * totalPy + totalPz * totalPz);
  const invariantMass = Math.sqrt(Math.max(0, s));

  return {
    bx,
    by,
    bz,
    betaCoM,
    gammaCoM,
    invariantMass,
  };
}

/**
 * Calculates Mandelstam Invariant Variables (s, t, u)
 * s = (p1 + p2)^2
 * t = (p1 - p3)^2
 * u = (p1 - p4)^2
 */
export function calculateMandelstam(
  p1: FourMomentum3D,
  p2: FourMomentum3D,
  p3: FourMomentum3D,
  p4: FourMomentum3D
): MandelstamVariables {
  // s = (E1 + E2)^2 - (p1 + p2)^2
  const sE = p1.E + p2.E;
  const sPx = p1.px + p2.px;
  const sPy = p1.py + p2.py;
  const sPz = p1.pz + p2.pz;
  const s = sE * sE - (sPx * sPx + sPy * sPy + sPz * sPz);

  // t = (E1 - E3)^2 - (p1 - p3)^2
  const tE = p1.E - p3.E;
  const tPx = p1.px - p3.px;
  const tPy = p1.py - p3.py;
  const tPz = p1.pz - p3.pz;
  const t = tE * tE - (tPx * tPx + tPy * tPy + tPz * tPz);

  // u = (E1 - E4)^2 - (p1 - p4)^2
  const uE = p1.E - p4.E;
  const uPx = p1.px - p4.px;
  const uPy = p1.py - p4.py;
  const uPz = p1.pz - p4.pz;
  const u = uE * uE - (uPx * uPx + uPy * uPy + uPz * uPz);

  const sqrtS = Math.sqrt(Math.max(0, s));
  const sumInvariantCheck = s + t + u;

  return {
    s,
    t,
    u,
    sqrtS,
    sumInvariantCheck,
  };
}

/**
 * Mathematical center of collision: Exact distance of closest approach (r_min)
 * In relativistic Coulomb scattering:
 * r_min = [k * q1 * q2 / (2 * E_kin_cm)] * [ 1 + sqrt( 1 + (2 * b * E_kin_cm / (k * q1 * q2))^2 ) ]
 */
export function calculateClosestApproachFm(
  bFm: number,
  q1: number,
  q2: number,
  kineticEnergyCmMeV: number,
  kCoupling = 1.44 // e^2 / (4 * pi * eps_0) ~ 1.44 MeV * fm
): number {
  if (Math.abs(q1 * q2) < 1e-4) {
    // Uncharged particle (straight impact line)
    return Math.abs(bFm);
  }

  const alpha = (kCoupling * q1 * q2) / Math.max(1e-4, 2 * kineticEnergyCmMeV);
  const term = (2 * bFm * kineticEnergyCmMeV) / (kCoupling * q1 * q2);
  const rMin = alpha * (1 + Math.sqrt(1 + term * term));
  return Math.max(0.1, Math.abs(rMin));
}

/**
 * Center-of-Momentum Deflection Angle for Relativistic Coulomb / Rutherford Scattering
 * theta_cm = 2 * arctan( (k * |q1 * q2|) / (2 * b * p_cm * v_cm) )
 */
export function calculateRutherfordAngleRad(
  bFm: number,
  q1: number,
  q2: number,
  pCm: number,
  vCm: number,
  kCoupling = 1.44
): number {
  if (Math.abs(bFm) < 1e-3) return Math.PI; // Head-on reflection = 180 deg
  if (Math.abs(q1 * q2) < 1e-4) return 0; // Neutral particle no deflection

  const numerator = kCoupling * Math.abs(q1 * q2);
  const denominator = 2 * Math.abs(bFm) * pCm * vCm;
  return 2 * Math.atan(numerator / Math.max(1e-6, denominator));
}

/**
 * Relativistic Transformation from CoM Scattering Angle to Laboratory Angles
 * tan(theta_lab) = sin(theta*) / [ gamma_boost * (cos(theta*) + beta_boost / beta*) ]
 */
export function transformAngleCoMToLabDeg(
  thetaStarRad: number,
  betaBoost: number,
  betaStar: number
): number {
  const gammaBoost = calculateGamma(betaBoost);
  const sinT = Math.sin(thetaStarRad);
  const cosT = Math.cos(thetaStarRad);

  const denom = gammaBoost * (cosT + betaBoost / Math.max(1e-6, betaStar));
  let thetaLabRad = Math.atan2(sinT, denom);
  if (thetaLabRad < 0) thetaLabRad += Math.PI;
  return (thetaLabRad * 180) / Math.PI;
}
