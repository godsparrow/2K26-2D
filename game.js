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

// Player
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0x0000ff})
);
player.position.y = 1;
scene.add(player);

// Defender
const defender = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0xff0000})
);
defender.position.set(5,1,0);
scene.add(defender);

// Ball
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.3,32,32),
  new THREE.MeshStandardMaterial({color:0xff8c00})
);
scene.add(ball);

let ballVelocity = new THREE.Vector3();
let shooting = false;

// =======================
// 🥅 HOOP + NET SYSTEM
// =======================

// Rim (torus = circle)
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

// Net (simple cone shape)
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

// Score
let score = 0;

// Controls
let keys = {};

document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === " ") charging = true;
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;

  if (e.key === " " && charging) {
    shooting = true;
    charging = false;

    // Aim toward rim
    let direction = new THREE.Vector3()
      .subVectors(rim.position, ball.position)
      .normalize();

    let perfect = Math.abs(shotPower - 0.5) < 0.08;
    let powerMultiplier = perfect ? 1.2 : 0.9;

    ballVelocity.copy(direction.multiplyScalar(0.4 * powerMultiplier));
    ballVelocity.y += 0.25 * shotPower * 2;

    shotPower = 0;
  }
});

// =======================
// 🔄 UPDATE LOOP
// =======================

function update() {

  // Movement
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  // Shot charge
  if (charging) {
    shotPower += 0.01;
    if (shotPower > 1) shotPower = 0;
  }

  // Ball follow player
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

  // 🧮 SCORING
  let dist = ball.position.distanceTo(rim.position);

  if (dist < 0.7 && shooting) {
    score++;
    console.log("SCORE:", score);
    shooting = false;
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

  // 🎮 CAMERA SMOOTH FOLLOW
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
// 🔁 ANIMATE LOOP
// =======================

function animate() {
  requestAnimationFrame(animate);

  update();

  fill.style.width = (shotPower * 100) + "%";

  renderer.render(scene, camera);
}

animate();
