// =======================
// 🌐 MULTIPLAYER SETUP
// =======================

const socket = io("https://your-server-url.com"); // CHANGE THIS

let playerId = Math.random().toString(36).substr(2, 9);
let otherPlayers = {};

// =======================
// 🎮 SCENE SETUP
// =======================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30,15),
  new THREE.MeshStandardMaterial({color:0xc47a2c})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// =======================
// 🧍 PLAYER MODEL
// =======================

let player;

const loader = new THREE.GLTFLoader();

loader.load(
  "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
  (gltf) => {
    player = gltf.scene;
    player.scale.set(0.5,0.5,0.5);
    player.position.set(0,0,0);
    scene.add(player);
  }
);

// =======================
// 🏀 BALL
// =======================

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.3,32,32),
  new THREE.MeshStandardMaterial({color:0xff8c00})
);
scene.add(ball);

let ballVelocity = new THREE.Vector3();
let shooting = false;

// =======================
// 🥅 HOOP
// =======================

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(0.6, 0.05, 16, 100),
  new THREE.MeshStandardMaterial({color:0xff4500})
);
rim.rotation.x = Math.PI/2;
rim.position.set(10,3,0);
scene.add(rim);

// =======================
// 📊 MYCAREER SYSTEM
// =======================

let level = 1;
let xp = 0;
let nextLevelXP = 100;

function addXP(amount) {
  xp += amount;

  if (xp >= nextLevelXP) {
    level++;
    xp = 0;
    nextLevelXP += 50;
    console.log("LEVEL UP 🔥", level);
  }
}

// =======================
// 🎮 KEYBOARD CONTROLS
// =======================

let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// =======================
// 🎮 CONTROLLER SUPPORT
// =======================

function getControllerInput() {
  const gamepads = navigator.getGamepads();
  if (!gamepads[0]) return;

  const gp = gamepads[0];

  // Left stick movement
  let moveX = gp.axes[0];

  if (player) {
    player.position.x += moveX * 0.1;
  }

  // Shoot (A button)
  if (gp.buttons[0].pressed && !shooting) {
    shootBall();
  }
}

// =======================
// 🎯 SHOOTING
// =======================

function shootBall() {
  shooting = true;

  let dir = new THREE.Vector3()
    .subVectors(rim.position, ball.position)
    .normalize();

  ballVelocity.copy(dir.multiplyScalar(0.5));
  ballVelocity.y += 0.3;
}

// =======================
// 🌐 MULTIPLAYER SYNC
// =======================

socket.on("players", (players) => {
  otherPlayers = players;
});

function sendPlayerData() {
  if (!player) return;

  socket.emit("updatePlayer", {
    id: playerId,
    x: player.position.x,
    y: player.position.y,
    z: player.position.z
  });
}

// =======================
// 👥 RENDER OTHER PLAYERS
// =======================

let playerMeshes = {};

function updateOtherPlayers() {
  for (let id in otherPlayers) {
    if (id === playerId) continue;

    if (!playerMeshes[id]) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1,2,1),
        new THREE.MeshStandardMaterial({color:0x00ffcc})
      );
      scene.add(mesh);
      playerMeshes[id] = mesh;
    }

    let p = otherPlayers[id];
    playerMeshes[id].position.set(p.x, p.y, p.z);
  }
}

// =======================
// 🔄 UPDATE LOOP
// =======================

function update() {

  if (!player) return;

  // Keyboard movement
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  if (keys[" "]) shootBall();

  // Controller
  getControllerInput();

  // Ball follow
  if (!shooting) {
    ball.position.copy(player.position);
    ball.position.y += 1;
  } else {
    ball.position.add(ballVelocity);
    ballVelocity.y -= 0.015;
  }

  // Score detection
  if (ball.position.distanceTo(rim.position) < 0.6) {
    addXP(25);
    shooting = false;
    ballVelocity.set(0,0,0);
  }

  // Camera
  camera.position.lerp(
    new THREE.Vector3(player.position.x, 5, 10),
    0.1
  );

  camera.lookAt(player.position);

  // Multiplayer
  sendPlayerData();
  updateOtherPlayers();
}

// =======================
// 🔁 ANIMATE
// =======================

function animate() {
  requestAnimationFrame(animate);

  update();

  renderer.render(scene, camera);
}

animate();
