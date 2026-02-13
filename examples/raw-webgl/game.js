// ============================================
// RAW WEBGL EXAMPLE - Creating a 3D Ball
// ============================================
// 
// WARNING: This is MUCH more complex than Three.js or Babylon.js!
// This shows why we use libraries - they hide all this complexity.
//
// Lines of code comparison:
// - Three.js:   ~50 lines
// - Babylon.js: ~50 lines  
// - Raw WebGL:  ~300+ lines (this file!)
// ============================================

// Get the canvas and WebGL context
const canvas = document.getElementById('glCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext('webgl');

if (!gl) {
  alert('WebGL not supported in your browser!');
}

// ============================================
// SHADER CODE (This is like a mini-program that runs on the graphics card)
// ============================================

// Vertex Shader - positions each point of the sphere
const vertexShaderSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vPosition = worldPosition.xyz;
    vNormal = mat3(uModelMatrix) * aNormal;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  }
`;

// Fragment Shader - colors each pixel
const fragmentShaderSource = `
  precision mediump float;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform vec3 uLightPosition;
  uniform vec3 uColor;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    
    // Ambient light
    vec3 ambient = 0.3 * uColor;
    
    // Diffuse light
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uColor;
    
    // Combine
    vec3 result = ambient + diffuse;
    gl_FragColor = vec4(result, 1.0);
  }
`;

// ============================================
// COMPILE SHADERS (Prepare the mini-programs)
// ============================================

function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
const program = createProgram(gl, vertexShader, fragmentShader);

// ============================================
// CREATE SPHERE GEOMETRY (All the math to make a ball shape!)
// ============================================

function createSphere(radius, latBands, longBands) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = (lat * Math.PI) / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let long = 0; long <= longBands; long++) {
      const phi = (long * 2 * Math.PI) / longBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let long = 0; long < longBands; long++) {
      const first = lat * (longBands + 1) + long;
      const second = first + longBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return { positions, normals, indices };
}

const sphere = createSphere(1, 32, 32);

// ============================================
// CREATE BUFFERS (Send data to the graphics card)
// ============================================

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.positions), gl.STATIC_DRAW);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.normals), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

// ============================================
// GET SHADER VARIABLE LOCATIONS
// ============================================

const aPosition = gl.getAttribLocation(program, 'aPosition');
const aNormal = gl.getAttribLocation(program, 'aNormal');
const uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
const uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
const uLightPosition = gl.getUniformLocation(program, 'uLightPosition');
const uColor = gl.getUniformLocation(program, 'uColor');

// ============================================
// MATRIX MATH (We have to do this ourselves in raw WebGL!)
// ============================================

function createPerspectiveMatrix(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

function createLookAtMatrix(eye, center, up) {
  const z = normalize(subtract(eye, center));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
  ]);
}

function createRotationMatrix(angleX, angleY) {
  const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
  
  return new Float32Array([
    cosY, 0, -sinY, 0,
    sinX * sinY, cosX, sinX * cosY, 0,
    cosX * sinY, -sinX, cosX * cosY, 0,
    0, 0, 0, 1
  ]);
}

// Vector math helpers
function subtract(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]; }
function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function normalize(v) {
  const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
  return [v[0]/len, v[1]/len, v[2]/len];
}

// ============================================
// SET UP RENDERING
// ============================================

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.53, 0.81, 0.92, 1.0); // Sky blue

const projectionMatrix = createPerspectiveMatrix(
  75 * Math.PI / 180,  // FOV in radians
  canvas.width / canvas.height,
  0.1,
  100
);

const viewMatrix = createLookAtMatrix(
  [0, 0, 5],    // Camera position
  [0, 0, 0],    // Look at center
  [0, 1, 0]     // Up direction
);

// ============================================
// ANIMATION LOOP
// ============================================

let rotationX = 0;
let rotationY = 0;

function render() {
  rotationX += 0.01;
  rotationY += 0.01;
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  
  // Set up position attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  
  // Set up normal attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.enableVertexAttribArray(aNormal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  
  // Set uniforms
  const modelMatrix = createRotationMatrix(rotationX, rotationY);
  gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
  gl.uniform3fv(uLightPosition, [5, 5, 5]);
  gl.uniform3fv(uColor, [1.0, 0.4, 0.0]); // Orange
  
  // Draw!
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
  
  requestAnimationFrame(render);
}

render();

// Handle resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
});
