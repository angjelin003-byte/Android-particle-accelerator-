/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ParticleState, CollisionVertex3D, SimulationConfig } from '../types/physics';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  Move,
  Eye,
  Maximize2,
  Box,
} from 'lucide-react';

interface ParticleScene3DProps {
  particles: ParticleState[];
  vertex: CollisionVertex3D | null;
  config: SimulationConfig;
  impactParameter: number;
  onImpactParameterChange: (b: number) => void;
  scatteringAngles: {
    theta1Deg: number;
    theta2Deg: number;
    totalOpeningDeg: number;
    classicalComparisonDeg: number;
  } | null;
  trailLength: number;
}

export const ParticleScene3D: React.FC<ParticleScene3DProps> = ({
  particles,
  vertex,
  config,
  impactParameter,
  onImpactParameterChange,
  scatteringAngles,
  trailLength,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Mesh registries for live updates without garbage collection thrashing
  const particleMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const vectorArrowsRef = useRef<Map<string, THREE.ArrowHelper>>(new Map());
  const vertexGroupRef = useRef<THREE.Group | null>(null);
  const detectorChamberRef = useRef<THREE.Group | null>(null);
  const protractorRingsRef = useRef<THREE.Group | null>(null);

  // Orbit controls state (touch + mouse)
  const isInteractingRef = useRef<boolean>(false);
  const touchStartDistRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 420,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const panRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'side'>('perspective');

  // Update camera position from spherical coordinates
  const updateCameraPosition = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    camera.position.x = radius * Math.sin(phi) * Math.sin(theta) + panRef.current.x;
    camera.position.y = radius * Math.cos(phi) + panRef.current.y;
    camera.position.z = radius * Math.sin(phi) * Math.cos(theta) + panRef.current.z;
    camera.lookAt(panRef.current);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.0012);
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Studio Collider Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    keyLight.position.set(200, 300, 200);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
    fillLight.position.set(-200, -100, -200);
    scene.add(fillLight);

    // 5. 3D Cylindrical Collider / Drift Chamber
    const chamberGroup = new THREE.Group();
    detectorChamberRef.current = chamberGroup;

    // Barrel Wireframe Geometry
    const cylinderGeo = new THREE.CylinderGeometry(260, 260, 700, 24, 8, true);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const barrel = new THREE.Mesh(cylinderGeo, cylinderMat);
    barrel.rotation.z = Math.PI / 2; // Aligned along beam x-axis
    chamberGroup.add(barrel);

    // Endcap tracker rings
    [-350, -175, 0, 175, 350].forEach((xPos) => {
      const ringGeo = new THREE.RingGeometry(258, 262, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.x = xPos;
      ring.rotation.y = Math.PI / 2;
      chamberGroup.add(ring);
    });

    scene.add(chamberGroup);

    // 6. 3D Polar Protractor & Grid
    const protractorGroup = new THREE.Group();
    protractorRingsRef.current = protractorGroup;

    // Concentric collision plane circles
    [50, 100, 160, 240].forEach((radius) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const geom = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, p.y, 0)));
      const lineMat = new THREE.LineBasicMaterial({
        color: radius === 240 ? 0x06b6d4 : 0x334155,
        transparent: true,
        opacity: radius === 240 ? 0.35 : 0.18,
      });
      const circle = new THREE.Line(geom, lineMat);
      protractorGroup.add(circle);
    });

    // Radial degree spokes
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const points = [
        new THREE.Vector3(30 * Math.cos(rad), 30 * Math.sin(rad), 0),
        new THREE.Vector3(240 * Math.cos(rad), 240 * Math.sin(rad), 0),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const spokeMat = new THREE.LineBasicMaterial({
        color: deg % 90 === 0 ? 0x06b6d4 : 0x1e293b,
        transparent: true,
        opacity: deg % 90 === 0 ? 0.4 : 0.15,
      });
      protractorGroup.add(new THREE.Line(geom, spokeMat));
    }

    scene.add(protractorGroup);

    // 7. Vertex Shockwave Ripple Group
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
      renderer.dispose();
    };
  }, [updateCameraPosition]);

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
    const currentTrails = trailLinesRef.current;
    const currentVectors = vectorArrowsRef.current;

    // Track active IDs to prune removed particles
    const activeIds = new Set<string>();

    particles.forEach((p) => {
      if (p.annihilated) return;
      activeIds.add(p.id);

      // 1. Particle 3D Mesh (with Lorentz Contraction Ellipsoid)
      let pGroup = currentMeshes.get(p.id);
      if (!pGroup) {
        pGroup = new THREE.Group();

        // Core sphere / ellipsoid
        const sphereGeo = new THREE.SphereGeometry(p.radius, 24, 24);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(p.color),
          emissive: new THREE.Color(p.color),
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.8,
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.name = 'core';
        pGroup.add(sphereMesh);

        // Radiant halo ring
        const haloGeo = new THREE.RingGeometry(p.radius * 1.15, p.radius * 1.35, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(p.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.name = 'halo';
        pGroup.add(haloMesh);

        scene.add(pGroup);
        currentMeshes.set(p.id, pGroup);
      }

      // Position in 3D
      pGroup.position.set(p.x, p.y, p.z);

      // 3D Lorentz Length Contraction:
      // Along direction of velocity vector v, the particle contracts by factor 1/gamma
      const coreMesh = pGroup.getObjectByName('core');
      if (coreMesh) {
        const vMag = Math.hypot(p.vx, p.vy, p.vz);
        if (config.showLorentzContraction && p.mass > 0 && p.gamma > 1.05 && vMag > 0.05) {
          // Orient along velocity vector
          const vDir = new THREE.Vector3(p.vx, p.vy, p.vz).normalize();
          coreMesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), vDir);
          // Scale: x-axis along velocity contracts by 1/gamma, y & z remain rest radius
          const scaleX = Math.max(0.08, 1 / p.gamma);
          coreMesh.scale.set(scaleX, 1, 1);
        } else {
          coreMesh.scale.set(1, 1, 1);
          coreMesh.quaternion.identity();
        }
      }

      // 2. Trajectory Phosphorescence Trails (3D Line)
      if (config.showTrails && p.trail.length > 1) {
        let trailLine = currentTrails.get(p.id);
        // Apply trail length limit
        const limitedTrail = p.trail.slice(-trailLength);
        const points = limitedTrail.map((pt) => new THREE.Vector3(pt.x, pt.y, pt.z));
        const geom = new THREE.BufferGeometry().setFromPoints(points);

        if (!trailLine) {
          const mat = new THREE.LineBasicMaterial({
            color: new THREE.Color(p.color),
            transparent: true,
            opacity: 0.65,
            linewidth: 2,
          });
          trailLine = new THREE.Line(geom, mat);
          scene.add(trailLine);
          currentTrails.set(p.id, trailLine);
        } else {
          trailLine.geometry.dispose();
          trailLine.geometry = geom;
        }
      }

      // 3. Relativistic 3D Momentum Vectors
      if (config.showMomentumVectors && p.pTotal > 0.1) {
        let arrow = currentVectors.get(p.id);
        const pDir = new THREE.Vector3(p.px, p.py, p.pz).normalize();
        const pLen = Math.min(100, Math.max(15, p.pTotal * 0.35));

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

    // Remove pruned particles
    currentMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        scene.remove(mesh);
        currentMeshes.delete(id);
      }
    });

    currentTrails.forEach((line, id) => {
      if (!activeIds.has(id)) {
        scene.remove(line);
        line.geometry.dispose();
        currentTrails.delete(id);
      }
    });

    currentVectors.forEach((arrow, id) => {
      if (!activeIds.has(id)) {
        scene.remove(arrow);
        currentVectors.delete(id);
      }
    });

    // 4. Render Vertex Shockwave Ripple if collision occurred
    const vGroup = vertexGroupRef.current;
    if (vGroup) {
      vGroup.clear();
      if (vertex) {
        // Glowing vertex core
        const vCoreGeo = new THREE.SphereGeometry(6, 16, 16);
        const vCoreMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const vCore = new THREE.Mesh(vCoreGeo, vCoreMat);
        vCore.position.set(vertex.x, vertex.y, vertex.z);
        vGroup.add(vCore);

        // Spherical shockwave shell
        const waveGeo = new THREE.SphereGeometry(30, 24, 24);
        const waveMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.position.set(vertex.x, vertex.y, vertex.z);
        vGroup.add(waveMesh);
      }
    }

    // Render frame
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(scene, cameraRef.current);
    }
  }, [particles, vertex, config]);

  // Touch and Mouse Orbit Controls for Mobile & Desktop
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isInteractingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const sph = cameraSphericalRef.current;
    sph.theta -= dx * 0.008;
    sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - dy * 0.008));
    updateCameraPosition();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isInteractingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Touch Pinch to Zoom on Mobile Web
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      lastTouchCenterRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = touchStartDistRef.current / (dist || 1);
      touchStartDistRef.current = dist;

      const sph = cameraSphericalRef.current;
      sph.radius = Math.max(120, Math.min(1200, sph.radius * ratio));
      
      // 2-Finger Pan
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      if (lastTouchCenterRef.current) {
        const panDx = centerX - lastTouchCenterRef.current.x;
        const panDy = centerY - lastTouchCenterRef.current.y;
        
        // Pan speed sensitive to zoom level
        const panSpeed = sph.radius * 0.002;
        panRef.current.x -= panDx * panSpeed;
        panRef.current.y += panDy * panSpeed;
      }
      lastTouchCenterRef.current = { x: centerX, y: centerY };

      updateCameraPosition();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.9 : 1.1;
    const sph = cameraSphericalRef.current;
    sph.radius = Math.max(120, Math.min(1200, sph.radius * factor));
    updateCameraPosition();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Camera presets
  const setPresetCamera = (view: 'perspective' | 'top' | 'side') => {
    setCameraView(view);
    const sph = cameraSphericalRef.current;
    if (view === 'perspective') {
      sph.radius = 420;
      sph.theta = Math.PI / 4;
      sph.phi = Math.PI / 3;
    } else if (view === 'top') {
      sph.radius = 500;
      sph.theta = 0;
      sph.phi = 0.05;
    } else if (view === 'side') {
      sph.radius = 450;
      sph.theta = 0;
      sph.phi = Math.PI / 2;
    }
    updateCameraPosition();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  return (
    <div
      className="relative w-full h-full min-h-[380px] overflow-hidden bg-slate-950 select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Camera & Viewport Tools (Top-Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg shadow-lg text-slate-300 pointer-events-auto">
        <button
          onClick={() => {
            const sph = cameraSphericalRef.current;
            sph.radius = Math.max(120, sph.radius * 0.85);
            updateCameraPosition();
          }}
          title="Zoom In"
          className="p-1.5 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const sph = cameraSphericalRef.current;
            sph.radius = Math.min(1200, sph.radius * 1.15);
            updateCameraPosition();
          }}
          title="Zoom Out"
          className="p-1.5 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-800 my-auto" />

        <button
          onClick={() => setPresetCamera('perspective')}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            cameraView === 'perspective' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="3D Isometric Perspective"
        >
          3D
        </button>
        <button
          onClick={() => setPresetCamera('top')}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            cameraView === 'top' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Top 2D Scattering View"
        >
          Top
        </button>
        <button
          onClick={() => setPresetCamera('side')}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            cameraView === 'side' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Side Beam View"
        >
          Side
        </button>
      </div>

      {/* Floating Center of Collision Mathematical HUD (Top-Left) */}
      <div className="absolute top-3 left-3 p-2.5 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg text-slate-200 pointer-events-auto max-w-xs shadow-lg space-y-1 text-xs font-mono">
        <div className="flex items-center justify-between text-cyan-400 text-[11px] font-bold">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Collision Center Math
          </span>
          <span className="text-[10px] text-slate-400 font-normal">3D Vertex</span>
        </div>

        {vertex ? (
          <div className="space-y-1 pt-0.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Position (Xc, Yc, Zc):</span>
              <span className="text-cyan-300">
                ({vertex.x.toFixed(1)}, {vertex.y.toFixed(1)}, {vertex.z.toFixed(1)}) fm
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Closest Approach r_min:</span>
              <span className="text-emerald-400 font-semibold">
                {vertex.closestApproachFm.toFixed(2)} fm
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Mandelstam s:</span>
              <span className="text-amber-400">
                {(vertex.mandelstam.s / 1e6).toFixed(3)} GeV²
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Momentum Transfer t:</span>
              <span className="text-amber-400">
                {(vertex.mandelstam.t / 1e6).toFixed(3)} GeV²
              </span>
            </div>
            {vertex.reactionChannel && (
              <div className="pt-1 border-t border-slate-800 text-[10px] text-cyan-300 font-semibold">
                Channel: {vertex.reactionChannel}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 leading-tight">
            Approach trajectory calculating closest approach r_min and Mandelstam invariants...
          </div>
        )}
      </div>

      {/* Mobile Touch Help Strip */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded border border-slate-800/80 pointer-events-none">
        <span className="flex items-center gap-1 text-slate-300">
          <Move className="w-3 h-3 text-cyan-400" /> Touch drag to orbit 3D camera
        </span>
        <span className="hidden sm:inline">Pinch / scroll to zoom</span>
        {scatteringAngles && (
          <span className="text-cyan-400 font-semibold">
            Θ = {scatteringAngles.totalOpeningDeg.toFixed(1)}°
          </span>
        )}
      </div>
    </div>
  );
};
