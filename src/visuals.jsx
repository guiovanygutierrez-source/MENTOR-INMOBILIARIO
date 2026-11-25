import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line, ScrollControls, useScroll as useCanvasScroll } from '@react-three/drei';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';
import './visuals.css';

const PAGE_SCENES = {
  inicio: { title: 'Barrio en perspectiva', kind: 'architecture' },
  ruta: { title: 'Tu progreso por niveles', kind: 'levels' },
  herramientas: { title: 'Capital · deuda · interés', kind: 'finance' },
  glosario: { title: 'Conceptos que se conectan', kind: 'nodes' },
  mentor: { title: 'Mentor · núcleo interactivo', kind: 'core' },
  leccion: { title: 'Un concepto a la vez', kind: 'lesson' },
  diagnostico: { title: 'Encuentra tu punto de partida', kind: 'levels' },
};

const FINANCE_DEFAULTS = { price: 280_000_000, down: 56_000_000, rate: 12.5 };

function readNumber(selector, decimal = false) {
  const value = document.querySelector(selector)?.value ?? '';
  if (decimal) return Number(String(value).replace(',', '.')) || 0;
  return Number(String(value).replace(/\D/g, '')) || 0;
}

function readSceneState() {
  const steps = [...document.querySelectorAll('.route-step, .learning-path-step')];
  const recordedProgress = document.querySelector('.studio-meta')?.textContent?.match(/(\d+)\s+de\s+10/);
  const stepProgress = steps.filter((step) => step.classList.contains('is-complete')).length;
  const complete = steps.length >= 10 ? stepProgress : Math.max(stepProgress, Number(recordedProgress?.[1]) || 0);
  const current = steps.findIndex((step) => step.classList.contains('is-current'));
  const tool = document.querySelector('.tool-tab.active')?.dataset.tool || location.hash.split('/')[1] || 'compra';
  let finance;
  if (tool === 'creditos') {
    const principal = readNumber('#loan-amount') || 220_000_000;
    const rate = readNumber('#loan-rate', true) || FINANCE_DEFAULTS.rate;
    const years = readNumber('#loan-term', true) || 20;
    finance = { values: [principal, rate, years], scales: [500_000_000, 20, 40], labels: ['Monto (COP)', 'Tasa EA (%)', 'Plazo (años)'], title: 'Crédito · monto · tasa EA · plazo' };
  } else if (tool === 'propiedades') {
    const price = readNumber('#prop-price') || FINANCE_DEFAULTS.price;
    const area = readNumber('#prop-area', true) || 62;
    const monthly = readNumber('#prop-admin') || 0;
    finance = { values: [price, area, monthly * 12], scales: [600_000_000, 150, 12_000_000], labels: ['Precio (COP)', 'Área (m²)', 'Admin. anual (COP)'], title: 'Propiedad · precio · área · costos (escala normalizada)' };
  } else if (tool === 'inversion') {
    const price = readNumber('#inv-price') || 300_000_000;
    const capital = readNumber('#inv-initial') || 90_000_000;
    const rent = readNumber('#inv-rent') || 2_200_000;
    const costs = readNumber('#inv-costs') || 350_000;
    const vacantMonths = readNumber('#inv-vacancy', true);
    const debt = readNumber('#inv-mortgage') || 0;
    const annualNet = Math.max(rent * (12 - vacantMonths) - costs * 12, 0);
    finance = { values: [capital, annualNet, debt * 12], scales: [price, price, price], labels: ['Capital propio', 'Ingreso neto anual', 'Cuota de deuda anual'], title: 'Inversión · capital · ingreso neto · deuda' };
  } else {
    const price = readNumber('#buy-price') || FINANCE_DEFAULTS.price;
    const down = readNumber('#buy-down') || FINANCE_DEFAULTS.down;
    const rate = readNumber('#buy-rate', true) || FINANCE_DEFAULTS.rate;
    const loan = Math.max(price - down, 0);
    const annualInterest = loan * rate / 100;
    finance = { values: [down, loan, annualInterest], scales: [price, price, price], labels: ['Capital propio', 'Deuda estimada', 'Interés anual estimado'], title: 'Compra · capital propio · deuda · interés anual estimado' };
  }
  const mentorButton = document.querySelector('#mentor-form button[type="submit"]');
  const mentorInput = document.querySelector('#mentor-input');

  return {
    completed: complete,
    current: current < 0 ? complete : current,
    finance,
    mentor: mentorButton?.disabled ? 'thinking' : mentorInput?.value?.trim() ? 'writing' : 'idle',
    lesson: Number(location.hash.match(/^#leccion\/(\d+)/)?.[1]) || 1,
  };
}

function WireBuilding({ position, size, color = '#4bddea', opacity = 0.72 }) {
  const [width, height, depth] = size;
  const points = [
    [-width / 2, 0, -depth / 2], [width / 2, 0, -depth / 2],
    [width / 2, height, -depth / 2], [width / 2, height, depth / 2],
    [-width / 2, height, depth / 2], [-width / 2, height, -depth / 2],
  ];
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={size} />
        <meshPhysicalMaterial color="#164464" transparent opacity={0.38} roughness={0.42} metalness={0.28} />
      </mesh>
      <Line points={points} color={color} transparent opacity={opacity} lineWidth={1.15} />
    </group>
  );
}

function CityModel({ group }) {
  const buildings = useMemo(() => [
    { position: [-0.95, -0.54, 0.05], size: [0.82, 1.16, 0.82], color: '#57dce9' },
    { position: [0.08, -0.54, -0.42], size: [0.78, 1.7, 0.78], color: '#43b6d0' },
    { position: [0.92, -0.54, 0.12], size: [0.72, 0.94, 0.72], color: '#4c9dbb' },
    { position: [-0.32, -0.54, 0.75], size: [0.66, 0.82, 0.66], color: '#3e829f' },
  ], []);
  return (
    <group ref={group}>
      {buildings.map((building, index) => <WireBuilding key={index} {...building} />)}
      <Line points={[[-1.65, -0.57, -0.95], [1.6, -0.57, -0.95], [1.6, -0.57, 1.45], [-1.65, -0.57, 1.45], [-1.65, -0.57, -0.95]]} color="#477e9c" transparent opacity={0.6} />
      <mesh position={[-0.04, -0.47, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial color="#52e4ef" />
      </mesh>
    </group>
  );
}

function RouteModel({ group, state }) {
  const floors = useMemo(() => Array.from({ length: 10 }, (_, index) => index), []);
  return (
    <group ref={group}>
      {floors.map((floor) => {
        const active = floor === state.current;
        const complete = floor < state.completed;
        const y = (floor - 4.5) * 0.39;
        const color = complete ? '#42d6bd' : active ? '#52e7f0' : '#31516d';
        const opacity = complete || active ? 0.9 : 0.48;
        return (
          <group key={floor} position={[0, y, 0]}>
            <mesh position={[0, -0.055, 0]}>
              <boxGeometry args={[1.35, 0.07, 1.15]} />
              <meshStandardMaterial color={active ? '#164a5b' : complete ? '#155346' : '#122238'} emissive={color} emissiveIntensity={active ? 0.28 : complete ? 0.16 : 0.025} transparent opacity={0.88} />
            </mesh>
            <Line points={[[-0.675, 0, -0.575], [0.675, 0, -0.575], [0.675, 0, 0.575], [-0.675, 0, 0.575], [-0.675, 0, -0.575]]} color={color} transparent opacity={opacity} lineWidth={active ? 1.7 : 1} />
            {[-0.48, 0.48].map((x) => [-0.39, 0.39].map((z) => (
              <mesh key={`${x}:${z}`} position={[x, 0.17, z]}>
                <boxGeometry args={[0.055, 0.34, 0.055]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.5 : 0.14} />
              </mesh>
            )))}
          </group>
        );
      })}
      <mesh position={[0, -1.95, 0]}>
        <cylinderGeometry args={[0.95, 1.08, 0.12, 6]} />
        <meshStandardMaterial color="#17344c" metalness={0.35} roughness={0.5} />
      </mesh>
    </group>
  );
}

function FinanceModel({ group, bars, labels }) {
  const definitions = [
    { label: labels[0] || 'Capital propio', color: '#48d9e8' },
    { label: labels[1] || 'Deuda', color: '#4d92bf' },
    { label: labels[2] || 'Interés estimado', color: '#e7b761' },
  ];
  return (
    <group ref={group}>
      <Line points={[[-1.55, 0, 0], [1.55, 0, 0]]} color="#6384a0" transparent opacity={0.7} />
      {definitions.map((item, index) => (
        <group key={item.label}>
          <mesh ref={(node) => { bars.current[index] = node; }} position={[(index - 1) * 1.05, 0.45, 0]}>
            <boxGeometry args={[0.56, 0.9, 0.56]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.18} metalness={0.34} roughness={0.38} />
          </mesh>
          <Line points={[[((index - 1) * 1.05) - 0.29, 0, 0.29], [((index - 1) * 1.05) + 0.29, 0, 0.29]]} color={item.color} transparent opacity={0.8} />
          <Html position={[(index - 1) * 1.05, -0.2, 0.38]} center distanceFactor={5}>
            <span className="scene-label scene-finance-label">{item.label}</span>
          </Html>
        </group>
      ))}
    </group>
  );
}

const glossaryPositions = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return [Math.cos(angle) * 1.35, Math.sin(angle) * 0.84, Math.sin(angle * 2) * 0.25];
});
const glossaryLinks = [[0, 1], [0, 3], [0, 5], [1, 2], [1, 6], [2, 4], [2, 7], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]];
const glossaryTerms = [
  { index: 0, label: 'Avalúo' },
  { index: 2, label: 'Hipoteca' },
  { index: 4, label: 'Fiducia' },
  { index: 6, label: 'Tradición' },
];

