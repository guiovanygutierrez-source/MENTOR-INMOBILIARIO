/* Funciones de apoyo para navegación, diagnóstico y estudio guiado. */
const DIAGNOSTIC_QUESTIONS = [
  { module: 3, prompt: '¿Qué debería incluir tu presupuesto antes de estimar una cuota?', options: ['Solo el precio publicado.', 'Ingresos netos, gastos, deudas, costos de compra y una reserva.', 'El máximo que una entidad podría prestarte.'] , answer: 1 },
  { module: 2, prompt: '¿Qué hace más justa una comparación de precios?', options: ['Comparar el mismo barrio, tipo de área y características similares.', 'Usar el estrato como indicador de valor.', 'Tomar el precio más alto como referencia.'], answer: 0 },
  { module: 7, prompt: '¿Qué demuestra un Certificado de Tradición y Libertad?', options: ['Las inscripciones registrales del inmueble identificado; no reemplaza una revisión completa.', 'Que el inmueble está en buen estado físico.', 'Que la compra no tiene riesgos.'], answer: 0 },
  { module: 5, prompt: '¿Cuándo cuentas una ayuda de vivienda como recurso disponible?', options: ['Cuando el vendedor dice que probablemente te la asignen.', 'Cuando envías la postulación.', 'Cuando el operador confirma la asignación y su aplicación al caso.'], answer: 2 },
  { module: 8, prompt: '¿Qué falta para pasar de rentabilidad bruta a una estimación más realista?', options: ['Vacancia, gastos operativos, costos y financiación según la medida.', 'Un precio publicado más alto.', 'Suponer valorización futura.'], answer: 0 },
];

