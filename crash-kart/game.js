// ============================================
// CRASH KART - A Car Sandbox Game
// ============================================

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// UI Elements
const stealPrompt = document.getElementById("steal-prompt");
const speedDisplay = document.getElementById("speed-display");

// Game state
let currentCar = null;
let allCars = [];
let nearestCar = null;

// Input state
const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  enter: false
};

// Car colors for variety
const CAR_COLORS = [
  { name: "White", color: new BABYLON.Color3(1, 1, 1) },
  { name: "Red", color: new BABYLON.Color3(0.9, 0.1, 0.1) },
  { name: "Blue", color: new BABYLON.Color3(0.1, 0.3, 0.9) },
  { name: "Yellow", color: new BABYLON.Color3(1, 0.85, 0) },
  { name: "Green", color: new BABYLON.Color3(0.1, 0.7, 0.2) },
  { name: "Orange", color: new BABYLON.Color3(1, 0.5, 0) },
  { name: "Purple", color: new BABYLON.Color3(0.6, 0.1, 0.8) },
  { name: "Black", color: new BABYLON.Color3(0.1, 0.1, 0.1) },
];

// ============================================
// CREATE THE SCENE
// ============================================
const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  
  // Sky color
  scene.clearColor = new BABYLON.Color4(0.4, 0.6, 0.9, 1);

  // ========== PHYSICS ==========
  const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
  const physicsPlugin = new BABYLON.CannonJSPlugin();
  scene.enablePhysics(gravityVector, physicsPlugin);

  // ========== CAMERA (Chase Camera) ==========
  const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0, 8, -15),
    scene
  );
  camera.fov = 1.0; // Slightly wider field of view
  
  // Camera smoothing values (stored on camera for access in update)
  camera.smoothPosition = new BABYLON.Vector3(0, 8, -15);
  camera.smoothTarget = new BABYLON.Vector3(0, 0, 0);

  // ========== LIGHTING ==========
  const sunLight = new BABYLON.DirectionalLight(
    "sunLight",
    new BABYLON.Vector3(-1, -2, -1),
    scene
  );
  sunLight.intensity = 0.8;
  sunLight.position = new BABYLON.Vector3(20, 40, 20);

  const ambientLight = new BABYLON.HemisphericLight(
    "ambientLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  ambientLight.intensity = 0.5;

  // ========== GROUND ==========
  const ground = createGround(scene);

  // ========== CREATE CARS ==========
  // Player's starting car (white Lamborghini)
  const playerCar = createCar(scene, 0, 0, CAR_COLORS[0]);
  allCars.push(playerCar);
  currentCar = playerCar;
  currentCar.isPlayerControlled = true;

  // Spawn additional cars around the map
  const carSpawnPositions = [
    { x: 15, z: 10 },
    { x: -20, z: 5 },
    { x: 30, z: -15 },
    { x: -10, z: -25 },
    { x: 25, z: 25 },
    { x: -30, z: -30 },
    { x: 40, z: 0 },
  ];

  carSpawnPositions.forEach((pos, index) => {
    const colorIndex = (index + 1) % CAR_COLORS.length;
    const car = createCar(scene, pos.x, pos.z, CAR_COLORS[colorIndex]);
    // Apply random rotation using quaternion
    const randomAngle = Math.random() * Math.PI * 2;
    car.body.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, randomAngle, 0);
    allCars.push(car);
  });

  // ========== INPUT HANDLING ==========
  setupInputHandling(scene);

  // ========== GAME LOOP ==========
  scene.registerBeforeRender(() => {
    updateCarPhysics();
    updateCamera(camera);
    checkNearestCar();
    updateUI();
  });

  return scene;
};

// ============================================
// CREATE GROUND
// ============================================
function createGround(scene) {
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 200, height: 200, subdivisions: 50 },
    scene
  );

  // Asphalt material
  const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  groundMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  ground.material = groundMaterial;

  // Physics for ground
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 0.8, restitution: 0.1 },
    scene
  );

  return ground;
}

