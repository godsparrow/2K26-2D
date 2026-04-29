// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Court (floor)
const floorGeometry = new THREE.PlaneGeometry(20, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xc47a2c });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Player
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;
scene.add(player);

// Ball
const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

let ballVelocity = new THREE.Vector3();
let shooting = false;

// Hoop
const hoopGeometry = new THREE.BoxGeometry(0.1, 2, 2);
const hoopMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
hoop.position.set(8, 3, 0);
scene.add(hoop);

// Controls
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Game loop
function update() {
  // Movement
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  // Shoot
  if (keys[" "] && !shooting) {
    shooting = true;
    ballVelocity.set(0.2, 0.3, 0);
  }

  // Ball follow player
  if (!shooting) {
    ball.position.copy(player.position);
    ball.position.y += 1;
  } else {
    ball.position.add(ballVelocity);
    ballVelocity.y -= 0.01; // gravity
  }

  // Reset ball
  if (ball.position.y < 0) {
    shooting = false;
  }
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

animate();
