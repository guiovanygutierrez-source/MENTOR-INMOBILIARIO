const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let activeScene = null;

function line(THREE, points, color, opacity = 0.7) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point)));
  const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  return new THREE.Line(geometry, material);
}

function boxModel(THREE, group, {x, z, width, depth, height, color, edge = 0x69e7f4}) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({color, roughness:0.38, metalness:0.46, emissive:color, emissiveIntensity:0.08});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, height / 2 + 0.09, z);
  group.add(mesh);
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({color:edge, transparent:true, opacity:0.72}));
  outline.position.copy(mesh.position);
  group.add(outline);
  return mesh;
}

function makeScene(THREE, canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(5.1, 3.8, 6.5);
  camera.lookAt(0, 0.65, 0);
  scene.add(new THREE.HemisphereLight(0x97e8ff, 0x17243b, 1.7));
  const key = new THREE.DirectionalLight(0xdffbff, 3.0);
  key.position.set(3, 6, 4);
  scene.add(key);
  const cyanLight = new THREE.PointLight(0x19d9fa, 24, 8, 1.8);
  cyanLight.position.set(-2.4, 2.1, 1.4);
  scene.add(cyanLight);
  const blueLight = new THREE.PointLight(0x446dff, 18, 9, 1.8);
  blueLight.position.set(2.6, 1.2, -2.2);
  scene.add(blueLight);

  const assembly = new THREE.Group();
  scene.add(assembly);
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(4.7, 0.16, 3.6),
    new THREE.MeshStandardMaterial({color:0x182b43, roughness:0.5, metalness:0.52, emissive:0x10233a, emissiveIntensity:0.18})
  );
  foundation.position.y = 0;
  assembly.add(foundation);
  const foundationEdges = new THREE.LineSegments(new THREE.EdgesGeometry(foundation.geometry), new THREE.LineBasicMaterial({color:0x54dff2, transparent:true, opacity:0.7}));
  foundationEdges.position.copy(foundation.position);
  assembly.add(foundationEdges);

  const grid = new THREE.Group();
  const gridColor = 0x416179;
  for (let x = -2; x <= 2; x += 0.5) grid.add(line(THREE,[[x,0.086,-1.65],[x,0.086,1.65]], gridColor, 0.23));
  for (let z = -1.5; z <= 1.5; z += 0.5) grid.add(line(THREE,[[-2.2,0.086,z],[2.2,0.086,z]], gridColor, 0.23));
  assembly.add(grid);

  boxModel(THREE, assembly, {x:-1.22,z:-0.72,width:0.92,depth:0.83,height:1.72,color:0x234765});
  boxModel(THREE, assembly, {x:0.05,z:-0.85,width:1.0,depth:0.9,height:1.15,color:0x263d63});
  boxModel(THREE, assembly, {x:1.4,z:-0.68,width:0.72,depth:0.94,height:2.08,color:0x1c4b62,edge:0x69e7f4});
  boxModel(THREE, assembly, {x:-0.72,z:0.7,width:1.1,depth:0.82,height:0.68,color:0x32496d,edge:0x80aaff});
  boxModel(THREE, assembly, {x:0.72,z:0.72,width:0.94,depth:0.76,height:0.91,color:0x244860});

  const orbitMaterial = new THREE.MeshBasicMaterial({color:0x36e5f4, wireframe:true, transparent:true, opacity:0.76});
  const orbit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), orbitMaterial);
  orbit.position.set(0.25, 2.55, 0.05);
  assembly.add(orbit);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshBasicMaterial({color:0x9df8ff}));
  orb.position.set(-1.8, 1.96, 0.7);
  assembly.add(orb);
  const orbitPath = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.008, 5, 110), new THREE.MeshBasicMaterial({color:0x36dff4, transparent:true, opacity:0.42}));
  orbitPath.position.set(0, 1.42, 0);
  orbitPath.rotation.x = Math.PI / 2.55;
  assembly.add(orbitPath);

  const dustPositions = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++) {
    dustPositions[i*3] = (Math.random()-0.5)*5.5;
    dustPositions[i*3+1] = Math.random()*3.2;
    dustPositions[i*3+2] = (Math.random()-0.5)*4.2;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions,3));
  const dust = new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0x83eafa,size:0.018,transparent:true,opacity:0.42,sizeAttenuation:true}));
  scene.add(dust);

  const pointer = {x:0,y:0,targetX:0,targetY:0};
  const bounds = canvas.parentElement;
  const onPointerMove = event => {
    const rect = bounds.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.58;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.34;
  };
  const onPointerLeave = () => { pointer.targetX = 0; pointer.targetY = 0; };
  bounds.addEventListener('pointermove', onPointerMove, {passive:true});
  bounds.addEventListener('pointerleave', onPointerLeave, {passive:true});

  const resize = () => {
    const width = Math.max(1, bounds.clientWidth);
    const height = Math.max(1, bounds.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect = width / height;
    camera.fov = width < 500 ? 41 : width < 800 ? 37 : 34;
    camera.position.set(width < 500 ? 5.8 : 5.1, width < 500 ? 4.5 : 3.8, width < 500 ? 7.8 : 6.5);
    camera.lookAt(0,0.78,0);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(bounds);
  resize();

  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    if (!prefersReducedMotion) {
      pointer.x += (pointer.targetX-pointer.x)*0.045;
      pointer.y += (pointer.targetY-pointer.y)*0.045;
      assembly.rotation.y = Math.sin(time*0.18)*0.09 + pointer.x;
      assembly.rotation.x = Math.cos(time*0.15)*0.025 - pointer.y;
      orbit.rotation.x = time*0.18;
      orbit.rotation.y = time*0.24;
      orbitPath.rotation.z = Math.sin(time*0.14)*0.09;
      cyanLight.position.x = -2.4 + Math.sin(time*0.32)*0.42;
      blueLight.position.z = -2.2 + Math.cos(time*0.27)*0.55;
      dust.rotation.y = time*0.012;
    }
    renderer.render(scene,camera);
  };

  return {
    render,
    start(){ if (prefersReducedMotion) render(); else renderer.setAnimationLoop(render); },
    pause(){ renderer.setAnimationLoop(null); },
    dispose(){
      observer.disconnect();
      bounds.removeEventListener('pointermove',onPointerMove);
      bounds.removeEventListener('pointerleave',onPointerLeave);
      scene.traverse(object=>{
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach(material=>material.dispose());
        else object.material?.dispose();
      });
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}

async function mountScene(canvas) {
  if (canvas.dataset.threeMounted) return;
  canvas.dataset.threeMounted = 'loading';
  try {
    const THREE = await import(THREE_URL);
    if (!canvas.isConnected) return;
    const instance = makeScene(THREE,canvas);
    canvas.dataset.threeMounted = 'ready';
    canvas.parentElement.dataset.threeReady = 'true';
    activeScene = {canvas,instance};
    const inView = new IntersectionObserver(([entry])=>{
      if (!canvas.isConnected) return;
      if (entry.isIntersecting && !document.hidden) instance.start();
      else instance.pause();
    });
    // Keep the loop local to this mounted hero; pause it when the page is hidden or off-screen.
    activeScene.observer = inView;
    inView.observe(canvas);
    if (!prefersReducedMotion && !document.hidden) instance.start();
    else instance.render();
  } catch (error) {
    canvas.dataset.threeMounted = 'unavailable';
    canvas.parentElement.dataset.threeReady = 'fallback';
    console.info('La escena 3D no está disponible; se conserva el esquema estático.', error);
  }
}

function scanScenes() {
  if (activeScene && !activeScene.canvas.isConnected) {
    activeScene.observer?.disconnect();
    activeScene.instance.dispose();
    activeScene = null;
  }
  document.querySelectorAll('[data-three-scene="home"]').forEach(mountScene);
}

const pageObserver = new MutationObserver(scanScenes);
const startScenes = () => {
  const page = document.querySelector('#page-content');
  if (page) pageObserver.observe(page,{childList:true,subtree:true});
  scanScenes();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',startScenes,{once:true});
else startScenes();
document.addEventListener('visibilitychange',()=>{
  if (!activeScene) return;
  if (document.hidden) activeScene.instance.pause();
  else activeScene.instance.start();
});
