// Chicken, Egg 객체들 관리

import * as THREE from 'three';
import { Chicken } from './Chicken.js';
import { Egg } from './Egg.js';

export class GameManager {
  constructor(scene, planeSize) {
    this.scene = scene;
    this.planeSize = planeSize;

    this.chickens = [];
    this.eggs = [];

    this.timeLeft = 100;
    this.diseaseTimer = 0;
    this.diseaseEnabled = false;
    this.hatch = 1;

    // 첫 닭 하나 생성
    this.spawnChicken(new THREE.Vector3(0, 0.15, 0));
  }

  update(deltaTime, timeLeft) {
    this.timeLeft = timeLeft;

    // 닭 업데이트
    for (let i = this.chickens.length - 1; i >= 0; i--) {
      const chicken = this.chickens[i];
      const result = chicken.update(deltaTime, this.planeSize, this.chickens);

      if (!chicken.alive) {
        this.chickens.splice(i, 1);
        chicken.dispose();
      }

      if (result === 'layEgg') {
        const eggPos = chicken.mesh.position.clone();
        this.spawnEgg(eggPos);

        if (this.hatch){
          const audio = new Audio('./assets/pop.mp3');
          audio.play().catch(err => {
            console.warn("소리 재생 실패:", err);
          });
          //this.hatch = 0;
        }
      }
    }

    // 알 업데이트
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      const result = egg.update();

      // 부화했을 시 닭 객체로 변경
      if (result === 'hatch') {
        const newPos = egg.mesh.position.clone();
        newPos.y = 0.15;
        this.spawnChicken(newPos);

        if (1){
          const audio = new Audio('./assets/hatch.mp3');
          audio.play().catch(err => {
            console.warn("소리 재생 실패:", err);
          });
          //this.hatch = 0;
        }

        egg.dispose();
        this.eggs.splice(i, 1);
      }
    }

    if(!this.diseaseEnabled && this.timeLeft < 50){
      this.diseaseEnabled = true;
      this.diseaseTimer = 0;
    }

    if(this.diseaseEnabled){
      this.diseaseTimer += deltaTime;

      if(this.diseaseTimer > 10){
        this.diseaseTimer = 0;
        const healthyChickens = this.chickens.filter(c => !c.isSick);

        if (healthyChickens.length > 0){
          for (const chicken of healthyChickens){
            if(Math.random() < 0.10){
              chicken.infect();
            }
          }
        }
      }
    }
  }

  spawnChicken(position) {
    const chicken = new Chicken(this.scene, position);
    this.chickens.push(chicken);
  }

  spawnEgg(position) {
    const isGolden = Math.random() < 0.10;  // 10% 확률로 황금알
    const egg = new Egg(this.scene, position, isGolden);
    this.eggs.push(egg);
  }

  isGameOver() {
    return this.timeLeft <= 0;
  }
}