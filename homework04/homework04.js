import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let axesVAO;
let sunVAO;
let earthVAO;
let moonVAO;
let isAnimating = true;
let lastTime = 0;

// 각속도
const sunRotationSpeed = 45 * (Math.PI / 180);  // 태양 자전 (rad/sec)
const earthRotationSpeed = 180 * (Math.PI / 180);  // 지구 자전
const earthOrbitSpeed = 30 * (Math.PI / 180);  // 지구 공전
const moonRotationSpeed = 180 * (Math.PI / 180);  // 달 자전
const moonOrbitSpeed = 360 * (Math.PI / 180);  // 달 공전

// 현재 각도 저장 변수
let sunRotationAngle = 0;
let earthRotationAngle = 0;
let earthOrbitAngle = 0;
let moonRotationAngle = 0;
let moonOrbitAngle = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupAxesBuffers(shader) {
    axesVAO = gl.createVertexArray();
    gl.bindVertexArray(axesVAO);

    const axesVertices = new Float32Array([
        -0.8, 0.0, 0.8, 0.0,  // x축
        0.0, -0.8, 0.0, 0.8   // y축
    ]);

    const axesColors = new Float32Array([
        1.0, 0.3, 0.0, 1.0, 1.0, 0.3, 0.0, 1.0,  // x축 색상
        0.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.5, 1.0   // y축 색상
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function setupCubeBuffers(shader) {
    const cubeVertices = new Float32Array([
        -0.50,  0.50,  // 좌상단
        -0.50, -0.50,  // 좌하단
         0.50, -0.50,  // 우하단
         0.50,  0.50   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const sunColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);

    const earthColors = new Float32Array([
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0
    ]);

    const moonColors = new Float32Array([
        1.0, 1.0, 0.0, 1.0,  // yellow
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ]);

    function createVAO(colorData){
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        //VBO for position
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
        shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

        // VBO for color
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
        shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

        // EBO
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        return vao;
    }

    // 각 객체별 VAO 생성
    sunVAO = createVAO(sunColors);  // 태양
    earthVAO = createVAO(earthColors);  // 지구
    moonVAO = createVAO(moonColors);  // 달
}


function getTransformMatrices() {
    const T_sun = mat4.create();
    const T_earth = mat4.create();
    const T_moon = mat4.create();
    
    // set T_sun
    mat4.rotate(T_sun, T_sun, sunRotationAngle, [0, 0, 1]);
    mat4.scale(T_sun, T_sun, [0.2, 0.2, 1]);

    // set T_earth
    mat4.rotate(T_earth, T_earth, earthOrbitAngle, [0, 0, 1]);
    mat4.translate(T_earth, T_earth, [0.7, 0, 0]);
    mat4.scale(T_earth, T_earth, [0.1, 0.1, 1]);
    mat4.rotate(T_earth, T_earth, earthRotationAngle, [0, 0, 1]);

    // set T_moon
    mat4.rotate(T_moon, T_moon, earthOrbitAngle, [0, 0, 1]);
    mat4.translate(T_moon, T_moon, [0.7, 0, 0]);
    mat4.rotate(T_moon, T_moon, moonOrbitAngle, [0, 0, 1]);
    mat4.translate(T_moon, T_moon, [0.2, 0, 0]);
    mat4.scale(T_moon, T_moon, [0.05, 0.05, 1]);
    mat4.rotate(T_moon, T_moon, moonRotationAngle, [0, 0, 1]);
    
    return { T_sun, T_earth, T_moon };
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();

    const { T_sun, T_earth, T_moon } = getTransformMatrices();

    // 축 그리기
    shader.setMat4("u_transform", mat4.create());
    gl.bindVertexArray(axesVAO);
    gl.drawArrays(gl.LINES, 0, 4);

    // 태양 그리기
    shader.setMat4("u_transform", T_sun);
    gl.bindVertexArray(sunVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // 지구 그리기 
    shader.setMat4("u_transform", T_earth);
    gl.bindVertexArray(earthVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // 달 그리기
    shader.setMat4("u_transform", T_moon);
    gl.bindVertexArray(moonVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (isAnimating) {
        sunRotationAngle += sunRotationSpeed * deltaTime;
        earthRotationAngle += earthRotationSpeed * deltaTime;
        earthOrbitAngle += earthOrbitSpeed * deltaTime;
        moonRotationAngle += moonRotationSpeed * deltaTime;
        moonOrbitAngle += moonOrbitSpeed * deltaTime;
    }
    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        shader = await initShader();
        setupAxesBuffers(shader);
        setupCubeBuffers(shader);
        
        shader.use();
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