function GlossaryModel({ group }) {
  return (
    <group ref={group}>
      {glossaryLinks.map(([a, b], index) => <Line key={index} points={[glossaryPositions[a], glossaryPositions[b]]} color="#368da9" transparent opacity={0.56} lineWidth={1} />)}
      <mesh>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color="#1d667d" emissive="#00cce0" emissiveIntensity={0.32} wireframe />
      </mesh>
      {glossaryPositions.map((position, index) => (
        <mesh key={index} position={position}>
          <icosahedronGeometry args={[index % 3 === 0 ? 0.17 : 0.125, 1]} />
          <meshStandardMaterial color={index % 3 === 0 ? '#64eaf1' : '#4aacc3'} emissive="#12768b" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {glossaryTerms.map(({ index, label }) => (
        <Html key={label} position={glossaryPositions[index]} center distanceFactor={5}>
          <span className="scene-label scene-glossary-label">{label}</span>
        </Html>
      ))}
    </group>
  );
}

function MentorModel({ group, core, reduced }) {
  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.76, 2]} />
        <meshStandardMaterial color="#3fe2ed" wireframe emissive="#00a9c4" emissiveIntensity={0.72} />
      </mesh>
      <mesh rotation={[0.55, 0.15, 0]}>
        <torusGeometry args={[1.04, 0.012, 8, 96]} />
        <meshBasicMaterial color="#72dce9" transparent opacity={0.68} />
      </mesh>
      <mesh rotation={[-0.72, 0.45, 0.32]}>
        <torusGeometry args={[1.18, 0.008, 8, 96]} />
        <meshBasicMaterial color="#3983a5" transparent opacity={0.58} />
      </mesh>
      {!reduced && <mesh position={[0, 0, -0.03]}>
        <sphereGeometry args={[1.35, 24, 24]} />
        <meshBasicMaterial color="#18cfe1" wireframe transparent opacity={0.045} />
      </mesh>}
    </group>
  );
}

