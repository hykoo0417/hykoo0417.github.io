// Chicken object의 행동과 status를 관리하는 class

import * as THREE from 'three';
import { getRandomDirection, clampPositionInPlane } from './util/math.js';

export class Chicken {
  constructor(scene, startPosition) {
    this.scene = scene;
    this.mesh = this._createMesh(); // 나중에 모델로 대체 가능
    this.mesh.position.copy(startPosition);
    this.scene.add(this.mesh);

    this.hunger = 100;          // 0~100
    this.alive = true;
    this.moveSpeed = 0.5;       // units per second
    this.direction = getRandomDirection();
    this.nextEggTime = Date.now() + this._randomEggDelay();
  }

  _createMesh() {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshToonMaterial({ color: 0xffcc00 });
    return new THREE.Mesh(geometry, material);
  }

  _randomEggDelay() {
    return 5000 + Math.random() * 5000; // 5~10초 후 알 낳기
  }

  update(deltaTime, planeSize) {
    if (!this.alive) return;

    // 배고픔 감소
    this.hunger -= deltaTime * 5;
    if (this.hunger <= 0) { // 배고픔 0되면 죽음
      this.die();
      return;
    }

    // 이동
    this._move(deltaTime, planeSize);

    // 알 낳기
    if (Date.now() > this.nextEggTime) {
      this.nextEggTime = Date.now() + this._randomEggDelay();
      return 'layEgg'; // GameManager에서 처리
    }
  }

  _move(deltaTime, planeSize) {
    const moveDelta = this.direction.clone().multiplyScalar(this.moveSpeed * deltaTime);
    this.mesh.position.add(moveDelta);

    // 경계 체크
    clampPositionInPlane(this.mesh.position, planeSize);

    // 일정 확률로 방향 전환
    if (Math.random() < 0.01) {
      this.direction = getRandomDirection();
    }
  }

  feed() {
    if (this.alive) {
      this.hunger = Math.min(100, this.hunger + 30);
    }
  }

  die() {
    this.alive = false;
    this.mesh.material.color.set(0x444444);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}