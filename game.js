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

// Defender (AI)
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

// Hoop
const hoop = new THREE.Mesh(
  new THREE.BoxGeometry(0.1,2,2),
  new THREE.MeshStandardMaterial({color:0xffffff})
);
hoop.position.set(8,3,0);
scene.add(hoop);

// Shot Meter
let shotPower = 0;
let charging = false;

// Controls
let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === " ") charging = true;
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;

  // RELEASE SHOT
  if (e.key === " " && charging) {
    shooting = true;
    charging = false;

    // GREEN WINDOW (perfect release)
    let perfect = shotPower > 0.45 && shotPower < 0.55;

    let powerMultiplier = perfect ? 1.2 : 0.8;

    ballVelocity.set(
      0.25 * powerMultiplier,
      0.35 * shotPower * 2,
      0
    );

    shotPower = 0;
  }
});

// Update
function update() {
  // Movement
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  // Shot meter charge
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
    ballVelocity.y -= 0.015; // gravity (arc physics)
  }

  // Reset ball
  if (ball.position.y < 0) {
    shooting = false;
  }

  // AI DEFENDER follows you
  let dx = player.position.x - defender.position.x;
  defender.position.x += dx * 0.02;

  // ANKLE BREAKER (quick move)
  if (keys["Shift"]) {
    player.position.x += (Math.random() - 0.5) * 0.5;

    // chance to stun defender
    if (Math.random() < 0.05) {
      defender.position.x += (Math.random() - 0.5) * 3;
    }
  }

  // CAMERA FOLLOW
  camera.position.x = player.position.x;
  camera.position.y = 5;
  camera.position.z = 10;

  camera.lookAt(player.position);
}

// Draw Shot Meter (HTML overlay)
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

// Animate
function animate() {
  requestAnimationFrame(animate);

  update();

  fill.style.width = (shotPower * 100) + "%";

  renderer.render(scene, camera);
}

animate();