function diagnosticPage() {
  const diagnostic = state.diagnostic;
  const answers = diagnostic?.answers || [];
  const recommendations = (diagnostic?.weakModules?.length ? diagnostic.weakModules : [nextModule().id])
    .map(id => MODULES[id - 1]).filter(Boolean);
  const result = diagnostic ? `<section class="diagnostic-result panel"><p class="eyebrow">TU RESULTADO</p><h2>${diagnostic.score === 5 ? 'Tienes una base sólida para empezar.' : 'Este es tu punto de partida.'}</h2><p>Respondiste correctamente ${diagnostic.score} de 5 preguntas. Este diagnóstico es orientativo: puedes repasar cualquier tema cuando quieras.</p><div class="diagnostic-recommendations"><strong>Te recomendamos empezar por</strong>${recommendations.map(m => `<a href="#leccion/${m.id}">Módulo ${m.id}: ${esc(m.title)} →</a>`).join('')}</div></section>` : '';
  return `${pageHeading('ORIENTACIÓN PERSONAL','Diagnóstico de aprendizaje','Cinco preguntas para identificar qué temas te conviene estudiar primero. No afecta tu progreso ni tus datos guardados.')}${result}<form id="diagnostic-form" class="diagnostic-form panel">${DIAGNOSTIC_QUESTIONS.map((q, qi) => `<fieldset class="quiz-question"><legend><span>Pregunta ${qi + 1} de 5 · Módulo ${q.module}</span>${esc(q.prompt)}</legend>${q.options.map((option, oi) => `<label class="quiz-option"><input type="radio" name="diagnostic-${qi}" value="${oi}" ${Number(answers[qi]) === oi ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button class="button button-primary" type="submit">${diagnostic ? 'Actualizar mi diagnóstico' : 'Ver mi recomendación'} →</button></form>${sourceFooter()}`;
}

function submitDiagnostic(form) {
  const data = new FormData(form);
  const answers = DIAGNOSTIC_QUESTIONS.map((_, i) => data.get(`diagnostic-${i}`));
  if (answers.some(answer => answer === null)) { toast('Responde las cinco preguntas para ver tu recomendación.'); return; }
  const normalized = answers.map(Number);
  const weakModules = DIAGNOSTIC_QUESTIONS.filter((q, i) => normalized[i] !== q.answer).map(q => q.module);
  state.diagnostic = { answers: normalized, score: DIAGNOSTIC_QUESTIONS.length - weakModules.length, weakModules, completedAt: new Date().toISOString() };
  persist(); render(); toast('Diagnóstico actualizado.');
}

function toggleBookmark(id) {
  state.bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks : [];
  const exists = state.bookmarks.includes(id);
  state.bookmarks = exists ? state.bookmarks.filter(item => item !== id) : [...state.bookmarks, id].sort((a, b) => a - b);
  persist(); render(); toast(exists ? 'Lección quitada de guardados.' : 'Lección guardada para repasar.');
}

function savedLessonsPanel() {
  const lessons = (state.bookmarks || []).map(id => MODULES[id - 1]).filter(Boolean);
  return `<section class="saved-lessons panel"><div class="section-head"><h2>Lecciones guardadas</h2><span class="text-link">${lessons.length} guardadas</span></div>${lessons.length ? `<div class="saved-lesson-list">${lessons.map(m => `<a href="#leccion/${m.id}"><span>${m.icon}</span><strong>Módulo ${m.id} · ${esc(m.title)}</strong><span>Repasar →</span></a>`).join('')}</div>` : `<p>Guarda una lección con el marcador para volver a ella cuando quieras.</p><a class="source-link" href="#ruta">Explorar la ruta →</a>`}</section>`;
}

function dashboardGuidePanel() {
  const diagnostic = state.diagnostic;
  return `<section class="dashboard-guide panel"><div><p class="eyebrow">EMPIEZA A TU RITMO</p><h2>Tu siguiente paso, claro y sencillo</h2><p>Haz un diagnóstico breve, estudia un módulo y practica con un caso. Tu avance queda guardado en este navegador.</p></div><div class="guide-actions"><a class="button button-primary" href="#diagnostico">${diagnostic ? 'Revisar mi diagnóstico' : 'Encontrar mi punto de partida'} →</a><a class="source-link" href="#ruta">Ver los 10 módulos</a></div>${diagnostic ? `<p class="guide-status">Último diagnóstico: ${diagnostic.score}/5 respuestas correctas. <a href="#diagnostico">Ver recomendaciones</a></p>` : '<p class="guide-status">Puedes usar un nombre o cifras de ejemplo; no necesitas compartir información personal.</p>'}</section>`;
}

function learningPathPreview() {
  const next = nextModule();
  const start = Math.max(0, Math.min(next.id - 2, MODULES.length - 4));
  const modules = MODULES.slice(start, start + 4);
  return `<section class="learning-path-preview" aria-labelledby="learning-path-title"><div class="learning-path-heading"><div><p class="eyebrow">TU RUTA, PASO A PASO</p><h2 id="learning-path-title">Avanza a tu ritmo</h2><p>Selecciona un módulo disponible para seguir. Los demás se irán abriendo al completar cada lección.</p></div><a class="text-link" href="#ruta">Ver los 10 módulos →</a></div><div class="learning-path-steps" aria-label="Vista previa interactiva de tu ruta">${modules.map(module => {
    const done = state.completed.includes(module.id);
    const locked = !done && !isUnlocked(module.id);
    const current = module.id === next.id && !done;
    const status = done ? 'Completado' : current ? 'Siguiente paso' : locked ? 'Se abre después' : 'Disponible';
    const href = locked ? '#ruta' : `#leccion/${module.id}`;
    return `<a class="learning-path-step ${done ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}" href="${href}" ${current ? 'aria-current="step"' : ''} aria-label="Módulo ${String(module.id).padStart(2,'0')}: ${esc(module.title)}. ${status}${locked ? ', completa el anterior para abrirlo' : ''}"><span class="learning-path-number">${done ? '✓' : String(module.id).padStart(2,'0')}</span><span class="learning-path-copy"><strong>${esc(module.title)}</strong><small>${status} · ${module.duration}</small></span><span class="learning-path-arrow" aria-hidden="true">${locked ? '⌑' : '→'}</span></a>`;
  }).join('')}</div><p class="learning-path-diagnostic">¿Quieres personalizar lo que sigue? <a href="#diagnostico">Revisa tu punto de partida →</a></p></section>`;
}

function routeReviewSuggestions() {
  const suggestions = new Map();
  const add = (moduleId, source, detail) => {
    const module = MODULES[moduleId - 1];
    if (!module || !detail) return;
    if (!suggestions.has(moduleId)) suggestions.set(moduleId, { module, details: [] });
    const entry = suggestions.get(moduleId);
    const value = `${source}: ${detail}`;
    if (!entry.details.includes(value)) entry.details.push(value);
  };

  const diagnostic = state.diagnostic;
  if (diagnostic && Array.isArray(diagnostic.answers)) {
    DIAGNOSTIC_QUESTIONS.forEach((question, index) => {
      const answer = diagnostic.answers[index];
      if (answer !== null && answer !== undefined && Number.isInteger(Number(answer)) && Number(answer) !== question.answer) {
        add(question.module, 'Diagnóstico', question.prompt);
      }
    });
  } else if (diagnostic?.weakModules?.length) {
    diagnostic.weakModules.forEach(moduleId => {
      const question = DIAGNOSTIC_QUESTIONS.find(item => item.module === Number(moduleId));
      add(Number(moduleId), 'Diagnóstico', question?.prompt || 'Repasar este tema del diagnóstico.');
    });
  }

  MODULES.forEach(module => {
    const attempt = state.attempts?.[module.id];
    const questions = [
      { prompt: module.lesson.question, answer: module.lesson.answer },
      ...(LESSON_EXTRAS[module.id]?.questions || []),
    ];
    if (Array.isArray(attempt?.answers)) {
      attempt.answers.forEach((answer, index) => {
        const question = questions[index];
        if (question && Number(answer) !== question.answer) {
          add(module.id, 'Evaluación', question.prompt);
        }
      });
    } else if (attempt?.correct === false) {
      add(module.id, 'Evaluación', module.lesson.question);
    } else if (Number.isFinite(Number(state.scores?.[module.id])) && Number(state.scores[module.id]) < 100) {
      add(module.id, 'Resultado guardado', `Mejor resultado: ${state.scores[module.id]}%.`);
    }
  });

  return [...suggestions.values()].slice(0, 4);
}

function routeReviewPanel() {
  const suggestions = routeReviewSuggestions();
  const hasEvidence = Boolean(state.diagnostic || Object.keys(state.attempts || {}).length || Object.keys(state.scores || {}).length);
  return `<section class="route-review panel" aria-labelledby="route-review-title"><div class="route-review-heading"><div><h2 id="route-review-title">Temas que puedes repasar</h2><p>Basado en tus respuestas guardadas; es una guía de estudio, no una medición completa de dominio.</p></div><a class="source-link" href="#diagnostico">${state.diagnostic ? 'Ver diagnóstico' : 'Hacer diagnóstico'} →</a></div>${suggestions.length ? `<ul class="route-review-list">${suggestions.map(({ module, details }) => `<li><div><strong>Módulo ${String(module.id).padStart(2, '0')} · ${esc(module.title)}</strong><p>${details.map(esc).join(' · ')}</p></div><button class="route-review-open" type="button" data-route-preview="${module.id}" aria-controls="route-module-${module.id}">Ver módulo</button></li>`).join('')}</ul>` : `<p class="route-review-empty">${hasEvidence ? '¡Buen avance! No aparecen respuestas incorrectas registradas para repasar.' : 'Cuando completes el diagnóstico o una evaluación, aquí aparecerán sugerencias basadas en tus respuestas.'}</p>`}</section>`;
}

function routeModuleDetails(module) {
  const complete = state.completed.includes(module.id);
  const locked = !complete && !isUnlocked(module.id);
  const outcomes = LESSON_EXTRAS[module.id]?.outcomes || [];
  const prerequisite = module.id === 1
    ? 'No necesitas completar otro módulo.'
    : locked
      ? `Para empezar, completa el módulo ${String(module.id - 1).padStart(2, '0')} · ${MODULES[module.id - 2].title}.`
      : `Requisito cubierto: completaste el módulo anterior.`;
  return `<div class="route-module-detail"><div class="route-detail-meta"><span>${esc(module.duration)}</span><span>${complete ? `Mejor resultado: ${state.scores[module.id] ?? 0}%` : locked ? 'Vista previa disponible' : 'Listo para empezar'}</span></div><h3>${esc(module.title)}</h3><p>${esc(module.description)}</p><div class="route-outcomes"><h4>Al terminar podrás</h4><ul>${outcomes.slice(0, 3).map(outcome => `<li>${esc(outcome)}</li>`).join('')}</ul></div><p class="route-prerequisite">${esc(prerequisite)}</p>${locked ? `<button class="button button-primary" type="button" disabled>Completa el módulo anterior</button>` : `<a class="button button-primary" href="#leccion/${module.id}">${complete ? 'Repasar módulo' : 'Empezar módulo'}</a>`}</div>`;
}

function createLearningBackup() {
  const profile = state.profile;
  return {
    format: 1,
    product: 'Mentor Inmobiliario Colombia',
    exportedAt: new Date().toISOString(),
    profile: profile ? { name: profile.name, objective: profile.objective, horizon: profile.horizon, level: profile.level } : null,
    progress: {
      completed: state.completed,
      scores: state.scores,
      attempts: state.attempts,
      lessonHistory: state.lessonHistory,
      achievements: state.achievements,
    },
    bookmarks: state.bookmarks || [],
    diagnostic: state.diagnostic || null,
    caseNotes: state.caseNotes || {},
  };
}

function validateLearningBackup(data) {
  const fail = message => { throw new Error(message); };
  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const validId = id => Number.isInteger(id) && id >= 1 && id <= 10;
  const validIds = value => Array.isArray(value) && value.every(validId) && new Set(value).size === value.length;
  if (!isRecord(data) || data.product !== 'Mentor Inmobiliario Colombia') fail('El archivo no corresponde a un respaldo de Mentor Inmobiliario.');
  if (data.format !== undefined && data.format !== 1) fail('La versión del respaldo no es compatible con esta app.');
  if (data.profile !== null && data.profile !== undefined && !isRecord(data.profile)) fail('El perfil del respaldo no tiene un formato válido.');
  const profile = data.profile ? {
    name: typeof data.profile.name === 'string' ? data.profile.name.trim().slice(0, 60) : '',
    objective: ['vivir', 'invertir', 'explorar'].includes(data.profile.objective) ? data.profile.objective : 'explorar',
    horizon: ['aprendiendo', '12', '24', '36'].includes(String(data.profile.horizon)) ? String(data.profile.horizon) : 'aprendiendo',
    level: ['principiante', 'intermedio', 'avanzado'].includes(data.profile.level) ? data.profile.level : 'principiante',
  } : null;
  const progress = data.progress;
  if (!isRecord(progress) || !validIds(progress.completed || [])) fail('El avance de módulos está incompleto o contiene identificadores inválidos.');
  const completed = [...(progress.completed || [])].sort((a, b) => a - b);
  const scores = progress.scores || {};
  if (!isRecord(scores) || Object.entries(scores).some(([id, value]) => !validId(Number(id)) || !Number.isFinite(value) || value < 0 || value > 100)) fail('Las calificaciones del respaldo no son válidas.');
  const attempts = progress.attempts || {};
  if (!isRecord(attempts) || Object.entries(attempts).some(([id, value]) => {
    if (!validId(Number(id)) || !isRecord(value)) return true;
    const answers = value.answers;
    return !Array.isArray(answers) || answers.length !== 2 || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 2)
      || !Number.isInteger(value.count) || value.count < 1
      || (value.correctCount !== undefined && (!Number.isInteger(value.correctCount) || value.correctCount < 0 || value.correctCount > 2));
  })) fail('Los intentos de evaluación del respaldo no son válidos.');
  const lessonHistory = progress.lessonHistory || [];
  if (!Array.isArray(lessonHistory) || lessonHistory.length > 5000 || lessonHistory.some(item => !isRecord(item) || !validId(item.id) || typeof item.correct !== 'boolean' || typeof item.at !== 'string' || Number.isNaN(Date.parse(item.at)))) fail('El historial de evaluaciones del respaldo no es válido.');
  const achievements = progress.achievements || [];
  if (!Array.isArray(achievements) || achievements.some(item => typeof item !== 'string' || !['primer-paso', 'mitad-ruta', 'ruta-completa'].includes(item) && !/^perfecto-(?:[1-9]|10)$/.test(item))) fail('Los reconocimientos del respaldo no son válidos.');
  const bookmarks = data.bookmarks || [];
  if (!validIds(bookmarks)) fail('Los marcadores del respaldo no son válidos.');
  let diagnostic = data.diagnostic || null;
  if (diagnostic !== null) {
    if (!isRecord(diagnostic) || !Array.isArray(diagnostic.answers) || diagnostic.answers.length !== 5 || diagnostic.answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 2)
      || !Number.isInteger(diagnostic.score) || diagnostic.score < 0 || diagnostic.score > 5 || !validIds(diagnostic.weakModules || [])
      || typeof diagnostic.completedAt !== 'string' || Number.isNaN(Date.parse(diagnostic.completedAt))) fail('El diagnóstico del respaldo no es válido.');
    diagnostic = { answers: [...diagnostic.answers], score: diagnostic.score, weakModules: [...(diagnostic.weakModules || [])], completedAt: diagnostic.completedAt };
  }
  const caseNotes = data.caseNotes || {};
  if (!isRecord(caseNotes) || Object.entries(caseNotes).some(([id, note]) => !validId(Number(id)) || typeof note !== 'string' || note.length > 10000)) fail('Las notas del respaldo no son válidas.');
  return {
    profile,
    completed,
    scores: { ...scores },
    attempts: JSON.parse(JSON.stringify(attempts)),
    lessonHistory: JSON.parse(JSON.stringify(lessonHistory)),
    achievements: [...new Set(achievements)],
    bookmarks: [...bookmarks].sort((a, b) => a - b),
    diagnostic,
    caseNotes: { ...caseNotes },
  };
}

function restoreLearningBackup(data) {
  const restored = validateLearningBackup(data);
  if (state.profile && restored.profile) {
    restored.profile.income = state.profile.income ?? null;
    restored.profile.savings = state.profile.savings ?? null;
  } else if (state.profile && !restored.profile) {
    restored.profile = state.profile;
  }
  Object.assign(state, restored);
  persist();
  return true;
}

async function importLearningBackupFile(file) {
  if (!file) return;
  if (file.size > 1_000_000) { toast('El respaldo supera el límite de 1 MB.'); return; }
  let backup;
  try { backup = JSON.parse(await file.text()); }
  catch { toast('No pude leer el archivo. Selecciona un respaldo JSON válido.'); return; }
  try { validateLearningBackup(backup); }
  catch (error) { toast(error.message || 'El respaldo no es válido.'); return; }
  if (!window.confirm('Restaurar reemplazará el perfil básico, avance, evaluaciones, marcadores, diagnóstico y notas actuales. Conserva los ingresos y ahorros ya guardados, los datos de simuladores y la conversación del mentor. ¿Deseas continuar?')) return;
  try {
    restoreLearningBackup(backup);
    render();
    toast('Respaldo restaurado en este dispositivo.');
  } catch (error) {
    toast(error.message || 'No pude restaurar este respaldo.');
  }
}

function exportLearningData() {
  const exportData = createLearningBackup();
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `mi-aprendizaje-inmobiliario-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  toast('Descargué tu progreso y tus notas en este dispositivo.');
}

