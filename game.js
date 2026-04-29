// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20,10),
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
  function (gltf) {
    player = gltf.scene;
    player.scale.set(0.5,0.5,0.5);
    player.position.set(0,0,0);
    scene.add(player);
  }
);

// =======================
// 🤖 DEFENDER
// =======================

const defender = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0xff0000})
);
defender.position.set(5,1,0);
scene.add(defender);

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
// 🥅 HOOP + NET
// =======================

// Rim
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(0.6, 0.05, 16, 100),
  new THREE.MeshStandardMaterial({color:0xff4500})
);
rim.rotation.x = Math.PI / 2;
rim.position.set(8, 3, 0);
scene.add(rim);

// Backboard
const backboard = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 2, 2),
  new THREE.MeshStandardMaterial({color:0xffffff})
);
backboard.position.set(8.7, 3, 0);
scene.add(backboard);

// Net
const net = new THREE.Mesh(
  new THREE.ConeGeometry(0.5, 1, 16, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    wireframe: true
  })
);
net.position.set(8, 2.4, 0);
scene.add(net);

// =======================
// 🎯 SHOT SYSTEM
// =======================

let shotPower = 0;
let charging = false;

let score = 0;
let scored = false;

// =======================
// 🎮 CONTROLS
// =======================

let keys = {};

document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === " ") charging = true;
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;

  if (e.key === " " && charging && player) {
    shooting = true;
    charging = false;

    let perfect = Math.abs(shotPower - 0.5) < 0.08;

    let direction = new THREE.Vector3()
      .subVectors(rim.position, ball.position)
      .normalize();

    if (perfect) {
      ballVelocity.copy(direction.multiplyScalar(0.5));
      ballVelocity.y += 0.3;
    } else {
      let missOffset = (Math.random() - 0.5) * 0.5;
      direction.x += missOffset;

      ballVelocity.copy(direction.multiplyScalar(0.4));
      ballVelocity.y += 0.25;
    }

    shotPower = 0;
  }
});

// =======================
// 🧯 SCORE CHECK
// =======================

function checkScore() {
  if (
    ball.position.y > rim.position.y &&
    ball.position.distanceTo(rim.position) < 0.6
  ) {
    scored = true;
  }

  if (
    scored &&
    ball.position.y < rim.position.y - 0.5
  ) {
    score++;
    console.log("SWISH 🟢 SCORE:", score);

    scored = false;
    shooting = false;
    ballVelocity.set(0,0,0);
  }
}

// =======================
// 🔄 UPDATE
// =======================

function update() {

  if (!player) return;

  // Movement
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  // Shot charge
  if (charging) {
    shotPower += 0.01;
    if (shotPower > 1) shotPower = 0;
  }

  // Ball follow
  if (!shooting) {
    ball.position.copy(player.position);
    ball.position.y += 1;
  } else {
    ball.position.add(ballVelocity);
    ballVelocity.y -= 0.015;
  }

  // Reset ball
  if (ball.position.y < 0) {
    shooting = false;
    ballVelocity.set(0,0,0);
  }

  // Score
  checkScore();

  // 🖐️ BLOCK
  if (shooting) {
    let dist = ball.position.distanceTo(defender.position);

    if (dist < 1.2 && ball.position.y > 1.5) {
      console.log("BLOCKED ❌");
      ballVelocity.x *= -0.5;
      ballVelocity.y = 0.1;
    }
  }

  // 🟡 STEAL
  if (!shooting) {
    let dist = player.position.distanceTo(defender.position);

    if (dist < 1 && Math.random() < 0.01) {
      console.log("STOLEN 🖐️");
      ball.position.copy(defender.position);
      ball.position.y += 1;
    }
  }

  // 🤖 DEFENDER AI
  let dx = player.position.x - defender.position.x;

  if (Math.abs(dx) > 0.5) {
    defender.position.x += Math.sign(dx) * 0.05;
  }

  // 💥 ANKLE BREAKER
  if (keys["Shift"]) {
    player.position.x += (Math.random() - 0.5) * 0.5;

    if (Math.random() < 0.05) {
      defender.position.x += (Math.random() - 0.5) * 3;
    }
  }

  // 🎮 CAMERA
  camera.position.lerp(
    new THREE.Vector3(player.position.x, 5, 10),
    0.1
  );

  camera.lookAt(player.position);
}

// =======================
// 🎯 SHOT METER UI
// =======================

const meter = document.createElement("div");
meter.style.position = "absolute";
meter.style.bottom = "50px";
meter.style.left = "50%";
meter.style.transform = "translateX(-50%)";
meter.style.width = "200px";
meter.style.height = "20px";
meter.style.background = "gray";
document.body.appendChild(meter);

const fill = document.createElement("div");
fill.style.height = "100%";
fill.style.width = "0%";
fill.style.background = "lime";
meter.appendChild(fill);

// =======================
// 🔁 ANIMATE
// =======================

function animate() {
  requestAnimationFrame(animate);

  update();

  fill.style.width = (shotPower * 100) + "%";

  renderer.render(scene, camera);
}

animate();
