import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('bike-3d-view');

if (container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(3.35, 2.25, 5.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xdcecff, 0x20272a, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(3, 6, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x79b9c6, 2.1);
  rimLight.position.set(-4, 3, -4);
  scene.add(rimLight);
  const fillLight = new THREE.PointLight(0xb4d8d3, 1.1, 12);
  fillLight.position.set(0, 2, 3);
  scene.add(fillLight);

  const bike = new THREE.Group();
  scene.add(bike);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x718b98, metalness: .72, roughness: .29 });
  const frameDark = new THREE.MeshStandardMaterial({ color: 0x26343b, metalness: .65, roughness: .36 });
  const black = new THREE.MeshStandardMaterial({ color: 0x101416, metalness: .25, roughness: .68 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x090c0d, roughness: .92 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa5a5, metalness: .86, roughness: .25 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc29b4d, metalness: .7, roughness: .3 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xc9d3d4, metalness: .55, roughness: .35 });
  const red = new THREE.MeshStandardMaterial({ color: 0xb43b3b, metalness: .45, roughness: .4 });
  const wheelGroup = new THREE.Group();
  bike.add(wheelGroup);

  function tube(group, a, b, radius, material, radial=12) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = new THREE.Vector3().subVectors(end, start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), radial), material);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
    group.add(mesh);
    return mesh;
  }
  function cylinder(group, radiusTop, radiusBottom, length, material, position, axis='y', segments=24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, length, segments), material);
    mesh.position.set(...position);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    group.add(mesh);
    return mesh;
  }
  function sphere(group, position, scale, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), material);
    mesh.position.set(...position); mesh.scale.set(...scale); group.add(mesh); return mesh;
  }

  const rear = [-1.34, .72, 0], front = [1.34, .72, 0];
  const bb = [-.36, .66, 0], seat = [-.79, 1.55, 0], headTop = [.78, 1.55, 0], headBottom = [.67, 1.19, 0];
  const wheelRadius = .69;

  function makeWheel(x) {
    const g = new THREE.Group(); g.position.set(x, .72, 0); wheelGroup.add(g);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(.61, .075, 14, 72), rubber);
    g.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.535, .018, 8, 64), metal); g.add(rim);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(.49, .008, 6, 64), frameDark); g.add(inner);
    for (let i=0;i<28;i++) {
      const angle=i*Math.PI*2/28;
      const z=(i%2===0?.045:-.045);
      tube(g,[Math.cos(angle)*.075,Math.sin(angle)*.075,z],[Math.cos(angle)*.53,Math.sin(angle)*.53,0],.006,metal,6);
    }
    cylinder(g,.045,.045,.19,metal,[0,0,0],'z',20);
    const disc=new THREE.Mesh(new THREE.TorusGeometry(.24,.012,6,48),metal); disc.position.z=.085; g.add(disc);
    for(let i=0;i<12;i++){const a=i*Math.PI/6; tube(g,[Math.cos(a)*.11,Math.sin(a)*.11,.087],[Math.cos(a)*.23,Math.sin(a)*.23,.087],.009,metal,6);}
    // Tread blocks around the tyre
    for(let i=0;i<42;i++){
      const a=i*Math.PI*2/42;
      const block=new THREE.Mesh(new THREE.BoxGeometry(.075,.035,.15),frameDark);
      block.position.set(Math.cos(a)*.68,Math.sin(a)*.68,0);
      block.rotation.z=a; g.add(block);
    }
    return g;
  }
  makeWheel(-1.34); makeWheel(1.34);

  // Hardtail frame: blue-grey main tubes and dark rear triangle
  tube(bike,rear,bb,.043,frameDark);
  tube(bike,rear,seat,.035,frameDark);
  tube(bike,seat,bb,.055,frameMat);
  tube(bike,seat,headTop,.048,frameMat);
  tube(bike,headTop,headBottom,.078,frameDark);
  tube(bike,headBottom,bb,.067,frameMat);
  tube(bike,headBottom,front,.045,frameDark);
  tube(bike,[.71,1.18,.06],front,.045,frameMat);
  // Fork legs and crown
  tube(bike,[.67,1.2,.095],front,.047,frameDark);
  tube(bike,[.67,1.2,-.095],front,.047,frameDark);
  tube(bike,[.69,1.23,.095],[.78,1.56,.095],.027,gold);
  tube(bike,[.69,1.23,-.095],[.78,1.56,-.095],.027,gold);
  tube(bike,[.78,1.56,-.12],[.78,1.56,.12],.065,black);
  // Seat post, saddle and handlebar
  tube(bike,seat,[-.88,1.82,0],.035,metal);
  const saddle=new THREE.Mesh(new THREE.BoxGeometry(.43,.075,.18),black);
  saddle.position.set(-.91,1.85,0); saddle.rotation.z=-.08; bike.add(saddle);
  tube(bike,[.78,1.56,0],[.91,1.76,0],.035,frameDark);
  tube(bike,[.68,1.77,-.39],[.68,1.77,.39],.025,black);
  for(const z of [-.43,.43]) { const grip=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.16,16),black); grip.rotation.x=Math.PI/2; grip.position.set(.68,1.77,z); bike.add(grip); }
  // Battery casing integrated along down tube
  const battery=new THREE.Mesh(new THREE.BoxGeometry(.23,.78,.19),frameDark);
  battery.position.set(.17,1.02,.015); battery.rotation.z=.39; bike.add(battery);
  const batteryStripe=new THREE.Mesh(new THREE.BoxGeometry(.012,.56,.195),accent);
  batteryStripe.position.set(.17,1.02,.113); batteryStripe.rotation.z=.39; bike.add(batteryStripe);
  // Motor housing and crankset
  const motor=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.24,40),black);
  motor.rotation.x=Math.PI/2; motor.position.set(-.34,.65,0); bike.add(motor);
  const motorCap=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.255,40),frameMat);
  motorCap.rotation.x=Math.PI/2; motorCap.position.set(-.34,.65,.02); bike.add(motorCap);
  const crank=new THREE.Mesh(new THREE.TorusGeometry(.19,.018,8,40),metal);
  crank.position.set(-.36,.66,.16); bike.add(crank);
  tube(bike,[-.36,.66,.17],[-.65,.59,.17],.025,metal);
  tube(bike,[-.36,.66,.17],[-.07,.73,.17],.025,metal);
  const pedal1=new THREE.Mesh(new THREE.BoxGeometry(.2,.045,.1),black); pedal1.position.set(-.68,.59,.17); bike.add(pedal1);
  const pedal2=new THREE.Mesh(new THREE.BoxGeometry(.2,.045,.1),black); pedal2.position.set(-.04,.73,.17); bike.add(pedal2);
  // Chainring, chain and rear cassette
  const chainring=new THREE.Mesh(new THREE.TorusGeometry(.14,.012,6,40),gold); chainring.position.set(-.36,.66,.22); bike.add(chainring);
  tube(bike,[-.36,.66,.22],[-1.34,.72,.12],.009,metal,6);
  tube(bike,[-.36,.66,.22],[-1.34,.72,.12],.009,metal,6);
  const cassette=new THREE.Mesh(new THREE.TorusGeometry(.105,.012,6,32),metal); cassette.position.set(-1.34,.72,.13); bike.add(cassette);
  // Brake calipers and small model decals
  sphere(bike,[1.18,.94,.12],[.11,.08,.09],red);
  sphere(bike,[-1.18,.94,.12],[.11,.08,.09],red);
  const logo=new THREE.Mesh(new THREE.BoxGeometry(.24,.035,.012),accent); logo.position.set(-.28,1.12,.075); logo.rotation.z=.4; bike.add(logo);
  // Cable lines on cockpit/front triangle
  tube(bike,[.67,1.76,.1],[.42,1.43,.12],.008,black,6);
  tube(bike,[.42,1.43,.12],[.75,1.12,.12],.008,black,6);

  // Ground and showroom rings
  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.15,80),new THREE.MeshStandardMaterial({color:0x20292c,roughness:.9,metalness:.1}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.035; scene.add(floor);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.35,.009,6,100),new THREE.MeshBasicMaterial({color:0x668f91,transparent:true,opacity:.42}));
  ring.rotation.x=Math.PI/2; ring.position.y=-.018; scene.add(ring);
  const grid=new THREE.GridHelper(8,32,0x506366,0x344246); grid.position.y=-.025; scene.add(grid);

  // Make the bike fill the stage, with the side view as the starting angle.
  bike.rotation.y = -.12;
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,.92,0);
  controls.enableDamping=true; controls.dampingFactor=.06;
  controls.minDistance=3.5; controls.maxDistance=9;
  controls.minPolarAngle=.45; controls.maxPolarAngle=1.48;
  controls.autoRotate=true; controls.autoRotateSpeed=.65;

  const parts = {
    frame: {title:'Der Rahmen',description:'Der blau-graue Aluminiumrahmen verbindet die wichtigsten Bauteile. Die Konstruktion ist als Hardtail ohne hinteren Dämpfer dargestellt.'},
    motor: {title:'Motor & Akku',description:'Im Bereich des Tretlagers sitzt die Motor-Einheit. Der Akku ist in dieser Konzeptdarstellung entlang des Unterrohrs integriert. Die Formen sind modellhaft und keine exakte technische Schnittzeichnung.'},
    fork: {title:'Die Federgabel',description:'Vorne nimmt die Federgabel Unebenheiten auf. Die goldfarbenen Standrohre und die dunklen Tauchrohre greifen die Optik einer sportlichen Mountainbike-Gabel auf.'},
    wheels: {title:'Laufräder & Bremsen',description:'Die großen Laufräder besitzen modellierte Speichen, Reifenprofil und Bremsscheiben. Die Darstellung ist bewusst detailliert, aber nicht maßstabsgetreu.'},
    cockpit: {title:'Das Cockpit',description:'Am Lenker befinden sich Griffe und Bedienelemente. Vorbau, Lenker und Sattel sind als eigene Bauteile aufgebaut.'}
  };
  const title=document.getElementById('part-title');
  const description=document.getElementById('part-description');
  document.querySelectorAll('.part-button').forEach(button=>{
    button.addEventListener('click',()=>{
      document.querySelectorAll('.part-button').forEach(b=>b.classList.remove('active'));
      button.classList.add('active');
      const part=parts[button.dataset.part];
      title.textContent=part.title; description.textContent=part.description;
      controls.autoRotate=false;
    });
  });
  document.getElementById('view-reset')?.addEventListener('click',()=>{
    controls.reset(); camera.position.set(3.35,2.25,5.8); controls.target.set(0,.92,0); controls.autoRotate=true;
  });

  function resize(){
    const width=Math.max(container.clientWidth,1), height=Math.max(container.clientHeight,1);
    camera.aspect=width/height; camera.updateProjectionMatrix(); renderer.setSize(width,height);
  }
  const resizeObserver=new ResizeObserver(resize); resizeObserver.observe(container); resize();
  function animate(){ requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); }
  animate();
}
