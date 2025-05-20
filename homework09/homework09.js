// 05-both-cameras.js
// - PerspectiveCamera vs OrthographicCamera
// - OrbitControl change when camera changes

import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();

// Camera를 perspective와 orthographic 두 가지로 switching 해야 해서 const가 아닌 let으로 선언
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 70;
camera.position.y = 25;
camera.position.z = 100;
camera.lookAt(scene.position);
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

// Camera가 바뀔 때 orbitControls도 바뀌어야 해서 let으로 선언
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

//const planeGeometry = new THREE.PlaneGeometry(180, 180);
//const planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
//const plane = new THREE.Mesh(planeGeometry, planeMaterial);

const textureLoader = new THREE.TextureLoader();

const sunGeometry = new THREE.SphereGeometry(10);
const mercuryGeometry = new THREE.SphereGeometry(1.5);
const venusGeometry = new THREE.SphereGeometry(3);
const earthGeometry = new THREE.SphereGeometry(3.5);
const marsGeometry = new THREE.SphereGeometry(2.5);

const earthTexture = textureLoader.load('Earth.jpg');
const mercuryTexture = textureLoader.load('Mercury.jpg');
const venusTexture = textureLoader.load('Venus.jpg');
const marsTexture = textureLoader.load('Mars.jpg');

const sunMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});

const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.2
})

const mercuryMaterial = new THREE.MeshStandardMaterial({
    map: mercuryTexture,
    roughness: 0.8,
    metalness: 0.2
})

const venusMaterial = new THREE.MeshStandardMaterial({
    map: venusTexture,
    roughness: 0.8,
    metalness: 0.2
})

const marsMaterial = new THREE.MeshStandardMaterial({
    map: marsTexture,
    roughness: 0.8,
    metalness: 0.2
})

const sun = new THREE.Mesh(sunGeometry, sunMaterial);
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
const mars = new THREE.Mesh(marsGeometry, marsMaterial);

mercury.position.x = 20;
venus.position.x = 35;
earth.position.x = 50;
mars.position.x = 65

scene.add(sun);
scene.add(mercury);
scene.add(venus);
scene.add(earth);
scene.add(mars);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(-20, 40, 60);
scene.add(directionalLight);




// GUI
const gui = new GUI();
const controls = new function () {
    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 100;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 70;
            camera.position.y = 25;
            camera.position.z = 100;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};
const guiCamera = gui.addFolder('Camera');
guiCamera.add(controls, 'switchCamera').name('Switch Camera Type');
guiCamera.add(controls, 'perspective').name('Current Camera').listen();

const param = {
    mercuryOrbSpeed: 0.02,
    mercuryRotSpeed: 0.02,
    venusOrbSpeed: 0.015,
    venusRotSpeed: 0.015,
    earthOrbSpeed: 0.01,
    earthRotSpeed: 0.01,
    marsOrbSpeed: 0.008,
    marsRotSpeed: 0.008,
};
const guiMercury = gui.addFolder('Mercury');
const guiVenus = gui.addFolder('Venus');
const guiEarth = gui.addFolder('Earth');
const guiMars = gui.addFolder('Mars');

guiMercury.add(param, 'mercuryRotSpeed', 0.0, 0.1, 0.001).name('Rotation Speed');
guiMercury.add(param, 'mercuryOrbSpeed', 0.0, 0.1, 0.001).name('Orbit Speed');

guiVenus.add(param, 'venusRotSpeed', 0.0, 0.1, 0.001).name('Rotation Speed');
guiVenus.add(param, 'venusOrbSpeed', 0.0, 0.1, 0.001).name('Orbit Speed');

guiEarth.add(param, 'earthRotSpeed', 0.0, 0.1, 0.001).name('Rotation Speed');
guiEarth.add(param, 'earthOrbSpeed', 0.0, 0.1, 0.001).name('Orbit Speed');

guiMars.add(param, 'marsRotSpeed', 0.0, 0.1, 0.001).name('Rotation Speed');
guiMars.add(param, 'marsOrbSpeed', 0.0, 0.1, 0.001).name('Orbit Speed');


let mercurystep = 0;
let venusstep = 0;
let earthstep = 0;
let marsstep = 0;

render();

function render() {
    orbitControls.update();
    stats.update();

    mercurystep += param.mercuryOrbSpeed * Math.PI;
    mercury.position.x = 20 * Math.cos(mercurystep);
    mercury.position.z = -20 * Math.sin(mercurystep);
    mercury.rotation.y += param.mercuryRotSpeed * Math.PI;

    venusstep += param.venusOrbSpeed * Math.PI;
    venus.position.x = 35 * Math.cos(venusstep);
    venus.position.z = -35 * Math.sin(venusstep);
    venus.rotation.y += param.venusRotSpeed * Math.PI;

    earthstep += param.earthOrbSpeed * Math.PI;
    earth.position.x = 50 * Math.cos(earthstep);
    earth.position.z = -50 * Math.sin(earthstep);
    earth.rotation.y += param.earthRotSpeed * Math.PI;

    marsstep += param.marsOrbSpeed * Math.PI;
    mars.position.x = 65 * Math.cos(marsstep);
    mars.position.z = -65 * Math.sin(marsstep);
    mars.rotation.y += param.marsRotSpeed * Math.PI;

    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
