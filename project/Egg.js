// Egg object

import * as THREE from 'three';

export class Egg {
  constructor(scene, position) {
    this.scene = scene;
    this.mesh = this._createMesh();
    this.mesh.position.copy(position);
    this.scene.add(this.mesh);

    this.hatchTime = Date.now() + this._randomHatchDelay();
    this.hatched = false;
  }

  _createMesh() {
    const geometry = new THREE.SphereGeometry(0.15, 12, 12);
    const material = new THREE.MeshToonMaterial({ color: 0xffffff });
    return new THREE.Mesh(geometry, material);
  }

  // 랜덤하게 부화 시간을 결정 (5~10초)
  _randomHatchDelay() {
    return 5000 + Math.random() * 5000; // 5~10초 사이
  }

  update() {
    if (this.hatched) return;

    if (Date.now() >= this.hatchTime) {
      this.hatched = true;
      return 'hatch';
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}