// ============================================
// CREATE CAR
// ============================================
function createCar(scene, x, z, colorData) {
  // Car data object
  const carData = {
    node: null,
    body: null,
    wheels: [],
    speed: 0,
    steering: 0,
    isPlayerControlled: false,
    color: colorData
  };

  // Parent mesh for the car (no physics - we control it directly)
  const carBody = BABYLON.MeshBuilder.CreateBox(
    "carBody_" + x + "_" + z,
    { width: 2, height: 0.8, depth: 4.5 },
    scene
  );
  carBody.position = new BABYLON.Vector3(x, 1, z);
  carBody.visibility = 0; // Hide the collision box
  
  // Initialize rotation quaternion
  carBody.rotationQuaternion = BABYLON.Quaternion.Identity();
  
  // NO physics impostor - we move the car directly with code

  carData.body = carBody;

  // Visual car parts (parented to physics body)
  const visualCar = createCarVisuals(scene, colorData.color);
  visualCar.parent = carBody;
  visualCar.position.y = -0.1;
  
  carData.node = visualCar;
  carData.wheels = visualCar.wheels;

  // Store car data on the mesh for easy access
  carBody.carData = carData;

  return carData;
}

// ============================================
// CREATE CAR VISUALS
// ============================================
function createCarVisuals(scene, bodyColor) {
  const car = new BABYLON.TransformNode("carVisual", scene);
  car.wheels = [];

  // Body material with the specified color
  const bodyMaterial = new BABYLON.StandardMaterial("carBodyMat", scene);
  bodyMaterial.diffuseColor = bodyColor;
  bodyMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  bodyMaterial.specularPower = 32;

  // Black trim
  const blackMaterial = new BABYLON.StandardMaterial("blackTrim", scene);
  blackMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  blackMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

  // Glass
  const glassMaterial = new BABYLON.StandardMaterial("glass", scene);
  glassMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
  glassMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
  glassMaterial.alpha = 0.4;

  // Lights
  const headlightMaterial = new BABYLON.StandardMaterial("headlight", scene);
  headlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.9);
  headlightMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.2);

  const tailLightMaterial = new BABYLON.StandardMaterial("tailLight", scene);
  tailLightMaterial.diffuseColor = new BABYLON.Color3(0.8, 0, 0);
  tailLightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0, 0);

  // ===== BODY PARTS =====
  
  // Lower body
  const lowerBody = BABYLON.MeshBuilder.CreateBox("lowerBody", { width: 2, height: 0.4, depth: 4.5 }, scene);
  lowerBody.position.y = 0.3;
  lowerBody.material = bodyMaterial;
  lowerBody.parent = car;

  // Front wedge
  const frontWedge = BABYLON.MeshBuilder.CreateBox("frontWedge", { width: 1.9, height: 0.3, depth: 1.2 }, scene);
  frontWedge.position = new BABYLON.Vector3(0, 0.25, 2.5);
  frontWedge.rotation.x = -0.15;
  frontWedge.material = bodyMaterial;
  frontWedge.parent = car;

  // Front splitter
  const frontSplitter = BABYLON.MeshBuilder.CreateBox("frontSplitter", { width: 2.1, height: 0.08, depth: 0.6 }, scene);
  frontSplitter.position = new BABYLON.Vector3(0, 0.1, 2.9);
  frontSplitter.material = blackMaterial;
  frontSplitter.parent = car;

  // Rear section
  const rearSection = BABYLON.MeshBuilder.CreateBox("rearSection", { width: 2, height: 0.5, depth: 1.2 }, scene);
  rearSection.position = new BABYLON.Vector3(0, 0.35, -1.8);
  rearSection.material = bodyMaterial;
  rearSection.parent = car;

  // Cabin
  const cabin = BABYLON.MeshBuilder.CreateBox("cabin", { width: 1.6, height: 0.5, depth: 1.8 }, scene);
  cabin.position = new BABYLON.Vector3(0, 0.7, -0.2);
  cabin.material = bodyMaterial;
  cabin.parent = car;

  // Windshield
  const windshield = BABYLON.MeshBuilder.CreateBox("windshield", { width: 1.5, height: 0.5, depth: 0.1 }, scene);
  windshield.position = new BABYLON.Vector3(0, 0.85, 0.75);
  windshield.rotation.x = -0.6;
  windshield.material = glassMaterial;
  windshield.parent = car;

  // Rear window
  const rearWindow = BABYLON.MeshBuilder.CreateBox("rearWindow", { width: 1.4, height: 0.4, depth: 0.1 }, scene);
  rearWindow.position = new BABYLON.Vector3(0, 0.85, -1.0);
  rearWindow.rotation.x = 0.5;
  rearWindow.material = glassMaterial;
  rearWindow.parent = car;

  // Side windows
  [-0.8, 0.8].forEach((xPos, i) => {
    const sideWindow = BABYLON.MeshBuilder.CreateBox("sideWindow" + i, { width: 0.1, height: 0.35, depth: 1.2 }, scene);
    sideWindow.position = new BABYLON.Vector3(xPos, 0.8, -0.1);
    sideWindow.material = glassMaterial;
    sideWindow.parent = car;
  });

  // Side intakes
  [-1.0, 1.0].forEach((xPos, i) => {
    const intake = BABYLON.MeshBuilder.CreateBox("intake" + i, { width: 0.15, height: 0.25, depth: 0.8 }, scene);
    intake.position = new BABYLON.Vector3(xPos, 0.35, -0.8);
    intake.material = blackMaterial;
    intake.parent = car;
  });

  // Spoiler
  const spoiler = BABYLON.MeshBuilder.CreateBox("spoiler", { width: 2.0, height: 0.05, depth: 0.3 }, scene);
  spoiler.position = new BABYLON.Vector3(0, 1.0, -2.2);
  spoiler.material = bodyMaterial;
  spoiler.parent = car;

  // Spoiler supports
  [-0.7, 0.7].forEach((xPos, i) => {
    const support = BABYLON.MeshBuilder.CreateBox("spoilerSupport" + i, { width: 0.08, height: 0.35, depth: 0.1 }, scene);
    support.position = new BABYLON.Vector3(xPos, 0.8, -2.2);
    support.material = bodyMaterial;
    support.parent = car;
  });

  // Headlights
  [-0.6, 0.6].forEach((xPos, i) => {
    const headlight = BABYLON.MeshBuilder.CreateBox("headlight" + i, { width: 0.35, height: 0.1, depth: 0.05 }, scene);
    headlight.position = new BABYLON.Vector3(xPos, 0.35, 3.0);
    headlight.material = headlightMaterial;
    headlight.parent = car;
  });

  // Tail lights
  [-0.6, 0.6].forEach((xPos, i) => {
    const tailLight = BABYLON.MeshBuilder.CreateBox("tailLight" + i, { width: 0.4, height: 0.15, depth: 0.05 }, scene);
    tailLight.position = new BABYLON.Vector3(xPos, 0.45, -2.4);
    tailLight.material = tailLightMaterial;
    tailLight.parent = car;
  });

  // ===== WHEELS =====
  const wheelMaterial = new BABYLON.StandardMaterial("wheel", scene);
  wheelMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const rimMaterial = new BABYLON.StandardMaterial("rim", scene);
  rimMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
  rimMaterial.specularColor = new BABYLON.Color3(1, 1, 1);

  const wheelPositions = [
    { x: -1.0, z: 1.6, name: "FL" },
    { x: 1.0, z: 1.6, name: "FR" },
    { x: -1.05, z: -1.5, name: "RL" },
    { x: 1.05, z: -1.5, name: "RR" }
  ];

  wheelPositions.forEach(pos => {
    const wheelNode = new BABYLON.TransformNode("wheel" + pos.name, scene);
    
    const tire = BABYLON.MeshBuilder.CreateCylinder("tire" + pos.name, { height: 0.35, diameter: 0.7, tessellation: 24 }, scene);
    tire.rotation.z = Math.PI / 2;
    tire.material = wheelMaterial;
    tire.parent = wheelNode;

    const rim = BABYLON.MeshBuilder.CreateCylinder("rim" + pos.name, { height: 0.36, diameter: 0.45, tessellation: 12 }, scene);
    rim.rotation.z = Math.PI / 2;
    rim.material = rimMaterial;
    rim.parent = wheelNode;

    wheelNode.position = new BABYLON.Vector3(pos.x, 0.35, pos.z);
    wheelNode.parent = car;
    
    car.wheels.push(wheelNode);
  });

  return car;
}

