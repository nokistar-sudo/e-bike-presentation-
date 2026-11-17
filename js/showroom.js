
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

// SHOWROOM BEREICH ERSTELLEN
const showroom = document.createElement('section');
showroom.id = 'bike-showroom';

showroom.innerHTML = `
  <div class="showroom-heading">
    <span> SPECIALIZED / DIGITAL EXPERIENCE </span>
    <h1>INTERACTIVE SHOWROOM</h1>
    <p>Entdecke das Turbo Levo Hardtail in 3D.</p>
  </div>

  <div id="bike-3d-view">
    <div class="showroom-label">3D CONCEPT MODEL</div>
    <div class="showroom-help">Maus: Drehen · Scrollen: Zoomen</div>
  </div>
`;

// DESIGN
const style = document.createElement('style');
style.textContent = `
#bike-showroom {
  background: #080a0c;
  color: white;
  padding: 75px 5%;
  text-align: center;
  font-family: Arial, sans-serif;
}
.showroom-heading span {
  color: #e63939;
  letter-spacing: 4px;
  font-size: 11px;
}
.showroom-heading h1 {
  font-size: clamp(27px, 5vw, 48px);
  margin: 15px 0;
  letter-spacing: 2px;
}
.showroom-heading p {
  color: #999;
}
#bike-3d-view {
  height: 520px;
  max-width: 1100px;
  margin: 35px auto 0;
  position: relative;
  overflow: hidden;
  border: 1px solid #292d31;
  border-radius: 12px;
  background: radial-gradient(ellipse, #22282d, #080a0c 75%);
}
#bike-3d-view canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.showroom-label, .showroom-help {
  position: absolute;
  z-index: 2;
  color: #aaa;
  font-size: 11px;
  letter-spacing: 2px;
  pointer-events: none;
}
.showroom-label {
  top: 20px;
  left: 20px;
}
.showroom-help {
  bottom: 18px;
  right: 20px;
  letter-spacing: 0;
}
@media(max-width:600px) {
  #bike-3d-view { height: 350px; }
}
`;
document.head.appendChild(style);

// SHOWROOM EINFÜGEN
const footer = document.querySelector('footer');
if (footer) {
  footer.before(showroom);
} else {
  document.body.appendChild(showroom);
}

// THREE.JS SZENE
const container = document.getElementById('bike-3d-view');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 2.3, 6);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// KAMERA STEUERUNG
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.target.set(0, 1, 0);

// LICHTER
scene.add(new THREE.AmbientLight(0xffffff, 1.8));

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(3, 5, 5);
scene.add(light);

// MATERIALIEN
const frameMaterial = new THREE.MeshStandardMaterial({
  color: 0xc92332,
  metalness: 0.65,
  roughness: 0.3
});

const darkMaterial = new THREE.MeshStandardMaterial({
  color: 0x171a1d,
  metalness: 0.5,
  roughness: 0.6
});

const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x080808,
  roughness: 0.9
});

// FAHRRAD-GRUPPE
const bike = new THREE.Group();
scene.add(bike);

// HILFSFUNKTION FÜR FAHRRADROHRE
function tube(start, end, radius, material) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius, radius, direction.length(), 12
    ),
    material
  );

  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  bike.add(mesh);
}

// RÄDER
function wheel(x) {
  const geometry = new THREE.TorusGeometry(0.62, 0.055, 12, 64);
  const tire = new THREE.Mesh(geometry, tireMaterial);
  tire.position.set(x, 0.75, 0);
  bike.add(tire);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.16, 24),
    darkMaterial
  );
  hub.rotation.x = Math.PI / 2;
  hub.position.set(x, 0.75, 0);
  bike.add(hub);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.53, 0.018, 8, 48),
    darkMaterial
  );
  rim.position.set(x, 0.75, 0);
  bike.add(rim);
}

wheel(-1.15);
wheel(1.15);

// RAHMENPUNKTE
const rear = [-1.15, 0.75, 0];
const front = [1.15, 0.75, 0];
const crank = [-0.05, 0.75, 0];
const seat = [-0.45, 1.65, 0];
const head = [0.65, 1.45, 0];

// RAHMEN
tube(rear, crank, 0.045, frameMaterial);
tube(crank, seat, 0.045, frameMaterial);
tube(seat, rear, 0.045, frameMaterial);
tube(seat, head, 0.05, frameMaterial);
tube(head, crank, 0.06, frameMaterial);
tube(head, front, 0.065, darkMaterial);

// GABEL
tube(front, [0.92, 1.45, 0], 0.045, darkMaterial);

// SITZSTANGE
tube(seat, [-0.45, 1.95, 0], 0.045, darkMaterial);

// SATTEL
tube(
  [-0.7, 1.95, 0],
  [-0.2, 1.95, 0],
  0.07,
  darkMaterial
);

// LENKER
tube(
  [0.45, 1.85, 0],
  [0.9, 1.85, 0],
  0.045,
  darkMaterial
);

// AKKU
const battery = new THREE.Mesh(
  new THREE.BoxGeometry(0.26, 0.62, 0.2),
  darkMaterial
);
battery.position.set(0.28, 1.12, 0);
battery.rotation.z = -0.45;
bike.add(battery);

// MOTOR
const motor = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 0.22, 32),
  darkMaterial
);
motor.rotation.x = Math.PI / 2;
motor.position.set(-0.05, 0.75, 0);
bike.add(motor);

// BODEN
const grid = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
grid.position.y = 0.03;
scene.add(grid);

// ANIMATION
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// RESPONSIVE GRÖSSE
window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
