// ============================================
// BABYLON.JS EXAMPLE - Creating a 3D Ball
// ============================================

// 1. Get the canvas element from HTML
const canvas = document.getElementById("renderCanvas");

// 2. Create the Babylon ENGINE - this handles all the WebGL stuff
const engine = new BABYLON.Engine(canvas, true);

// 3. Create the SCENE - our 3D world
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.53, 0.81, 0.92); // Sky blue background

// 4. Create a CAMERA - our eyes looking into the world
//    ArcRotateCamera lets you rotate around an object with the mouse!
const camera = new BABYLON.ArcRotateCamera(
  "camera",           // Name
  Math.PI / 2,        // Alpha (horizontal rotation)
  Math.PI / 3,        // Beta (vertical rotation)
  5,                  // Radius (distance from target)
  BABYLON.Vector3.Zero(), // Target position (center of world)
  scene
);
camera.attachControl(canvas, true); // Allow mouse control!

// 5. Add LIGHTS so we can see the ball
const light = new BABYLON.HemisphericLight(
  "light",
  new BABYLON.Vector3(1, 1, 0), // Direction
  scene
);
light.intensity = 1;

// 6. Create a BALL (sphere)
const ball = BABYLON.MeshBuilder.CreateSphere(
  "ball",             // Name
  { diameter: 2, segments: 32 }, // Options
  scene
);

// 7. Create a MATERIAL (the "skin" of the ball)
const ballMaterial = new BABYLON.StandardMaterial("ballMaterial", scene);
ballMaterial.diffuseColor = new BABYLON.Color3(1, 0.4, 0); // Orange color
ballMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Shininess
ball.material = ballMaterial;

// 8. ANIMATION - rotate the ball every frame
scene.registerBeforeRender(() => {
  ball.rotation.x += 0.01;
  ball.rotation.y += 0.01;
});

// 9. RENDER LOOP - draw everything continuously
engine.runRenderLoop(() => {
  scene.render();
});

// Handle window resize
window.addEventListener("resize", () => {
  engine.resize();
});