function subscribeSceneState(callback) {
  window.addEventListener('mentor3dstate', callback);
  return () => window.removeEventListener('mentor3dstate', callback);
}

class SceneBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch() {
    this.props.host.removeAttribute('data-ready');
    const drawing = this.props.host.closest('.studio-hero-drawing');
    drawing?.removeAttribute('data-three-ready');
    document.body.classList.remove('r3f-home-ready');
  }

  render() { return this.state.failed ? null : this.props.children; }
}

function SceneContent({ scene, ready, reduced, barsRef, state }) {
  const group = useRef();
  const core = useRef();
  const scroll = useCanvasScroll();
  const readySignal = useRef(false);

  useFrame((_, delta) => {
    const globalScroll = window.__mentorScrollProgress || 0;
    const sceneScroll = Math.max(globalScroll, scroll.offset || 0);
    if (group.current) {
      const pointer = window.__mentorPointer || [0, 0];
      const scrollTurn = reduced ? 0 : sceneScroll * 0.34;
      const pointerTurn = reduced ? 0 : pointer[0] * 0.16;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointerTurn + scrollTurn, 2.2, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, reduced ? 0 : -pointer[1] * 0.08 + sceneScroll * 0.06, 2, delta);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, reduced ? 0 : Math.sin(sceneScroll * Math.PI * 2) * 0.13, 2.1, delta);
    }

    if (scene.kind === 'finance') {
      const { values = [56_000_000, 224_000_000, 28_000_000], scales = [FINANCE_DEFAULTS.price, FINANCE_DEFAULTS.price, FINANCE_DEFAULTS.price] } = state.finance || {};
      const heights = values.map((value, index) => 0.32 + THREE.MathUtils.clamp(value / Math.max(scales[index] || 1, 1), 0, 1) * 1.72);
      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const height = heights[index] || 0.32;
        bar.scale.y = THREE.MathUtils.damp(bar.scale.y, height / 0.9, 4.5, delta);
        bar.position.y = height / 2;
      });
    }

    if (scene.kind === 'core' && core.current) {
      const thinking = state.mentor === 'thinking';
      const writing = state.mentor === 'writing';
      const pulse = reduced ? 1 : 1 + Math.sin(performance.now() * (thinking ? 0.006 : writing ? 0.003 : 0.0014)) * (thinking ? 0.13 : writing ? 0.055 : 0.025);
      core.current.scale.setScalar(pulse);
      const material = core.current.material;
      material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, thinking ? 1.25 : writing ? 0.9 : 0.72, 3.5, delta);
      group.current.rotation.y += delta * (thinking ? 0.48 : writing ? 0.24 : reduced ? 0 : 0.08);
    }

    if (!readySignal.current) {
      readySignal.current = true;
      ready();
    }
  });

  if (scene.kind === 'finance') return <FinanceModel group={group} bars={barsRef} labels={state.finance?.labels || []} />;
  if (scene.kind === 'levels') return <RouteModel group={group} state={state} />;
  if (scene.kind === 'nodes') return <GlossaryModel group={group} />;
  if (scene.kind === 'core') return <MentorModel group={group} core={core} reduced={reduced} />;
  if (scene.kind === 'lesson') {
    const lesson = state.lesson || 1;
    return <group ref={group}><WireBuilding position={[0, -0.7, 0]} size={[1.35, 0.72 + (lesson % 5) * 0.16, 1.05]} color="#56dfeb" /><Line points={[[-1.2, -0.72, 0.65], [1.2, -0.72, 0.65]]} color="#387fa0" transparent opacity={0.8} /></group>;
  }
  return <CityModel group={group} />;
}