function globalSearchResults(query) {
  const q = query.trim().toLocaleLowerCase('es');
  if (!q) return '';
  const matches = [];
  for (const module of MODULES) if (`${module.title} ${module.description} ${module.lesson.title}`.toLocaleLowerCase('es').includes(q)) matches.push({ href: `#leccion/${module.id}`, type: `Módulo ${module.id}`, title: module.title });
  for (const term of TERMS) if (`${term[0]} ${term[1]} ${term[2]}`.toLocaleLowerCase('es').includes(q)) matches.push({ href: '#glosario', type: term[1], title: term[0] });
  for (const [href, title, words] of [['#herramientas','Simuladores','simulador crédito compra inversión arriendo'],['#diagnostico','Diagnóstico','nivel empezar recomendación']]) if (`${title} ${words}`.toLocaleLowerCase('es').includes(q)) matches.push({ href, type: 'Recurso', title });
  return `<div class="search-results" role="listbox">${matches.slice(0, 7).map(item => `<a role="option" href="${item.href}"><span>${esc(item.type)}</span><strong>${esc(item.title)}</strong><b>→</b></a>`).join('') || '<p>No encontré coincidencias. Prueba con “crédito”, “VIS” o “presupuesto”.</p>'}</div>`;
}

function toolQuickGuide(tool) {
  const guides = {
    compra: ['Ingresa tus cifras mensuales netas y gastos reales.', 'Ajusta cuota inicial, plazo y tasa según una oferta concreta.', 'Compara el escenario con tus costos de cierre y reserva.'],
    creditos: ['Registra ofertas escritas con la misma modalidad y plazo.', 'Incluye tasa, seguro y sistema de amortización cuando los conozcas.', 'Compara el total estimado y confirma todo con cada entidad.'],
    propiedades: ['Agrega al menos dos inmuebles del mismo tipo de área.', 'Anota ubicación, administración y diferencias verificables.', 'Usa precio por m² como referencia, no como avalúo.'],
    inversion: ['Estima un canon mensual sustentado en comparables.', 'Incluye vacancia y costos operativos con prudencia.', 'Revisa flujo antes y después de deuda; no es rentabilidad garantizada.'],
  };
  return `<details class="tool-help"><summary>Guía rápida: cómo usar esta herramienta</summary><ol>${guides[tool].map(step => `<li>${esc(step)}</li>`).join('')}</ol></details>`;
}

function propertyComparisonVisual() {
  if (!state.properties || state.properties.length < 2) return '';
  const rows = state.properties.map(item => ({ name: item.name, value: MentorCore.pricePerArea(item.price, item.area) }));
  const max = Math.max(...rows.map(row => row.value), 1);
  return `<figure class="comparison-visual"><figcaption>Comparación visual de precio por m² <small>Usa la misma clase de área y revisa características similares.</small></figcaption>${rows.map(row => `<div class="comparison-bar-row"><span>${esc(row.name)}</span><div><i style="width:${Math.max(4, row.value / max * 100)}%"></i></div><strong>${money(row.value)} / m²</strong></div>`).join('')}</figure>`;
}