// ============================================
// INPUT HANDLING
// ============================================
function setupInputHandling(scene) {
  scene.onKeyboardObservable.add((kbInfo) => {
    const pressed = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
    
    switch (kbInfo.event.key.toLowerCase()) {
      case "w":
      case "arrowup":
        keys.forward = pressed;
        break;
      case "s":
      case "arrowdown":
        keys.backward = pressed;
        break;
      case "a":
      case "arrowleft":
        keys.left = pressed;
        break;
      case "d":
      case "arrowright":
        keys.right = pressed;
        break;
      case "f":
        if (pressed && !keys.enter) {
          keys.enter = true;
          tryStealCar();
        } else if (!pressed) {
          keys.enter = false;
        }
        break;
    }
  });
}

// ============================================
// CAR PHYSICS UPDATE (Simple arcade-style)
// ============================================

// Car state
let carSpeed = 0;       // Forward speed (can be negative for reverse)
let carRotation = 0;    // Y rotation in radians

function updateCarPhysics() {
  if (!currentCar || !currentCar.body) return;

  const carBody = currentCar.body;
  
  // Get current rotation from quaternion
  const euler = carBody.rotationQuaternion.toEulerAngles();
  carRotation = euler.y;

  // ===== ACCELERATION / BRAKING =====
  const maxSpeed = 0.8;
  const acceleration = 0.02;
  const braking = 0.03;
  const friction = 0.98;
  
  if (keys.forward) {
    carSpeed = Math.min(carSpeed + acceleration, maxSpeed);
  } else if (keys.backward) {
    carSpeed = Math.max(carSpeed - braking, -maxSpeed * 0.5);
  } else {
    // Apply friction when not accelerating
    carSpeed *= friction;
    if (Math.abs(carSpeed) < 0.001) carSpeed = 0;
  }

  // ===== STEERING =====
  const steerSpeed = 0.04;
  
  if (Math.abs(carSpeed) > 0.01) {
    // Steer based on speed direction
    const steerAmount = steerSpeed * Math.sign(carSpeed);
    
    if (keys.left) {
      carRotation -= steerAmount;
      currentCar.steering = Math.min(currentCar.steering + 0.15, 0.6);
    } else if (keys.right) {
      carRotation += steerAmount;
      currentCar.steering = Math.max(currentCar.steering - 0.15, -0.6);
    } else {
      currentCar.steering *= 0.7;
    }
  } else {
    currentCar.steering *= 0.7;
  }

  // Apply rotation
  carBody.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, carRotation, 0);

  // Calculate forward direction
  const forwardX = Math.sin(carRotation);
  const forwardZ = Math.cos(carRotation);

  // Move car
  carBody.position.x += forwardX * carSpeed;
  carBody.position.z += forwardZ * carSpeed;
  
  // Keep car at fixed height
  carBody.position.y = 1;

  // Update speed display (convert to km/h-like units)
  currentCar.speed = Math.abs(carSpeed) * 120;

  // Animate wheels
  currentCar.wheels.forEach((wheel, index) => {
    const tire = wheel.getChildren()[0];
    if (tire) {
      tire.rotation.x += carSpeed * 2;
    }
    if (index < 2) {
      wheel.rotation.y = currentCar.steering * 0.5;
    }
  });
}

