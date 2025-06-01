import * as THREE from 'three';

export function getRandomDirection() {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

export function clampPositionInPlane(position, planeSize) {
  const half = planeSize / 2;
  position.x = Math.max(-half, Math.min(half, position.x));
  position.z = Math.max(-half, Math.min(half, position.z));
}