function Experience({ scene, host }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const captionY = useTransform(scrollYProgress, [0, 1], [0, -9]);
  const [active, setActive] = useState(!document.hidden);
  const barsRef = useRef([]);
  const sceneState = useSyncExternalStore(subscribeSceneState, () => window.__mentorSceneState, () => window.__mentorSceneState);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    window.__mentorScrollProgress = progress;
  });

  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden && Boolean(host.isConnected));
    document.addEventListener('visibilitychange', onVisibility);
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting && !document.hidden), { threshold: 0.02 });
    observer.observe(host);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
    };
  }, [host]);

  const markReady = useCallback(() => {
    host.dataset.ready = 'true';
    const drawing = host.closest('.studio-hero-drawing');
    if (drawing) {
      drawing.dataset.threeReady = 'true';
      document.body.classList.add('r3f-home-ready');
    }
    document.body.classList.add('r3f-active');
  }, [host]);

  const caption = scene.kind === 'finance' ? sceneState.finance?.title : scene.title;
  return (
    <div className="experience-layer" aria-hidden="true">
      {scene.kind !== 'architecture' && (
        <motion.span className="experience-caption" style={{ y: reduced ? 0 : captionY }} key={scene.kind} initial={{ opacity: 0, y: reduced ? 0 : 5 }} animate={{ opacity: 0.92, y: 0 }} transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {caption}
        </motion.span>
      )}
      <SceneBoundary host={host}>
        <Canvas camera={{ position: scene.kind === 'levels' ? [4.2, 3.3, 6.3] : [3.8, 2.6, 5.8], fov: 38 }} dpr={[1, 1.4]} frameloop={active && !reduced ? 'always' : 'demand'} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
          <ambientLight intensity={1.15} />
          <directionalLight position={[3, 5, 4]} intensity={2} color="#c1f4ff" />
          <pointLight position={[-3, 2, 1]} intensity={10} color="#00cfe5" distance={9} />
          <ScrollControls pages={1} damping={0.28}>
            <Suspense fallback={null}>
              <SceneContent scene={scene} ready={markReady} reduced={Boolean(reduced)} barsRef={barsRef} state={sceneState} />
            </Suspense>
          </ScrollControls>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}