// ============================================
// CAMERA FOLLOW
// ============================================
function updateCamera(camera) {
  if (!currentCar) return;
  
  const carBody = currentCar.body;
  const carPos = carBody.getAbsolutePosition();
  
  // Get car's backward direction (camera goes behind the car)
  const backward = new BABYLON.Vector3(0, 0, -1);
  const rotationMatrix = new BABYLON.Matrix();
  carBody.rotationQuaternion.toRotationMatrix(rotationMatrix);
  const carBackward = BABYLON.Vector3.TransformNormal(backward, rotationMatrix);
  
  // Camera position: behind and above the car
  const cameraDistance = 12;
  const cameraHeight = 5;
  
  const targetCameraPos = new BABYLON.Vector3(
    carPos.x + carBackward.x * cameraDistance,
    carPos.y + cameraHeight,
    carPos.z + carBackward.z * cameraDistance
  );
  
  // Smooth camera movement (lerp)
  const smoothing = 0.08;
  camera.smoothPosition = BABYLON.Vector3.Lerp(
    camera.smoothPosition,
    targetCameraPos,
    smoothing
  );
  
  // Look slightly ahead of the car
  const lookAhead = 3;
  const carForward = carBackward.scale(-1);
  const targetLookAt = new BABYLON.Vector3(
    carPos.x + carForward.x * lookAhead,
    carPos.y + 1,
    carPos.z + carForward.z * lookAhead
  );
  
  camera.smoothTarget = BABYLON.Vector3.Lerp(
    camera.smoothTarget,
    targetLookAt,
    smoothing
  );
  
  // Apply camera position and look-at
  camera.position = camera.smoothPosition;
  camera.setTarget(camera.smoothTarget);
}

