
import * as THREE from 'three';

import { OrbitControls } from
'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

// Container finden
const container = document.getElementById('bike-3d-view');

if (!container) {
  console.error('3D-Showroom wurde nicht gefunden!');
} else {

  // Szene erstellen
  const scene = new THREE.Scene();

  // Kamera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(3, 3, 5);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  container.appendChild(renderer.domElement);

  // Licht
  scene.add(new THREE.AmbientLight(0xffffff, 2));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(3, 5, 4);
  scene.add(light);

  // 3D-Würfel als Testobjekt
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

  const material = new THREE.MeshStandardMaterial({
    color: 0xe32636,
    metalness: 0.5,
    roughness: 0.3
  });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Boden
  const grid = new THREE.GridHelper(10, 20);
  scene.add(grid);

  // Maussteuerung
  const controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;

  // Animation
  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.y += 0.005;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // Fenstergröße anpassen
  window.addEventListener('resize', () => {
    camera.aspect =
      container.clientWidth / container.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );
  });
}
