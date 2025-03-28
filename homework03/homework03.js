import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
let isInitialized = false; // global variable로 event listener가 등록되었는지 확인
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let drawingMode = null;
let isfinished = false;
let tempEndPoint = null;
let startPoint = null;
let line = [];
let circlePoints = [];
let tempCirclePoints = [];
let intersections = [];

let center;
let radius;
let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임

// mouse 쓸 때 main call 방법
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

function setupCanvas() {
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 상단이 (-1, 1), 우측 하단이 (1, -1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function findCircleLineIntersections(cx, cy, radius, x1, y1, x2, y2){
    let dx = x2 - x1;
    let dy = y2 - y1;

    let A = dx * dx + dy * dy;
    let B = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    let C = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - radius * radius;

    let det = B * B - 4 * A * C;

    if(det < 0){
        return [];
    }
    else{
        let intersections = [];

        let t1 = (-B + Math.sqrt(det)) / (2 * A);
        let t2 = (-B - Math.sqrt(det)) / (2 * A);
        
        if(t1 >= 0 && t1 <= 1){
            intersections.push([x1 + t1 * dx, y1 + t1 * dy]);
        }
        if(t2 >= 0 && t2 <= 1 && t1 != t2){
            intersections.push([x1 + t2 * dx, y1 + t2 * dy]);
        }

        return intersections
    }
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;    // canvas 내 x 좌표
        const y = event.clientY - rect.top;     // canvas 내 y 좌표
        
        let [glX, glY] = convertToWebGLCoordinates(x, y);
        if(!isDrawing && !isfinished)
        {
            if(drawingMode == null)
            {
                drawingMode = "circle";
                center = [glX, glY];
            }
            else if (drawingMode == "circle")
            {
                drawingMode = "line";
                startPoint = [glX, glY];
            }

            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 
        }
    }


    function handleMouseMove(event) {
        if (isDrawing) { 
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY];

            if(drawingMode == "circle"){

                radius = Math.hypot(tempEndPoint[0]-center[0], tempEndPoint[1]-center[1]).toFixed(2);
                
                // 임시 원 그릴 선분 점들 저장
                tempCirclePoints = [];

                let theta = 0;
                const POINTS = 100;
                let cx = center[0];
                let cy = center[1];

                for (let i=0; i<POINTS; i++){
                    tempCirclePoints.push(cx + radius*Math.cos(theta));
                    tempCirclePoints.push(cy + radius*Math.sin(theta));
                    theta += (Math.PI*2 / POINTS);
                }
            }
            
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            if(drawingMode == "circle"){
                let theta = 0;
                const POINTS = 100;
                let cx = center[0];
                let cy = center[1];
    
               for (let i=0; i<POINTS; i++){
                    circlePoints.push(cx + radius*Math.cos(theta));
                    circlePoints.push(cy + radius*Math.sin(theta));
                    theta += (Math.PI*2 / POINTS);
                }
    
                updateText(textOverlay, "Circle: center (" + center[0].toFixed(2) + ", " + center[1].toFixed(2) + 
                        ") radius = " + radius);        
            }

            else if(drawingMode == "line"){
                line = [...startPoint, ...tempEndPoint];
                drawingMode = null;

                updateText(textOverlay2, "Line segment: (" + line[0].toFixed(2) + ", " + line[1].toFixed(2) + 
                ") ~ (" + line[2].toFixed(2) + ", " + line[3].toFixed(2) + ")");

                intersections = findCircleLineIntersections(center[0], center[1], radius, startPoint[0], startPoint[1], tempEndPoint[0], tempEndPoint[1]);
                
                if(intersections.length == 0)
                    updateText(textOverlay3, "No intersection");
                else if(intersections.length == 1)
                    updateText(textOverlay3, "Intersection Points: 1 Point 1: (" + intersections[0][0].toFixed(2) + ", " + intersections[0][1].toFixed(2) + ")");
                else if(intersections.length == 2)
                    updateText(textOverlay3, "Intersection Points: 2 Point 1: (" + intersections[0][0].toFixed(2) + ", " + intersections[0][1].toFixed(2) + ")" + " Point 2: (" + intersections[1][0].toFixed(2) + ", " + intersections[1][1].toFixed(2) + ")");
                isfinished = true;
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 저장된 원 그리기
    shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);

    for (let i = 0; i < circlePoints.length; i += 2){
        let line = [];
        line.push(circlePoints[i], circlePoints[i + 1]); // 시작 점
        line.push(circlePoints[(i + 2) % circlePoints.length], circlePoints[(i + 3) % circlePoints.length]); // 끝 점
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 임시 원 그리기
    if (drawingMode == "circle" && isDrawing && center && tempCirclePoints) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 원의 color는 회색
        
        for (let i = 0; i < tempCirclePoints.length; i += 2){
            let line = [];
            line.push(tempCirclePoints[i], tempCirclePoints[i + 1]); // 시작 점
            line.push(tempCirclePoints[(i + 2) % tempCirclePoints.length], tempCirclePoints[(i + 3) % tempCirclePoints.length]); // 끝 점

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // 저장된 선 그리기
    shader.setVec4("u_color", [0.0, 1.0, 0.0, 1.0]);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINES, 0, 2);

    // 임시 선 그리기
    if (drawingMode == "line" && isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                      gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 교차점 그리기
    if(intersections.length > 0){
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);    // 노란색
        for (let point of intersections){
            let dot = [point[0], point[1]];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dot), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }



    // axes 그리기
    axes.draw(mat4.create(), mat4.create());    // 두 개의 identity matrix를 parameter로 전달달
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

        // 셰이더 초기화
        shader = await initShader();
        
        // 나머지 초기화
        setupCanvas();
        setupBuffers(shader);
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
