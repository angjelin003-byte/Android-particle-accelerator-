/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import {
  ParticleState,
  CollisionVertex3D,
  SimulationConfig,
} from '../types/physics';

interface ParticleScene3DProps {
  particles: ParticleState[];
  vertex: CollisionVertex3D | null;
  config: SimulationConfig;
  cameraView: 'perspective' | 'top' | 'side';
  cameraResetTrigger: number;
}

export const ParticleScene3D: React.FC<ParticleScene3DProps> = ({
  particles,
  vertex,
  config,
  cameraView,
  cameraResetTrigger,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const particleMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const vectorArrowsRef = useRef<Map<string, THREE.ArrowHelper>>(new Map());
  const vertexGroupRef = useRef<THREE.Group | null>(null);
  const detectorChamberRef = useRef<THREE.Group | null>(null);
  const protractorRingsRef = useRef<THREE.Group | null>(null);
  const interactionSphereGroupRef = useRef<THREE.Group | null>(null);

  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 440,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });

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

  useEffect(() => {
    cameraTargetRef.current.set(0, 0, 0);
    const sph = cameraSphericalRef.current;
    if (cameraView === 'perspective') {
      sph.radius = 440;
      sph.theta = Math.PI / 4;
      sph.phi = Math.PI / 3;
    } else if (cameraView === 'top') {
      sph.radius = 520;
      sph.theta = 0;
      sph.phi = 0.05;
    } else if (cameraView === 'side') {
      sph.radius = 460;
      sph.theta = 0;
      sph.phi = Math.PI / 2;
    }
    updateCameraPosition();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [cameraView, cameraResetTrigger, updateCameraPosition]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isDark = config.theme === 'dark';
    const bgColor = isDark ? 0x07090e : 0xf8fafc;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 4000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.65 : 0.85));
    
    const chamberGroup = new THREE.Group();
    detectorChamberRef.current = chamberGroup;
    scene.add(chamberGroup);

    const protractorGroup = new THREE.Group();
    protractorRingsRef.current = protractorGroup;
    scene.add(protractorGroup);

    const interactionGroup = new THREE.Group();
    interactionSphereGroupRef.current = interactionGroup;
    scene.add(interactionGroup);

    const vGroup = new THREE.Group();
    vertexGroupRef.current = vGroup;
    scene.add(vGroup);

    return () => { renderer.dispose(); };
  }, [config.theme]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const isDark = config.theme === 'dark';
    const activeIds = new Set<string>();

    particles.forEach((p) => {
      if (p.annihilated) return;
      activeIds.add(p.id);

      let displayRadius: number;
      let cloudRadius: number = 0;
      
      if (p.isAtom && p.atomicRadiusPm) {
        const massNumber = p.massNumberA || 1;
        displayRadius = Math.max(3.2, 1.25 * Math.cbrt(massNumber) * 1.5);
        cloudRadius = Math.max(displayRadius * 3, Math.min(60, p.atomicRadiusPm / 5));
      } else if (p.nuclearRadiusFm) {
        displayRadius = Math.max(2.8, Math.min(15.0, p.nuclearRadiusFm * 1.8));
      } else {
        displayRadius = p.category === 'lepton' ? 2.6 : 3.0;
      }

      let pGroup = particleMeshesRef.current.get(p.id);
      if (!pGroup) {
        pGroup = new THREE.Group();
        const sphereGeo = new THREE.SphereGeometry(displayRadius, 28, 28);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(p.color),
          emissive: new THREE.Color(p.color),
          emissiveIntensity: isDark ? 0.65 : 0.45,
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.name = 'core';
        pGroup.add(sphereMesh);

        if (p.isAtom && cloudRadius > 0) {
          const cloudGeo = new THREE.SphereGeometry(cloudRadius, 32, 32);
          const cloudMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(p.color),
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
          cloudMesh.name = 'electron_cloud';
          pGroup.add(cloudMesh);
        }
        scene.add(pGroup);
        particleMeshesRef.current.set(p.id, pGroup);
      }
      pGroup.position.set(p.x, p.y, p.z);
    });
    
    if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(scene, cameraRef.current);
    }
  }, [particles, config]);

  return <div ref={mountRef} className="w-full h-full block" />;
};
