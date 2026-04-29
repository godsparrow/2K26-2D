// =======================
// 🌐 MULTIPLAYER
// =======================
const socket = io("https://your-server-url.com"); // change later

let playerId = Math.random().toString(36).substr(2, 9);
let otherPlayers = {};
let playerMeshes = {};

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
// 💡 REALISTIC LIGHTING
// =======================
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5,10,5);
light.castShadow = true;
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

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
    player.traverse(obj => obj.castShadow = true);
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
ball.castShadow = true;
scene.add(ball);

let ballVelocity = new THREE.Vector3();
let shooting = false;
let dribbling = true;

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
// 🏀 DRIBBLING SYSTEM
// =======================
let dribbleTimer = 0;

function dribble(){
  if(!player) return;

  dribbleTimer += 0.2;
  ball.position.x = player.position.x + Math.sin(dribbleTimer)*0.5;
  ball.position.y = 0.5 + Math.abs(Math.sin(dribbleTimer*2));
  ball.position.z = player.position.z;
}

// Crossovers
function crossover(){
  ball.position.x += (Math.random()-0.5)*2;
}

// =======================
// 💥 DUNK SYSTEM
// =======================
function dunk(){
  if(!player) return;

  let dist = player.position.distanceTo(rim.position);

  if(dist < 3){
    shooting = true;

    let dir = new THREE.Vector3().subVectors(rim.position, player.position).normalize();

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
  dribbling = false;

  let dir = new THREE.Vector3().subVectors(rim.position, ball.position).normalize();
  ballVelocity.copy(dir.multiplyScalar(0.5));
  ballVelocity.y += 0.3;
}

// =======================
// 🎮 CONTROLLER
// =======================
function controller(){
  const gp = navigator.getGamepads()[0];
  if(!gp) return;

  if(player){
    player.position.x += gp.axes[0]*0.1;
  }

  if(gp.buttons[0].pressed) shoot();
  if(gp.buttons[1].pressed) crossover();
  if(gp.buttons[2].pressed) dunk();
}

// =======================
// 🌐 MULTIPLAYER
// =======================
socket.on("players", data=> otherPlayers = data);

function sendData(){
  if(!player) return;
  socket.emit("updatePlayer", {
    id:playerId,
    x:player.position.x,
    y:player.position.y,
    z:player.position.z
  });
}

function updateOthers(){
  for(let id in otherPlayers){
    if(id===playerId) continue;

    if(!playerMeshes[id]){
      let m = new THREE.Mesh(
        new THREE.BoxGeometry(1,2,1),
        new THREE.MeshStandardMaterial()
      );
      scene.add(m);
      playerMeshes[id] = m;
    }

    let p = otherPlayers[id];
    playerMeshes[id].position.set(p.x,p.y,p.z);
  }
}

// =======================
// 🔄 UPDATE
// =======================
function update(){
  if(!player) return;

  // Movement
  if(keys["a"]) player.position.x -= 0.1;
  if(keys["d"]) player.position.x += 0.1;

  if(keys["Shift"]) crossover();
  if(keys[" "]) shoot();
  if(keys["e"]) dunk();

  controller();

  // Dribble or shoot
  if(!shooting){
    dribble();
  } else {
    ball.position.add(ballVelocity);
    ballVelocity.y -= 0.02;
  }

  // Score
  if(ball.position.distanceTo(rim.position)<0.6){
    addXP(25);
    shooting=false;
    dribbling=true;
  }

  // Camera
  camera.position.lerp(
    new THREE.Vector3(player.position.x,5,10),
    0.1
  );
  camera.lookAt(player.position);

  sendData();
  updateOthers();
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