// ============================================
// CHECK NEAREST CAR (FOR STEALING)
// ============================================
function checkNearestCar() {
  if (!currentCar) return;
  
  const playerPos = currentCar.body.getAbsolutePosition();
  let nearest = null;
  let nearestDist = Infinity;
  
  allCars.forEach(car => {
    if (car === currentCar) return;
    
    const carPos = car.body.getAbsolutePosition();
    const dist = BABYLON.Vector3.Distance(playerPos, carPos);
    
    if (dist < nearestDist && dist < 8) { // Within 8 units
      nearest = car;
      nearestDist = dist;
    }
  });
  
  nearestCar = nearest;
}

// ============================================
// STEAL / SWITCH CAR
// ============================================
function tryStealCar() {
  if (nearestCar) {
    // Exit current car
    currentCar.isPlayerControlled = false;
    
    // Enter new car
    currentCar = nearestCar;
    currentCar.isPlayerControlled = true;
    nearestCar = null;
    
    console.log("Stole a " + currentCar.color.name + " car!");
  }
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
  // Speed display
  const speed = currentCar ? Math.round(currentCar.speed) : 0;
  speedDisplay.textContent = speed + " km/h";
  
  // Steal prompt
  if (nearestCar) {
    stealPrompt.style.display = "block";
    stealPrompt.innerHTML = `Press <kbd>F</kbd> to steal the <strong style="color: ${colorToCSS(nearestCar.color.color)}">${nearestCar.color.name}</strong> car!`;
  } else {
    stealPrompt.style.display = "none";
  }
}

function colorToCSS(babylonColor) {
  return `rgb(${Math.round(babylonColor.r * 255)}, ${Math.round(babylonColor.g * 255)}, ${Math.round(babylonColor.b * 255)})`;
}

// ============================================
// START THE GAME
// ============================================
createScene().then(scene => {
  engine.runRenderLoop(() => {
    scene.render();
  });
});

window.addEventListener("resize", () => {
  engine.resize();
});
