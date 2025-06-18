import * as THREE from 'three';
import { GameManager } from './GameManager.js';
import { ResourceManager } from './ResourceManager.js';
import { UIManager } from './UIManager.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initCamera, initRenderer } from './util/util.js';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';

let scene, camera, renderer;
let game, resourceManager, uiManager;
let clock = new THREE.Clock();
let hoveredChicken = null;
let hoveredEgg = null;
let controls;
let gameOver = false;
let warnedTimes = new Set(); 

const PLANE_SIZE = 10;
const TOTAL_TIME =100;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaee8ff);

  camera = initCamera();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  renderer = initRenderer();

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.3;
  controls.target.set(0, 0, 0);
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.minPolarAngle = 0.4;
  controls.maxPolarAngle = Math.PI / 2.5;
  controls.enablePan = false;
  controls.update();

  const bgm = new Audio('./assets/bgm.mp3');
  bgm.loop = true;         // 🔁 무한 반복
  bgm.volume = 1.0;        // 🔉 볼륨 (0.0 ~ 1.0)
  bgm.play().catch((err) => {
    console.warn('🔇 BGM 재생 실패:', err);
  });

  // Load Textures
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load('assets/grass.jpg');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(4, 4);

  const dirtTexture = textureLoader.load('assets/dirt_texture.png');
  dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
  dirtTexture.repeat.set(2, 2);

  // Create Rounded Ground Cube
  const WIDTH = 10, HEIGHT = 12, DEPTH = 10;

  const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTexture, color: 0x888888 });
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTexture });

  const materials = [
    dirtMat, // +X
    dirtMat, // -X
    grassMat, // +Y
    dirtMat, // -Y
    dirtMat, // +Z
    dirtMat  // -Z
  ];

  const geometry = new RoundedBoxGeometry(WIDTH, HEIGHT, DEPTH, 4, 0.2);
  const ground = new THREE.Mesh(geometry, materials);
  ground.position.y = -HEIGHT / 2 + 0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  game = new GameManager(scene, PLANE_SIZE);
  resourceManager = new ResourceManager();
  uiManager = new UIManager();

  uiManager.updateMoney(resourceManager.getMoney()); // 💰 게임 시작 시 초기 돈 표시

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([
      ...game.chickens.map(c => c.hitbox),
      ...game.eggs.map(e => e.mesh),
    ]);

    hoveredChicken = null;
    hoveredEgg = null;

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      hoveredChicken = game.chickens.find(c => c.hitbox === hit) || null;
      hoveredEgg = game.eggs.find(e => e.mesh === hit) || null;
    }

    updateHoverUI();
  });

  window.addEventListener('click', () => {
    if (hoveredEgg && !hoveredEgg.isHarvested) {
      hoveredEgg.isHarvested = true;
      hoveredEgg.dispose();
      const reward = hoveredEgg.isGolden ? 15 : 5;

      if (1){
        const audio = new Audio('./assets/sell.mp3');
        audio.play().catch(err => {
          console.warn("소리 재생 실패:", err);
        });
        //this.hatch = 0;
      }

      resourceManager.money += reward;
      uiManager.updateMoney(resourceManager.getMoney());
      game.eggs = game.eggs.filter(e => e !== hoveredEgg);
    }

    if (!hoveredChicken.isSick && resourceManager.spend(5)) {
      hoveredChicken.feed();
    }
    else if (hoveredChicken.isSick && resourceManager.spend(15)) {
      hoveredChicken.cure();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  if (gameOver) return;
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  resourceManager.update(deltaTime);

  const timeLeft = resourceManager.getTime();
  game.update(deltaTime, timeLeft);
  uiManager.updateTimeBar(timeLeft); // ⏱ 타임바 업데이트

  uiManager.updateMoney(resourceManager.getMoney());

    //  경고 팝업 표시 로직
  const warningTriggers = [55];
  for (let t of warningTriggers) {
    if (timeLeft === t && !warnedTimes.has(t)) {
      warnedTimes.add(t);
      uiManager.showimagePopup('assets/disease.png', '⚠️조류독감 경고! 백신으로 예방하세요');
    }
  }

  if (timeLeft <= 0) {
    handleGameOver();
    gameOver = true;
    return;
  }

  controls.update();
  renderer.render(scene, camera);
}

function updateHoverUI() {
  if (hoveredChicken) {
    const pos = new THREE.Vector3();
    hoveredChicken.hitbox.getWorldPosition(pos);
    const screenPos = pos.project(camera);

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    uiManager.updateHoverHunger3D(hoveredChicken.hunger, x, y);
  } else {
    uiManager.updateHoverHunger3D(null);
  }
}

function handleGameOver() {
  console.log('💀 Game Over!');
  uiManager.showGameOver(game.chickens.length);
}



