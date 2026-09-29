/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ParticleState,
  CollisionVertex3D,
  SimulationConfig,
  TrailStyle,
  SizeScaleMode,
} from '../types/physics';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  Move,
  Maximize2,
  Sliders,
  Sparkles,
  Layers,
  Circle,
  Eye,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  Zap,
} from 'lucide-react';

interface ParticleScene3DProps {
  particles: ParticleState[];
  vertex: CollisionVertex3D | null;
  config: SimulationConfig;
  onConfigChange: (updates: Partial<SimulationConfig>) => void;
  impactParameter: number;
  onImpactParameterChange: (b: number) => void;
  scatteringAngles: {
    theta1Deg: number;
    theta2Deg: number;
    totalOpeningDeg: number;
    classicalComparisonDeg: number;
  } | null;
  onResetSimulation: () => void;
}

export const ParticleScene3D: React.FC<ParticleScene3DProps> = ({
  particles,
  vertex,
  config,
  onConfigChange,
  impactParameter,
  onImpactParameterChange,
  scatteringAngles,
  onResetSimulation,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Mesh registries for live updates without garbage collection thrashing
  const particleMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const vectorArrowsRef = useRef<Map<string, THREE.ArrowHelper>>(new Map());
  const vertexGroupRef = useRef<THREE.Group | null>(null);
  const detectorChamberRef = useRef<THREE.Group | null>(null);
  const protractorRingsRef = useRef<THREE.Group | null>(null);
  const interactionSphereGroupRef = useRef<THREE.Group | null>(null);

  // Orbit & Pan controls state (touch + mouse)
  const isInteractingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number>(0);
  const touchStartMidpointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const angularVelocityRef = useRef<{ theta: number; phi: number }>({ theta: 0, phi: 0 });
  const inertiaAnimationRef = useRef<number | null>(null);

  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 440,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });

  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'side'>('perspective');
  const [isTrailEditorOpen, setIsTrailEditorOpen] = useState<boolean>(false);
  const [isMathHUDOpen, setIsMathHUDOpen] = useState<boolean>(true);

  // Update camera position from spherical coordinates & pan target
  const updateCameraPosition = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const target = cameraTargetRef.current;
    const { radius, theta, phi } = cameraSphericalRef.current;
    camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = target.y + radius * Math.cos(phi);
    camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    camera.lookAt(target.x, target.y, target.z);
  }, []);

  // Momentum Inertia Simulation
  const applyInertia = useCallback(() => {
    if (isInteractingRef.current) return;
    const vel = angularVelocityRef.current;
    if (Math.abs(vel.theta) > 0.00008 || Math.abs(vel.phi) > 0.00008) {
      const sph = cameraSphericalRef.current;
      sph.theta -= vel.theta;
      sph.phi = Math.max(0.06, Math.min(Math.PI - 0.06, sph.phi - vel.phi));
      vel.theta *= 0.92;
      vel.phi *= 0.92;
      updateCameraPosition();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
    }
  }, [updateCameraPosition]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isDark = config.theme === 'dark';
    const bgColor = isDark ? 0x07090e : 0xf8fafc;
    const fogDensity = isDark ? 0.001 : 0.0008;

    // 1. Scene & Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, fogDensity);
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.25 : 1.05;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Studio Collider Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.65 : 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(isDark ? 0x06b6d4 : 0x0284c7, isDark ? 2.0 : 1.6);
    keyLight.position.set(250, 350, 250);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(isDark ? 0xf59e0b : 0xd97706, isDark ? 1.4 : 1.1);
    fillLight.position.set(-250, -120, -250);
    scene.add(fillLight);

    // 5. Cylindrical Collider / Drift Chamber
    const chamberGroup = new THREE.Group();
    detectorChamberRef.current = chamberGroup;

    const cylinderGeo = new THREE.CylinderGeometry(280, 280, 800, 24, 8, true);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x1e293b : 0x94a3b8,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.16 : 0.22,
    });
    const barrel = new THREE.Mesh(cylinderGeo, cylinderMat);
    barrel.rotation.z = Math.PI / 2;
    chamberGroup.add(barrel);

    [-400, -200, 0, 200, 400].forEach((xPos) => {
      const ringGeo = new THREE.RingGeometry(278, 282, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x334155 : 0x64748b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDark ? 0.25 : 0.3,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.x = xPos;
      ring.rotation.y = Math.PI / 2;
      chamberGroup.add(ring);
    });

    scene.add(chamberGroup);

    // 6. Polar Protractor & Angle Ring
    const protractorGroup = new THREE.Group();
    protractorRingsRef.current = protractorGroup;

    [50, 100, 160, 240].forEach((radius) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const geom = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, p.y, 0)));
      const lineMat = new THREE.LineBasicMaterial({
        color: radius === 240 ? (isDark ? 0x06b6d4 : 0x0284c7) : (isDark ? 0x334155 : 0x94a3b8),
        transparent: true,
        opacity: radius === 240 ? 0.4 : 0.2,
      });
      const circle = new THREE.Line(geom, lineMat);
      protractorGroup.add(circle);
    });

    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const points = [
        new THREE.Vector3(30 * Math.cos(rad), 30 * Math.sin(rad), 0),
        new THREE.Vector3(240 * Math.cos(rad), 240 * Math.sin(rad), 0),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const spokeMat = new THREE.LineBasicMaterial({
        color: deg % 90 === 0 ? (isDark ? 0x06b6d4 : 0x0284c7) : (isDark ? 0x1e293b : 0xcbd5e1),
        transparent: true,
        opacity: deg % 90 === 0 ? 0.45 : 0.2,
      });
      protractorGroup.add(new THREE.Line(geom, spokeMat));
    }

    scene.add(protractorGroup);

    // 7. Sphere of Interaction (Interaction Chamber)
    const interactionGroup = new THREE.Group();
    interactionSphereGroupRef.current = interactionGroup;
    scene.add(interactionGroup);

    // 8. Vertex Shockwave Ripple Group
    const vGroup = new THREE.Group();
    vertexGroupRef.current = vGroup;
    scene.add(vGroup);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (inertiaAnimationRef.current) cancelAnimationFrame(inertiaAnimationRef.current);
      renderer.dispose();
    };
  }, [config.theme, updateCameraPosition]);

  // Update Sphere of Interaction geometry
  useEffect(() => {
    const group = interactionSphereGroupRef.current;
    if (!group) return;
    group.clear();

    if (!config.interactionSphereEnabled) return;

    const isDark = config.theme === 'dark';
    const R = config.interactionSphereRadius;

    // Outer boundary wireframe sphere
    const sphereGeo = new THREE.SphereGeometry(R, 28, 20);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x06b6d4 : 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.12 : 0.18,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphereMesh);

    // Glowing equator ring
    const equatorGeo = new THREE.RingGeometry(R - 1.5, R + 1.5, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const equator = new THREE.Mesh(equatorGeo, equatorMat);
    equator.rotation.x = Math.PI / 2;
    group.add(equator);

    // Longitudinal boundary ring
    const meridian = new THREE.Mesh(equatorGeo, equatorMat);
    meridian.rotation.y = Math.PI / 2;
    group.add(meridian);
  }, [config.interactionSphereEnabled, config.interactionSphereRadius, config.theme]);

  // Handle visibility toggles on detector chamber and protractor
  useEffect(() => {
    if (detectorChamberRef.current) {
      detectorChamberRef.current.visible = config.showDetectorWireframe;
    }
    if (protractorRingsRef.current) {
      protractorRingsRef.current.visible = config.showProtractorGrid;
    }
  }, [config.showDetectorWireframe, config.showProtractorGrid]);

  // Update Particles, 3D Lorentz Contraction, Trails, and Vectors in Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMeshes = particleMeshesRef.current;
    const currentTrails = trailObjectsRef.current;
    const currentVectors = vectorArrowsRef.current;
    const isDark = config.theme === 'dark';

    const activeIds = new Set<string>();

    particles.forEach((p) => {
      if (p.annihilated) return;
      activeIds.add(p.id);

      // 1. Determine Realistic vs Enhanced Particle Size
      let displayRadius = p.radius;
      if (config.sizeScaleMode === 'realistic') {
        if (p.isAtom && p.atomicRadiusPm) {
          // Logarithmic/perceptual physical scaling for atoms
          displayRadius = Math.max(14, Math.min(34, 12 + Math.log2(p.atomicRadiusPm / 40) * 8));
        } else if (p.nuclearRadiusFm) {
          displayRadius = Math.max(5, Math.min(22, 5 + p.nuclearRadiusFm * 2.2));
        } else {
          // Elementary subatomic particles (leptons, quarks, bosons)
          displayRadius = p.category === 'lepton' ? 4.5 : p.category === 'quark' ? 5.0 : 6.0;
        }
      }

      // 2. Particle 3D Mesh
      let pGroup = currentMeshes.get(p.id);
      if (!pGroup) {
        pGroup = new THREE.Group();

        // Dense Nuclear Core Sphere
        const sphereGeo = new THREE.SphereGeometry(displayRadius, 28, 28);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(p.color),
          emissive: new THREE.Color(p.color),
          emissiveIntensity: isDark ? 0.65 : 0.45,
          roughness: 0.25,
          metalness: 0.75,
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.name = 'core';
        pGroup.add(sphereMesh);

        // Radiant halo ring
        const haloGeo = new THREE.RingGeometry(displayRadius * 1.15, displayRadius * 1.4, 28);
        const haloMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(p.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.name = 'halo';
        pGroup.add(haloMesh);

        // If particle is an Atom: render concentric electron orbital shell rings
        if (p.isAtom && p.electronShells && p.electronShells.length > 0) {
          const atomShellsGroup = new THREE.Group();
          atomShellsGroup.name = 'atom_shells';

          p.electronShells.forEach((electronCount, shellIdx) => {
            const shellRadius = displayRadius * (1.35 + shellIdx * 0.4);
            const shellCurve = new THREE.EllipseCurve(0, 0, shellRadius, shellRadius, 0, 2 * Math.PI, false, 0);
            const shellPts = shellCurve.getPoints(48);
            const shellGeom = new THREE.BufferGeometry().setFromPoints(
              shellPts.map((pt) => new THREE.Vector3(pt.x, pt.y, 0))
            );
            const shellLineMat = new THREE.LineBasicMaterial({
              color: new THREE.Color(p.color),
              transparent: true,
              opacity: 0.35 - shellIdx * 0.05,
            });
            const shellRing = new THREE.Line(shellGeom, shellLineMat);
            // Alternate inclination angles for orbital planes
            shellRing.rotation.x = (shellIdx * Math.PI) / 4;
            shellRing.rotation.y = (shellIdx * Math.PI) / 6;
            atomShellsGroup.add(shellRing);
          });

          pGroup.add(atomShellsGroup);
        }

        scene.add(pGroup);
        currentMeshes.set(p.id, pGroup);
      }

      // Position in 3D
      pGroup.position.set(p.x, p.y, p.z);

      // Rotate atom electron shells subtly for dynamic visualization
      const atomShells = pGroup.getObjectByName('atom_shells');
      if (atomShells) {
        atomShells.rotation.z += 0.02;
        atomShells.rotation.y += 0.01;
      }

      // 3D Lorentz Length Contraction
      const coreMesh = pGroup.getObjectByName('core');
      if (coreMesh) {
        const vMag = Math.hypot(p.vx, p.vy, p.vz);
        if (config.showLorentzContraction && p.mass > 0 && p.gamma > 1.05 && vMag > 0.05) {
          const vDir = new THREE.Vector3(p.vx, p.vy, p.vz).normalize();
          coreMesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), vDir);
          const scaleX = Math.max(0.08, 1 / p.gamma);
          coreMesh.scale.set(scaleX, 1, 1);
        } else {
          coreMesh.scale.set(1, 1, 1);
          coreMesh.quaternion.identity();
        }
      }

      // 3. Trajectory Phosphorescence Trails (Custom Trail Styles)
      if (config.showTrails && p.trail.length > 1) {
        let trailObj = currentTrails.get(p.id);
        const pts = p.trail.map((pt) => new THREE.Vector3(pt.x, pt.y, pt.z));

        // Recreate or update geometry based on selected trailStyle
        if (!trailObj) {
          const geom = new THREE.BufferGeometry().setFromPoints(pts);

          if (config.trailStyle === 'sparks') {
            const sparkMat = new THREE.PointsMaterial({
              color: new THREE.Color(p.color),
              size: Math.max(2, config.trailWidth * 1.5),
              transparent: true,
              opacity: config.trailOpacity,
            });
            trailObj = new THREE.Points(geom, sparkMat);
          } else if (config.trailStyle === 'dashed') {
            const dashMat = new THREE.LineDashedMaterial({
              color: new THREE.Color(p.color),
              dashSize: 6,
              gapSize: 4,
              transparent: true,
              opacity: config.trailOpacity,
            });
            trailObj = new THREE.Line(geom, dashMat);
            (trailObj as THREE.Line).computeLineDistances();
          } else if (config.trailStyle === 'velocity_heatmap') {
            // Vertex colors based on relativistic beta (blue -> cyan -> yellow -> red)
            const colors: number[] = [];
            p.trail.forEach((pt) => {
              const b = Math.min(0.999, Math.max(0, pt.beta || 0));
              const col = new THREE.Color().setHSL(0.65 - b * 0.65, 1.0, 0.55);
              colors.push(col.r, col.g, col.b);
            });
            geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            const heatMat = new THREE.LineBasicMaterial({
              vertexColors: true,
              transparent: true,
              opacity: config.trailOpacity,
              linewidth: config.trailWidth,
            });
            trailObj = new THREE.Line(geom, heatMat);
          } else {
            // Default: Smooth Glowing Ribbon
            const trailColor =
              config.trailColorMode === 'doppler'
                ? new THREE.Color().setHSL(0.55 - p.beta * 0.5, 0.9, 0.6)
                : new THREE.Color(p.color);
            const lineMat = new THREE.LineBasicMaterial({
              color: trailColor,
              transparent: true,
              opacity: config.trailOpacity,
              linewidth: config.trailWidth,
            });
            trailObj = new THREE.Line(geom, lineMat);
          }

          scene.add(trailObj);
          currentTrails.set(p.id, trailObj);
        } else {
          // Efficient point update
          const lineMesh = trailObj as THREE.Line;
          lineMesh.geometry.dispose();
          const geom = new THREE.BufferGeometry().setFromPoints(pts);

          if (config.trailStyle === 'velocity_heatmap') {
            const colors: number[] = [];
            p.trail.forEach((pt) => {
              const b = Math.min(0.999, Math.max(0, pt.beta || 0));
              const col = new THREE.Color().setHSL(0.65 - b * 0.65, 1.0, 0.55);
              colors.push(col.r, col.g, col.b);
            });
            geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
          }

          lineMesh.geometry = geom;
          if (config.trailStyle === 'dashed') {
            lineMesh.computeLineDistances();
          }
        }
      }

      // 4. Relativistic Momentum Vectors
      if (config.showMomentumVectors && p.pTotal > 0.1) {
        let arrow = currentVectors.get(p.id);
        const pDir = new THREE.Vector3(p.px, p.py, p.pz).normalize();
        const pLen = Math.min(110, Math.max(16, p.pTotal * 0.35));

        if (!arrow) {
          arrow = new THREE.ArrowHelper(pDir, pGroup.position, pLen, new THREE.Color(p.color).getHex(), 10, 5);
          scene.add(arrow);
          currentVectors.set(p.id, arrow);
        } else {
          arrow.position.copy(pGroup.position);
          arrow.setDirection(pDir);
          arrow.setLength(pLen, 10, 5);
        }
      }
    });

    // Prune removed particles
    currentMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        scene.remove(mesh);
        currentMeshes.delete(id);
      }
    });

    currentTrails.forEach((obj, id) => {
      if (!activeIds.has(id)) {
        scene.remove(obj);
        currentTrails.delete(id);
      }
    });

    currentVectors.forEach((arrow, id) => {
      if (!activeIds.has(id)) {
        scene.remove(arrow);
        currentVectors.delete(id);
      }
    });

    // 5. Render Vertex Shockwave Ripple if collision occurred
    const vGroup = vertexGroupRef.current;
    if (vGroup) {
      vGroup.clear();
      if (vertex) {
        const vCoreGeo = new THREE.SphereGeometry(7, 16, 16);
        const vCoreMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x06b6d4 : 0x0284c7 });
        const vCore = new THREE.Mesh(vCoreGeo, vCoreMat);
        vCore.position.set(vertex.x, vertex.y, vertex.z);
        vGroup.add(vCore);

        const waveGeo = new THREE.SphereGeometry(32, 24, 24);
        const waveMat = new THREE.MeshBasicMaterial({
          color: isDark ? 0x06b6d4 : 0x0284c7,
          wireframe: true,
          transparent: true,
          opacity: 0.3,
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.position.set(vertex.x, vertex.y, vertex.z);
        vGroup.add(waveMesh);
      }
    }

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(scene, cameraRef.current);
    }
  }, [particles, vertex, config]);

  // Touch Drag, Pan & 2-Finger Zoom Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inertiaAnimationRef.current) cancelAnimationFrame(inertiaAnimationRef.current);
    isInteractingRef.current = true;
    isPanningRef.current = e.button === 2 || e.shiftKey; // Right click or shift + drag to pan
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    angularVelocityRef.current = { theta: 0, phi: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current) return;
    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    if (isPanningRef.current && cameraRef.current) {
      // Pan camera in camera's view plane
      const camera = cameraRef.current;
      const target = cameraTargetRef.current;
      const factor = cameraSphericalRef.current.radius / 900;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());

      target.addScaledVector(right, -dx * factor);
      target.addScaledVector(up, dy * factor);
      updateCameraPosition();
    } else {
      // Orbital rotation with instantaneous velocity tracking
      const vTheta = dx * 0.007;
      const vPhi = dy * 0.007;
      angularVelocityRef.current = { theta: vTheta, phi: vPhi };

      const sph = cameraSphericalRef.current;
      sph.theta -= vTheta;
      sph.phi = Math.max(0.06, Math.min(Math.PI - 0.06, sph.phi - vPhi));
      updateCameraPosition();
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isInteractingRef.current = false;
    isPanningRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Trigger smooth mechanical inertia decay on release
    if (Math.abs(angularVelocityRef.current.theta) > 0.0001 || Math.abs(angularVelocityRef.current.phi) > 0.0001) {
      inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
    }
  };

  // Two-Finger Pinch to Zoom & Two-Finger Pan on Touchscreens
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      isInteractingRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      touchStartMidpointRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && cameraRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.hypot(dx, dy);

      // 1. Two-finger Pinch to Zoom
      const distRatio = touchStartDistRef.current / (dist || 1);
      touchStartDistRef.current = dist;
      const sph = cameraSphericalRef.current;
      sph.radius = Math.max(90, Math.min(1400, sph.radius * distRatio));

      // 2. Two-finger Midpoint Pan
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const panDx = midX - touchStartMidpointRef.current.x;
      const panDy = midY - touchStartMidpointRef.current.y;
      touchStartMidpointRef.current = { x: midX, y: midY };

      const camera = cameraRef.current;
      const target = cameraTargetRef.current;
      const factor = sph.radius / 800;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());

      target.addScaledVector(right, -panDx * factor);
      target.addScaledVector(up, panDy * factor);

      updateCameraPosition();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  };

  const handleTouchEnd = () => {
    isInteractingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.88 : 1.12;
    const sph = cameraSphericalRef.current;
    sph.radius = Math.max(90, Math.min(1400, sph.radius * factor));
    updateCameraPosition();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Reset Camera View & Presets
  const setPresetCamera = (view: 'perspective' | 'top' | 'side') => {
    setCameraView(view);
    cameraTargetRef.current.set(0, 0, 0);
    const sph = cameraSphericalRef.current;
    if (view === 'perspective') {
      sph.radius = 440;
      sph.theta = Math.PI / 4;
      sph.phi = Math.PI / 3;
    } else if (view === 'top') {
      sph.radius = 520;
      sph.theta = 0;
      sph.phi = 0.05;
    } else if (view === 'side') {
      sph.radius = 460;
      sph.theta = 0;
      sph.phi = Math.PI / 2;
    }
    updateCameraPosition();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const isDark = config.theme === 'dark';

  return (
    <div
      className={`relative w-full h-full min-h-[360px] overflow-hidden select-none touch-none transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating Viewport Quick Controls (Top-Right) */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-1.5 p-1 backdrop-blur border rounded-lg shadow-lg pointer-events-auto transition-colors z-20 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : 'bg-white/95 border-slate-200 text-slate-700'
        }`}
      >
        {/* Trail Editor Toggle Button */}
        <button
          onClick={() => setIsTrailEditorOpen((prev) => !prev)}
          title="Particle Trail & Chamber Editor"
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            isTrailEditorOpen
              ? 'bg-cyan-500 text-white font-semibold'
              : isDark
              ? 'hover:bg-slate-800 text-cyan-400'
              : 'hover:bg-slate-100 text-cyan-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trails & Sphere</span>
        </button>

        <div className={`w-px h-4 my-auto ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Realistic Size Scaling Mode Toggle */}
        <button
          onClick={() =>
            onConfigChange({
              sizeScaleMode: config.sizeScaleMode === 'realistic' ? 'enhanced' : 'realistic',
            })
          }
          title={`Particle Size Scaling: ${config.sizeScaleMode === 'realistic' ? 'Realistic Scale' : 'Enhanced Visibility'}`}
          className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
            config.sizeScaleMode === 'realistic'
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'bg-emerald-50 text-emerald-700 font-semibold'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {config.sizeScaleMode === 'realistic' ? 'Realistic Sizes' : 'Enhanced Sizes'}
        </button>

        <div className={`w-px h-4 my-auto ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Zoom In / Out */}
        <button
          onClick={() => {
            const sph = cameraSphericalRef.current;
            sph.radius = Math.max(90, sph.radius * 0.82);
            updateCameraPosition();
          }}
          title="Zoom In"
          className={`p-1.5 rounded transition-colors ${
            isDark ? 'hover:text-cyan-400 hover:bg-slate-800' : 'hover:text-cyan-700 hover:bg-slate-100'
          }`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const sph = cameraSphericalRef.current;
            sph.radius = Math.min(1400, sph.radius * 1.18);
            updateCameraPosition();
          }}
          title="Zoom Out"
          className={`p-1.5 rounded transition-colors ${
            isDark ? 'hover:text-cyan-400 hover:bg-slate-800' : 'hover:text-cyan-700 hover:bg-slate-100'
          }`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className={`w-px h-4 my-auto ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Camera Angles */}
        <button
          onClick={() => setPresetCamera('perspective')}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            cameraView === 'perspective'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                : 'bg-cyan-100 text-cyan-800 font-semibold'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          3D
        </button>
        <button
          onClick={() => setPresetCamera('top')}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            cameraView === 'top'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                : 'bg-cyan-100 text-cyan-800 font-semibold'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Top
        </button>
        <button
          onClick={() => setPresetCamera('side')}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            cameraView === 'side'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                : 'bg-cyan-100 text-cyan-800 font-semibold'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Side
        </button>
      </div>

      {/* Floating Center of Collision Mathematical HUD (Top-Left) */}
      {isMathHUDOpen && (
        <div
          className={`absolute top-3 left-3 p-3 backdrop-blur border rounded-lg pointer-events-auto max-w-xs shadow-lg space-y-1.5 text-xs font-mono z-10 transition-colors ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
              <Compass className="w-3.5 h-3.5" /> Collision Center Math
            </span>
            <button
              onClick={() => setIsMathHUDOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-[10px] px-1"
            >
              ✕
            </button>
          </div>

          {vertex ? (
            <div className="space-y-1 pt-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Position (Xc, Yc, Zc):</span>
                <span className={isDark ? 'text-cyan-300' : 'text-cyan-700'}>
                  ({vertex.x.toFixed(1)}, {vertex.y.toFixed(1)}, {vertex.z.toFixed(1)}) fm
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Closest Approach r_min:</span>
                <span className="text-emerald-500 font-semibold">{vertex.closestApproachFm.toFixed(2)} fm</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Mandelstam s:</span>
                <span className="text-amber-500">{(vertex.mandelstam.s / 1e6).toFixed(3)} GeV²</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Momentum Transfer t:</span>
                <span className="text-amber-500">{(vertex.mandelstam.t / 1e6).toFixed(3)} GeV²</span>
              </div>
              {vertex.reactionChannel && (
                <div
                  className={`pt-1 border-t text-[10px] font-semibold ${
                    isDark ? 'border-slate-800 text-cyan-300' : 'border-slate-200 text-cyan-700'
                  }`}
                >
                  Channel: {vertex.reactionChannel}
                </div>
              )}
            </div>
          ) : (
            <div className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Particles in approach trajectory calculating closest approach r_min and Mandelstam invariants...
            </div>
          )}

          {/* Sphere of Interaction Status */}
          {config.interactionSphereEnabled && (
            <div
              className={`pt-1.5 border-t text-[10px] flex items-center justify-between ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-500" /> Chamber R:
              </span>
              <span className="font-semibold text-cyan-500">{config.interactionSphereRadius} fm</span>
              {config.autoReloadOnExit && <span className="text-emerald-500">● Auto-Reload</span>}
            </div>
          )}
        </div>
      )}

      {/* Floating Particle Trail & Interaction Sphere Editor Drawer */}
      {isTrailEditorOpen && (
        <div
          className={`absolute top-14 right-3 p-4 backdrop-blur border rounded-xl shadow-2xl pointer-events-auto w-80 max-h-[85vh] overflow-y-auto space-y-4 text-xs font-sans z-30 transition-colors ${
            isDark
              ? 'bg-slate-900/95 border-slate-800 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-500" /> Trail & Chamber Editor
            </span>
            <button
              onClick={() => setIsTrailEditorOpen(false)}
              className="text-slate-400 hover:text-slate-600 px-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Trail Style Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Trail Render Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['ribbon', 'dashed', 'velocity_heatmap', 'sparks'] as TrailStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => onConfigChange({ trailStyle: style })}
                  className={`px-2.5 py-1.5 text-[11px] font-mono rounded-lg border transition-colors capitalize ${
                    config.trailStyle === style
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                      : isDark
                      ? 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {style.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Trail Length Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Trail Memory Length</span>
              <span className="text-cyan-400 font-semibold">{config.trailLength} pts</span>
            </div>
            <input
              type="range"
              min={20}
              max={400}
              step={10}
              value={config.trailLength}
              onChange={(e) => onConfigChange({ trailLength: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Trail Width / Thickness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Trail Width</span>
              <span className="text-cyan-400 font-semibold">{config.trailWidth} px</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={config.trailWidth}
              onChange={(e) => onConfigChange({ trailWidth: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Trail Opacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Trail Opacity</span>
              <span className="text-cyan-400 font-semibold">{Math.round(config.trailOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={config.trailOpacity}
              onChange={(e) => onConfigChange({ trailOpacity: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Trail Color Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Color Spectrum</label>
            <div className="flex gap-2">
              <button
                onClick={() => onConfigChange({ trailColorMode: 'particle' })}
                className={`flex-1 py-1.5 text-xs font-mono rounded-lg border text-center transition-colors ${
                  config.trailColorMode === 'particle'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                    : isDark
                    ? 'bg-slate-800/60 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                Particle Signature
              </button>
              <button
                onClick={() => onConfigChange({ trailColorMode: 'doppler' })}
                className={`flex-1 py-1.5 text-xs font-mono rounded-lg border text-center transition-colors ${
                  config.trailColorMode === 'doppler'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold'
                    : isDark
                    ? 'bg-slate-800/60 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                Relativistic Doppler
              </button>
            </div>
          </div>

          {/* SPHERE OF INTERACTION CONFIG */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
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
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Chamber Radius R</span>
                    <span className="text-cyan-400 font-semibold">{config.interactionSphereRadius} fm</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={360}
                    step={10}
                    value={config.interactionSphereRadius}
                    onChange={(e) => onConfigChange({ interactionSphereRadius: Number(e.target.value) })}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] leading-tight">
                    <div className="font-medium text-slate-200">Auto-Reload on Exit</div>
                    <div className="text-[10px] text-slate-400">Reloads interaction when any particle exits sphere</div>
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

          {/* Quick Actions */}
          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <button
              onClick={() => {
                particles.forEach((p) => (p.trail = []));
              }}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Clear Trails
            </button>
            <button
              onClick={onResetSimulation}
              className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reload Chamber
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Touch & Orbit Instructions Helper */}
      <div
        className={`absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-lg border shadow-md pointer-events-none transition-colors ${
          isDark
            ? 'bg-slate-900/80 backdrop-blur border-slate-800/80 text-slate-300'
            : 'bg-white/90 backdrop-blur border-slate-200 text-slate-700'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden sm:inline">1 finger: orbit camera with inertia · 2 fingers: pinch zoom & pan</span>
          <span className="sm:hidden">Drag: orbit · 2 fingers: pinch & pan</span>
        </span>
        {scatteringAngles && (
          <span className="font-semibold text-cyan-500 tabular-nums">
            Opening Angle Θ = {scatteringAngles.totalOpeningDeg.toFixed(1)}°
          </span>
        )}
      </div>
    </div>
  );
};
