/* Videos de aprendizaje por módulo. Los MP4 locales se excluyen de Git; en Vercel
   el reproductor usa el respaldo público de Supabase Storage. */
const LESSON_VIDEOS = {
  1: [{ title: 'Entender el mundo inmobiliario', duration: '5:57', file: '01-sector-inmobiliario.mp4' }],
  2: [{ title: 'Cómo leer un mercado local', duration: '4:38', file: '02-mercado-inmobiliario.mp4' }],
  3: [{ title: '¿Cuánto puedes destinar a vivienda?', duration: '5:21', file: '03-finanzas-vivienda.mp4' }],
  4: [{ title: 'VIS, VIP, nueva, usada y sobre planos', duration: '4:56', file: '04-vivienda-colombia.mp4' }],
  5: [{ title: 'Verifica un subsidio antes de contarlo', duration: '4:37', file: '05-guia-subsidios.mp4' }],
  6: [{ title: 'De la búsqueda a la entrega', duration: '6:43', file: '06-compra-inmuebles.mp4' }],
  7: [
    { title: 'Documentos que conviene verificar', duration: '4:49', file: '07-seguridad-legal.mp4' },
    { title: 'Cómo verificar una vivienda antes de comprar', file: '07b-verificar-vivienda.mp4', label: 'VIDEO COMPLEMENTARIO' },
  ],
  8: [{ title: 'Evalúa una inversión más allá del canon', duration: '9:36', file: '08-inversion-inmobiliaria.mp4' }],
  9: [{ title: 'Negocia con evidencia y cautela', duration: '7:46', file: '09-negociacion-analisis.mp4' }],
  10: [{ title: 'Tu plan de compra informado', duration: '6:35', file: '10-expediente-definitivo.mp4' }],
};

const LESSON_VIDEO_REMOTE_BASE = 'https://vjlnbhikfnmdiewxguro.supabase.co/storage/v1/object/public/mentor-videos';

function lessonVideoCard(moduleId) {
  const videos = LESSON_VIDEOS[moduleId];
  if (!videos?.length) return '';
  const help = 'Reproduce esta cápsula aquí y luego continúa con la lectura, el caso práctico y la evaluación.';
  return videos.map((video, index) => {
    const localUrl = `/videos/${video.file}`;
    const remoteUrl = `${LESSON_VIDEO_REMOTE_BASE}/${video.file}`;
    const isLocalApp = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const sourceUrl = isLocalApp ? localUrl : remoteUrl;
    const label = video.label || (index ? 'AMPLÍA EL TEMA' : 'APRENDE EN VIDEO');
    return `<section class="lesson-video-card" aria-label="${esc(label)}: ${esc(video.title)}">
      <div class="lesson-video-copy"><div class="lesson-video-meta"><span>${esc(label)}</span>${video.duration ? `<span>Duración ${esc(video.duration)}</span>` : ''}</div>
        <h2>${esc(video.title)}</h2><p>${esc(help)}</p>
        <video class="lesson-video-player" controls playsinline preload="metadata" aria-label="${esc(video.title)}" src="${esc(sourceUrl)}" type="video/mp4">
          Tu navegador no puede reproducir este video. Actualiza el navegador para continuar.
        </video>
      </div>
    </section>`;
  }).join('');
}
