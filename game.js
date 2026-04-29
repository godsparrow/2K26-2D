// =======================
// 🎮 SCENE
// =======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// =======================
// 💡 LIGHTING
// =======================
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5,10,5);
light.castShadow = true;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// =======================
// 🏀 COURT
// =======================
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30,15),
  new THREE.MeshStandardMaterial({color:0xb5651d})
);
floor.rotation.x = -Math.PI/2;
floor.receiveShadow = true;
scene.add(floor);

// =======================
// 🧍 PLAYER
// =======================
let player;
const loader = new THREE.GLTFLoader();

loader.load(
  "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
  (gltf)=>{
    player = gltf.scene;
    player.scale.set(0.5,0.5,0.5);
    player.traverse(obj=>obj.castShadow=true);
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
defender.castShadow = true;
scene.add(defender);

// =======================
// 🏀 BALL
// =======================
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.3,32,32),
  new THREE.MeshStandardMaterial({color:0xff8c00})
);
ball.castShadow = true;
scene.add(ball);

let ballVelocity = new THREE.Vector3();
let shooting = false;

// =======================
// 🥅 HOOP
// =======================
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(0.6,0.05,16,100),
  new THREE.MeshStandardMaterial({color:0xff4500})
);
rim.rotation.x = Math.PI/2;
rim.position.set(10,3,0);
scene.add(rim);

// =======================
// 📊 MYCAREER
// =======================
let level = 1, xp = 0, nextXP = 100;

function addXP(val){
  xp += val;
  if(xp >= nextXP){
    level++;
    xp = 0;
    nextXP += 50;
  }
  document.getElementById("level").innerText = "Level: " + level;
  document.getElementById("xp").innerText = "XP: " + xp;
}

// =======================
// 🎮 INPUT
// =======================
let keys = {};
document.addEventListener("keydown", e=>keys[e.key]=true);
document.addEventListener("keyup", e=>keys[e.key]=false);

// =======================
// 🏀 DRIBBLING
// =======================
let dribbleTime = 0;

function dribble(){
  dribbleTime += 0.2;
  ball.position.x = player.position.x + Math.sin(dribbleTime)*0.5;
  ball.position.y = 0.5 + Math.abs(Math.sin(dribbleTime*2));
  ball.position.z = player.position.z;
}

function crossover(){
  ball.position.x += (Math.random()-0.5)*2;

  // ankle breaker effect
  if(Math.random() < 0.2){
    defender.position.x += (Math.random()-0.5)*3;
  }
}

// =======================
// 💥 DUNK
// =======================
function dunk(){
  let dist = player.position.distanceTo(rim.position);

  if(dist < 3){
    shooting = true;

    let dir = new THREE.Vector3()
      .subVectors(rim.position, player.position)
      .normalize();

    ball.position.copy(player.position);
    ballVelocity.copy(dir.multiplyScalar(0.6));
    ballVelocity.y = 0.5;

    addXP(50);
    console.log("DUNK 💥");
  }
}

// =======================
// 🎯 SHOOT
// =======================
function shoot(){
  shooting = true;

  let dir = new THREE.Vector3()
    .subVectors(rim.position, ball.position)
    .normalize();

  ballVelocity.copy(dir.multiplyScalar(0.5));
  ballVelocity.y += 0.3;
}

// =======================
// 🎮 CONTROLLER
// =======================
function controller(){
  const gp = navigator.getGamepads()[0];
  if(!gp) return;

  player.position.x += gp.axes[0]*0.1;

  if(gp.buttons[0].pressed) shoot();
  if(gp.buttons[1].pressed) crossover();
  if(gp.buttons[2].pressed) dunk();
}

// =======================
// 🤖 DEFENDER AI
// =======================
function defenderAI(){
  let dx = player.position.x - defender.position.x;

  if(Math.abs(dx) > 0.5){
    defender.position.x += Math.sign(dx)*0.05;
  }
}

// =======================
// 🔄 UPDATE
// =======================
function update(){
  if(!player) return;

  // movement
  if(keys["a"]) player.position.x -= 0.1;
  if(keys["d"]) player.position.x += 0.1;

  if(keys["Shift"]) crossover();
  if(keys[" "]) shoot();
  if(keys["e"]) dunk();

  controller();
  defenderAI();

  // ball logic
  if(!shooting){
    dribble();
  } else {
    ball.position.add(ballVelocity);
    ballVelocity.y -= 0.02;
  }

  // score
  if(ball.position.distanceTo(rim.position)<0.6){
    addXP(25);
    shooting=false;
  }

  // camera
  camera.position.lerp(
    new THREE.Vector3(player.position.x,5,10),
    0.1
  );
  camera.lookAt(player.position);
}

// =======================
// 🔁 LOOP
// =======================
function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}
animate();