function pageKey() {
  const hash = location.hash.slice(1) || 'inicio';
  if (hash.startsWith('leccion/')) return 'leccion';
  if (hash.startsWith('herramientas')) return 'herramientas';
  if (/^(section-\d+|lesson-quiz)$/.test(hash) && document.body.dataset.view === 'leccion') return 'leccion';
  return PAGE_SCENES[hash] ? hash : 'inicio';
}

function positionCanvas(host, key) {
  const target = key === 'inicio'
    ? document.querySelector('.studio-hero-drawing')
    : key === 'ruta'
      ? document.querySelector('.route-explorer-heading')
      : document.querySelector('.page-heading');
  const shouldDock = Boolean(target);
  const parent = shouldDock ? target : document.body;
  if (host.parentElement !== parent) parent.appendChild(host);
  document.body.classList.toggle('experience-inset', Boolean(shouldDock));
  document.querySelectorAll('.experience-anchor').forEach((element) => element.classList.remove('experience-anchor'));
  if (shouldDock && key !== 'inicio') target.classList.add('experience-anchor');
}

function mount() {
  const host = document.getElementById('experience-root');
  if (!host) return;

  window.__mentorScrollProgress = 0;
  window.__mentorPointer = [0, 0];
  window.__mentorSceneState = readSceneState();
  const root = createRoot(host);
  let frame = 0;

  const syncState = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      window.__mentorSceneState = readSceneState();
      window.dispatchEvent(new Event('mentor3dstate'));
    });
  };
  const onPointer = (event) => {
    window.__mentorPointer = [event.clientX / Math.max(window.innerWidth, 1) * 2 - 1, 1 - event.clientY / Math.max(window.innerHeight, 1) * 2];
  };
  let currentKey = '';
  const renderPage = () => {
    const key = pageKey();
    document.body.dataset.view = key;
    positionCanvas(host, key);
    if (key !== currentKey) {
      host.removeAttribute('data-ready');
      if (key === 'inicio') {
        document.body.classList.remove('r3f-home-ready');
        document.querySelector('.studio-hero-drawing')?.removeAttribute('data-three-ready');
      }
      currentKey = key;
      root.render(<Experience key={key} scene={PAGE_SCENES[key]} host={host} />);
    }
    syncState();
  };

  document.addEventListener('input', syncState, { passive: true });
  document.addEventListener('click', syncState, { passive: true });
  document.addEventListener('submit', syncState, true);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', renderPage, { passive: true });
  window.addEventListener('hashchange', renderPage);
  const content = document.getElementById('page-content');
  const mutations = new MutationObserver(syncState);
  if (content) mutations.observe(content, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'disabled'] });
  renderPage();

  window.addEventListener('pagehide', () => {
    mutations.disconnect();
    root.unmount();
    document.removeEventListener('input', syncState);
    document.removeEventListener('click', syncState);
    document.removeEventListener('submit', syncState, true);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', renderPage);
    window.removeEventListener('hashchange', renderPage);
  }, { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
