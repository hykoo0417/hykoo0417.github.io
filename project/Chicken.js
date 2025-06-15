// Chicken object의 행동과 status를 관리하는 class

import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { getRandomDirection, clampPositionInPlane } from './util/math.js';

let ChickenModel = null;
let loadingPromise = null;

export class Chicken {
  constructor(scene, startPosition) {
    this.scene = scene;
    this.mesh = null; // 모델 로딩될때 할당됨

    this.hunger = 100;          // 0~100
    this.alive = true;
    this.moveSpeed = 0.5;       // units per second
    this.direction = getRandomDirection();
    this.targetDirection = this.direction.clone();

    this.nextEggTime = Date.now() + this._randomEggDelay();
    this.isMoving = true;
    this.moveCooldown = 2 + Math.random() * 2;
    this.isLoaded = false;  // 초기엔 아직 mesh 없음
    
    this._loadModel(startPosition);
  }

  /*
  _createMesh() {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshToonMaterial({ color: 0xffcc00 });
    return new THREE.Mesh(geometry, material);
  }
  */

  async _loadModel(startPosition) {
    if (!ChickenModel) {
      if (!loadingPromise) {
        const loader = new FBXLoader();
        loadingPromise = new Promise((resolve, reject) => {
          loader.load('./models/chicken.fbx', (fbx) => {
            fbx.scale.set(0.02, 0.02, 0.02);
            ChickenModel = fbx;
            resolve(fbx);
          }, undefined, reject);
        });
      }
      await loadingPromise;
    }

    this.mesh = ChickenModel.clone();
    this.mesh.traverse((child) => {
      if (child.isLight) {
        this.mesh.remove(child);
      }
      if (child.isMesh) {
        child.castShadow = true;      // 그림자 내도록 설정
        child.receiveShadow = true;   // 혹시 그림자 받을 부분이 있으면
      }
    });

    this.mesh.position.copy(startPosition);

    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(13), // 닭 주변을 감쌀 정도의 크기
      new THREE.MeshBasicMaterial({ visible: false }) // 감지용이므로 보이진 않음
    );
    hitbox.name = 'hitbox'; // 구분용 이름
    hitbox.position.set(0, 20.0, 0);
    this.mesh.add(hitbox); // FBX 모델의 자식으로 붙임
    this.hitbox = hitbox; // 추후 감지에 사용

    this.scene.add(this.mesh);
    this.isLoaded = true;  // 이제 mesh와 hitbox 할당 완료
  }

  _randomEggDelay() {
    return 5000 + Math.random() * 5000; // 5~10초 후 알 낳기
  }

  update(deltaTime, planeSize, neighbors) {
    if (!this.alive || !this.isLoaded) return;

    // 배고픔 감소
    this.hunger -= deltaTime * 5;
    if (this.hunger <= 0) { // 배고픔 0되면 죽음
      this.die();
      return;
    }
    
    // 행동 상태 갱신 (움직일지 말지 + 방향 전환)
    this.moveCooldown -= deltaTime;
    if (this.moveCooldown <= 0){
      this.isMoving = Math.random() < 0.7;  // 70% 확률로 움직임
      this.targetDirection = getRandomDirection();
      this.moveCooldown = 2 + Math.random() * 3;
    }

    // 이동
    this._move(deltaTime, planeSize, neighbors);

    // 알 낳기
    if (Date.now() > this.nextEggTime) {
      this.nextEggTime = Date.now() + this._randomEggDelay();
      return 'layEgg'; // GameManager에서 처리
    }
  }

  _move(deltaTime, planeSize, neighbors) {
    // 방향을 서서히 보간
    this.direction.lerp(this.targetDirection, 0.05);

    if(!this.isMoving) return;

    const moveDelta = this.direction.clone().multiplyScalar(this.moveSpeed * deltaTime);
    
    // 다른 객체랑 겹침 방지
    const separation = new THREE.Vector3();
    for (const other of neighbors){
      if (other === this || !other.alive) continue;

      const dist = this.mesh.position.distanceTo(other.mesh.position);
      const minDist = 0.6;

      if (dist < minDist && dist > 0.0001){
        const away = this.mesh.position.clone().sub(other.mesh.position).normalize();
        separation.add(away.multiplyScalar((minDist - dist) / minDist));      }

    }

    moveDelta.add(separation.multiplyScalar(deltaTime * 1.5));

    this.mesh.position.add(moveDelta);

    // 경계 체크
    clampPositionInPlane(this.mesh.position, planeSize);

    // 이동 방향을 바라봄
    if (this.isMoving && this.direction.lengthSq() > 0.0001) {
      const angle = Math.atan2(this.direction.x, this.direction.z);
      this.mesh.rotation.y = angle + Math.PI / 2;
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