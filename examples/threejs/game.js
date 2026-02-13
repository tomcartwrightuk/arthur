// ============================================
// THREE.JS EXAMPLE - Creating a 3D Ball
// ============================================

// 1. Create a SCENE - this is our 3D world
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// 2. Create a CAMERA - this is our eyes looking into the world
const camera = new THREE.PerspectiveCamera(
  75,                                      // Field of view (how wide we can see)
  window.innerWidth / window.innerHeight,  // Aspect ratio
  0.1,                                     // Near clipping plane
  1000                                     // Far clipping plane
);
camera.position.z = 5; // Move the camera back so we can see the ball

// 3. Create a RENDERER - this draws everything to the screen
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Create a BALL (sphere)
const ballGeometry = new THREE.SphereGeometry(1, 32, 32); // radius 1, 32 segments
const ballMaterial = new THREE.MeshStandardMaterial({ 
  color: 0xff6600,  // Orange color
  roughness: 0,
  metalness: 0.3
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

// 5. Add LIGHTS so we can see the ball (without light, everything is black!)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 6. ANIMATION LOOP - this runs over and over to update the screen
function animate() {
  requestAnimationFrame(animate); // Call this function again next frame
  
  // Rotate the ball a tiny bit each frame
  ball.rotation.x += 0.01;
  ball.rotation.y += 0.01;
  
  renderer.render(scene, camera); // Draw everything!
}

animate(); // Start the animation!

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
