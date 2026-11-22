const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Supabase Auth y progreso remoto quedan protegidos por RLS', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const app = fs.readFileSync('app.js', 'utf8');
  const auth = fs.readFileSync('supabase-auth.js', 'utf8');
  const sql = fs.readFileSync('supabase-schema.sql', 'utf8');
  const server = fs.readFileSync('mentor_server.py', 'utf8');
  const ignore = fs.readFileSync('.gitignore', 'utf8');
  assert.match(html, /id="auth-form"/);
  assert.match(html, /id="sign-out-button"/);
  assert.match(html, /supabase-js@2/);
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /auth\.signUp/);
  assert.match(auth, /emailRedirectTo: `\$\{window\.location\.origin\}\/`/);
  assert.match(auth, /auth\.signOut/);
  assert.match(auth, /user_learning_progress/);
  assert.match(app, /function learningPayload/);
  assert.match(app, /MentorAuth\.queueSave/);
  assert.doesNotMatch(app, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(sql, /enable row level security/i);
  assert.equal((sql.match(/create policy /gi) || []).length, 4);
  assert.equal((sql.match(/\(select auth\.uid\(\)\) = user_id/g) || []).length, 5);
  assert.match(server, /\/api\/supabase-config/);
  assert.match(server, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(server, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(server, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(fs.readFileSync('.env.example', 'utf8'), /NEXT_PUBLIC_SUPABASE_URL=https:\/\/vjlnbhikfnmdiewxguro\.supabase\.co/);
  assert.match(ignore, /^\.env$/m);
  assert.match(ignore, /^!\.env\.example$/m);
});

test('la aplicación incluye los diez módulos educativos y sus elementos pedagógicos', () => {
  const app = fs.readFileSync('mentor-engine.js', 'utf8') + '\n' + fs.readFileSync('app.js', 'utf8');
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('styles.css', 'utf8') + fs.readFileSync('premium.css', 'utf8');
  const server = fs.readFileSync('mentor_server.py', 'utf8');
  const extendedContent = fs.readFileSync('lecciones-ampliadas.js', 'utf8');
  const ids = [...app.matchAll(/\{id:(\d+),title:/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, [1,2,3,4,5,6,7,8,9,10]);
  for (const label of ['sections:', 'example:', 'concepts:', 'case:', 'question:', 'options:', 'answer:', 'feedback:']) assert.ok(app.includes(label), `falta ${label}`);
  for (const page of ['ruta', 'herramientas', 'glosario', 'mentor']) assert.ok(html.includes(`data-page="${page}"`));
  assert.ok(html.indexOf('core.js') < html.indexOf('app.js'));
  assert.ok(html.indexOf('lecciones-ampliadas.js') < html.indexOf('app.js'));
  assert.match(extendedContent, /LESSON_EXTRAS/);
  assert.match(html, /<html lang="es">/);
  assert.match(html, /name="viewport"/);
  assert.ok(html.includes('premium.css'));
  assert.match(html, /id="mobile-menu"[^>]*aria-expanded="false"[^>]*aria-controls="sidebar"/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.field-grid\s*\{\s*grid-template-columns:1fr; gap:11px/);
  assert.match(css, /\.field input,\.field select,\.mentor-case-fields \.field input,\.modal \.field input,\.modal select,#mentor-analysis-type\s*\{\s*min-height:44px; font-size:16px/);
  assert.match(app, /neighborhood-illustration/, 'la portada debe incluir la escena isométrica local');
  assert.match(css, /\.hero-art \.neighborhood-illustration\s*\{[^}]*animation/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[^}]*neighborhood-illustration\s*\{\s*animation:none/);
  assert.match(css, /@media\(max-width:360px\)[^{]*\{[^}]*backup-actions/);
  assert.match(css, /\.backup-note\s*\{/);
  assert.ok(!/sk-[A-Za-z0-9]{20,}/.test(app + html));
  assert.match(server, /"type": "web_search",\s*"filters": \{"allowed_domains": \["gov\.co"\]\},\s*"search_context_size": "medium"[\s\S]*?"tool_choice": "required"/, 'la opción de IA debe buscar en dominios oficiales y exigir la consulta web');
  assert.match(app, /id=\"mentor-key-form\"/);
  assert.match(server, /\"\/api\/configure\"/);
});

test('renderiza dashboard, protege módulos bloqueados y desbloquea el siguiente al aprobar', async () => {
  const elements = new Map();
  const el = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', textContent: '', innerHTML: '', open: false,
      classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} }, style: {}, setAttribute(){},
      addEventListener(){}, showModal(){ this.open = true; }, close(){ this.open = false; },
      scrollIntoView(){}, scrollTo(){}, focus(){},
    });
    return elements.get(selector);
  };
  const store = new Map();
  const listeners = {};
  const context = {
    document: { querySelector: el, getElementById: el, querySelectorAll: () => [], addEventListener: (name, fn) => { listeners[name] = fn; } },
    __scrollCalls: [], window: { addEventListener(){}, scrollTo(...args){ context.__scrollCalls.push(args); } }, location: { hash: '' },
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    FormData: class { get(name){ const index = Number(name.slice(name.lastIndexOf('-') + 1)); return context.__quizAnswers?.[index] ?? context.__quizAnswer ?? null; } }, __quizAnswer: '99',
    setTimeout: () => 1, clearTimeout(){}, console, Intl, Date, JSON, Math, Number, String, Array,
    structuredClone, MentorCore: require('../core.js'),
  };
  vm.createContext(context);
  const source = fs.readFileSync('lecciones-ampliadas.js', 'utf8') + '\n' + fs.readFileSync('features.js', 'utf8') + '\n' + fs.readFileSync('mentor-engine.js', 'utf8') + '\n' + fs.readFileSync('app.js', 'utf8') + '\n;globalThis.__spec={render,routePage,lessonPage,mentorReply,sendMentorQuestion,mentorContainsSensitiveData,getMentorResponse:()=>latestMentorResponse,analyzeMentorScenario:(type,input)=>MentorAssistant.analyzeScenario(type,input),glossaryPage,mentorPage,renderActiveTool,personalizedPlan,loanTable,propertyTable,achievementsPanel,activityPanel,number,parseCOP,formatCOPExample,field,buyScenarioSuggestion,getState:()=>state,setHash:x=>location.hash=x,setTool:x=>activeTool=x,modules:MODULES,extras:LESSON_EXTRAS,createLearningBackup,validateLearningBackup,restoreLearningBackup};';
  vm.runInContext(source, context);
  const api = context.__spec;
  assert.match(el('#page-content').innerHTML, /Tu ruta de aprendizaje/);
  const routeMarkup = api.routePage();
  assert.match(routeMarkup, /Módulo 10/);
  assert.match(routeMarkup, /data-export-learning/);
  assert.match(routeMarkup, /data-import-learning/);
  assert.match(routeMarkup, /learning-backup-file/);
  assert.match(routeMarkup, /notas libres/);
  assert.match(api.mentorPage(), /La app no comprueba automáticamente/);
  assert.equal(api.modules.length, 10);
  for (const module of api.modules) {
    assert.ok(module.lesson.summary, `falta resumen específico en ${module.title}`);
    assert.notEqual(module.lesson.summary, module.lesson.lead, `el resumen repite la introducción en ${module.title}`);
    assert.equal(module.lesson.sections.length, 3, `secciones incompletas en ${module.title}`);
    assert.equal(module.lesson.options.length, 3, `opciones incompletas en ${module.title}`);
    assert.ok(Number.isInteger(module.lesson.answer) && module.lesson.answer >= 0 && module.lesson.answer < module.lesson.options.length, `respuesta inválida en ${module.title}`);
    assert.equal(api.extras[module.id].sections.length, 2, `faltan temas ampliados en ${module.title}`);
    assert.equal(api.extras[module.id].outcomes.length, 3, `faltan objetivos de aprendizaje en ${module.title}`);
    assert.equal(api.extras[module.id].questions.length, 1, `falta la segunda pregunta en ${module.title}`);
    assert.ok(api.extras[module.id].visual.alt, `falta texto alternativo en la ilustración de ${module.title}`);
    assert.equal(api.extras[module.id].visual.stages.length, 3, `diagrama incompleto en ${module.title}`);
    for (const question of api.extras[module.id].questions) assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `respuesta ampliada inválida en ${module.title}`);
  }
  assert.match(api.lessonPage(2), /Bloqueado|Módulo bloqueado/);
  assert.equal(api.parseCOP('280.000.000'), 280_000_000);
  assert.equal(api.parseCOP('2.800.000,00'), 2_800_000);
  assert.equal(api.formatCOPExample('Ej. 300000000'), 'Ej. 300.000.000');
  el('buy-price').value = '280.000.000';
  assert.equal(api.number('buy-price'), 280_000_000, 'el separador de miles no debe cambiar el cálculo');
  assert.match(api.field('buy-price', 'Precio', '280000000'), /type="text"[^>]+data-format="cop"/);
  assert.match(api.buyScenarioSuggestion({gap:5_000_000,monthly:2_000_000,income:8_000_000,expenses:3_000_000}), /VIS o VIP/);
  assert.match(api.buyScenarioSuggestion({gap:0,monthly:6_000_000,income:8_000_000,expenses:3_000_000}), /supera/);
  for (let id = 1; id <= 10; id++) {
    api.getState().completed = Array.from({length: id - 1}, (_, i) => i + 1);
    const page = api.lessonPage(id);
    assert.ok(page.includes(api.modules[id - 1].lesson.title), `no se renderizó el módulo ${id}`);
    for (const section of ['Ejemplo en Colombia', 'Caso práctico', 'Comprueba lo aprendido', 'Resumen de la lección']) assert.ok(page.includes(section), `falta ${section} en el módulo ${id}`);
    assert.ok(page.includes('id="section-0"'));
    assert.equal((page.match(/class="lesson-block" id="section-/g) || []).length, 5, `la lección ${id} no muestra sus cinco temas`);
    assert.match(page, /role="img" aria-label=/);
    assert.match(page, /Pregunta 2 de 2/);
  }
  api.getState().completed = [];
  api.getState().profile = {name: 'Ana', objective: 'invertir', horizon: '12', level: 'intermedio'};
  assert.match(api.personalizedPlan(), /Analizar una inversión inmobiliaria/);
  assert.match(api.personalizedPlan(), /menos de 1 año/);
  api.getState().profile = null;
  for (const tool of ['compra', 'creditos', 'propiedades', 'inversion']) {
    api.setTool(tool);
    assert.ok(api.renderActiveTool().includes('data-calculate'), `la herramienta ${tool} no expone una acción`);
  }
  api.getState().loans = [{id:1,name:'Oferta ejemplo',amount:100000000,years:10,rate:10,monthly:1320000}];
  assert.match(api.loanTable(), /Total pagado/);
  assert.match(api.loanTable(), /Interés aprox/);
  api.getState().properties = [{id:1,name:'Apartamento A',location:'Bogotá',features:'Balcón y parqueadero',price:300000000,area:60,admin:250000,type:'Usada'}];
  assert.match(api.propertyTable(), /Balcón y parqueadero/);
  api.getState().achievements = ['primer-paso'];
  assert.match(api.achievementsPanel(), /Primer paso/);
  api.getState().lessonHistory = [{id:1,at:'2026-11-11T12:00:00.000Z',correct:true}];
  assert.match(api.activityPanel(), /Evaluación aprobada/);
  assert.match(api.glossaryPage(), /Glosario inmobiliario/);
  assert.match(api.mentorPage(), /IA opcional por consulta; no se activa automáticamente/i);
  assert.match(api.mentorPage(), /id="mentor-ai-status"/);
  assert.match(api.mentorPage(), /id="mentor-ai-optin" type="checkbox" disabled/);
  assert.match(api.mentorPage(), /mensajes previos pueden mencionar datos o preferencias/);
  api.getState().chat = [{role:'mentor',text:'Respuesta de prueba.',mode:'ia'}];
  assert.match(api.mentorPage(), /Respuesta de IA · sin fuentes web/);
  assert.match(api.mentorPage(), /id="mentor-web-search"/);
  assert.equal((api.mentorPage().match(/id="mentor-web-search"/g) || []).length, 1, 'el mentor debe mostrar una sola casilla de búsqueda web');
  api.getState().chat = [{role:'mentor',text:'Respuesta de prueba.',mode:'ia',links:[{title:'Minvivienda',url:'https://minvivienda.gov.co/'}]}];
  assert.match(api.mentorPage(), /Respuesta de IA · con fuentes web/);
  api.getState().chat = [{role:'mentor',text:'Respuesta de prueba.',mode:'local'}];
  assert.match(api.mentorPage(), /Respuesta del motor local/);
  api.getState().chat = [];
  api.getState().profile = {objective:'invertir',level:'principiante'};
  assert.match(api.mentorReply('¿Qué podría estar pasando por alto antes de comprar?'), /intentar encontrar qué podría hacer fallar tu plan/i);
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Me conviene comprar esta vivienda?'), /Según tu perfil guardado, buscas invertir/i);
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Qué es mejor, comprar o arrendar?'), /No existe una respuesta universal/);
  assert.equal(api.mentorContainsSensitiveData('Mi cédula es 1234567890'), true);
  assert.equal(api.mentorContainsSensitiveData('Mi número de cuenta: 123456789012'), true);
  assert.equal(api.mentorContainsSensitiveData('Mi correo es amiga@example.com'), true);
  assert.equal(api.mentorContainsSensitiveData('¿Qué significa CC 1?'), false);
  assert.equal(api.mentorContainsSensitiveData('El precio es 300000000 COP y la tasa 12,5%'), false);
  const investmentReview = api.analyzeMentorScenario('inversion', {price:300000000,monthlyRent:2200000,vacantMonths:1,monthlyOperatingCosts:450000,monthlyDebtPayment:1200000,investedCapital:100000000}).text;
  assert.match(investmentReview, /Rendimiento anual de caja sobre el capital propio ingresado:/);
  assert.match(investmentReview, /no incluye valorización, amortización de capital ni precio de reventa/);
  const zeroCapitalReview = api.analyzeMentorScenario('inversion', {price:300000000,monthlyRent:2200000,vacantMonths:1,monthlyOperatingCosts:450000,monthlyDebtPayment:1200000,investedCapital:0}).text;
  assert.match(zeroCapitalReview, /no calculable porque el capital ingresado es cero/);
  api.getState().completed = [];
  context.__quizAnswer = '1';
  vm.runInContext('submitQuiz({dataset:{module:"1"}})', context);
  assert.deepEqual(Array.from(api.getState().completed), []);
  context.__quizAnswer = '0';
  vm.runInContext('submitQuiz({dataset:{module:"1"}})', context);
  assert.deepEqual(Array.from(api.getState().completed), [1]);
  api.setHash('#leccion/2');
  api.render();
  assert.match(el('#page-content').innerHTML, /Leer un mercado inmobiliario local/);
  const lessonMarkup = el('#page-content').innerHTML;
  api.setHash('#section-0');
  api.render();
  assert.equal(el('#page-content').innerHTML, lessonMarkup, 'los enlaces internos deben conservar la lección');
  api.setHash('#leccion/2');
  api.render();
  assert.match(api.mentorReply('¿Qué debo revisar antes de comprar vivienda usada?'), /certificado de tradición/i);
  assert.doesNotMatch(api.mentorReply('¿Qué debería revisar antes de comprar vivienda usada?'), /No usaría una cifra que recuerdes de otro año para decidir si el inmueble es VIS/i, '“revisar” no debe activar por error la respuesta sobre VIS');
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Me conviene usar todos mis ahorros para la cuota inicial?'), /No usaría todos tus ahorros para cubrir la cuota inicial/i, 'debe cuestionar quedarse sin reserva');
  api.getState().chat = [];
  assert.match(api.mentorReply('El vendedor dice que debo consignar hoy o pierdo la oportunidad, ¿qué hago?'), /No consignaría ni firmaría bajo presión/i, 'debe recomendar pausar ante presión para pagar');
  api.getState().chat = [];
  assert.match(api.mentorReply('Me piden consignar un millón para separar un apartamento, ¿lo hago?'), /Pausaría cualquier pago hasta verificar por escrito/i, 'debe recomendar verificar incluso cuando no se menciona presión');
  assert.doesNotMatch(api.mentorReply('Me piden consignar un millón para separar un apartamento, ¿lo hago?'), /La SNR advierte sobre sitios fraudulentos/i, 'no debe mezclar una separación con una alerta sobre certificados falsos');
  api.getState().chat = [];
  assert.match(api.mentorReply('Quiero comprar una casa, no siento presión, ¿me conviene?'), /todavía no decidas/i, 'no debe afirmar que hay presión cuando la persona la niega');
  api.getState().chat = [];
  assert.match(api.mentorReply('Me enviaron un certificado de tradición falso, ¿qué hago?'), /portal oficial de la SNR/i, 'debe activar instrucciones específicas cuando se menciona un certificado falso');
  api.getState().chat = [];
  const nextStudy = api.mentorReply('¿Qué estudiar después?');
  assert.match(nextStudy, /módulo 2/);
  assert.match(nextStudy, /CONFIANZA Y LÍMITE\nMedia en la orientación general; baja para la vigencia/);
  api.getState().chat = [];
  assert.match(api.mentorReply('Ayúdame a entender si debería comprar esta casa'), /todavía no decidas/i, 'debe evaluar la decisión y no pedir un término genérico');
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Cómo invertir en una vivienda para rentas cortas?'), /No compraría contando con ingresos de alquiler turístico/i, 'debe reconocer el verbo “invertir” y revisar permisos de renta corta');
  assert.match(api.getMentorResponse().text, /Registro Nacional de Turismo/i);
  assert.deepEqual(Array.from(api.getMentorResponse().sources), [14, 15, 16, 17], 'la orientación sobre alquiler turístico debe enlazar a RNT, uso del suelo, guía y ley oficial');
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Qué crédito uso para comprar un apartamento y ponerlo en Airbnb?'), /No compraría contando con ingresos de alquiler turístico/i, 'el riesgo de permisos turísticos debe tener prioridad sobre la guía general de crédito');
  assert.deepEqual(Array.from(api.getMentorResponse().sources), [14, 15, 16, 17]);
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Qué tasa de crédito necesito para mi Airbnb?'), /No compraría contando con ingresos de alquiler turístico/i, 'una pregunta de financiación de Airbnb también debe revisar primero la legalidad del uso turístico');
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Debería usar todos mis ahorros para comprar una vivienda y arrendarla por Airbnb?'), /no usaría todos tus ahorros en una operación cuyos permisos/i, 'la respuesta turística también debe advertir si la operación consume la reserva de emergencia');
  api.getState().chat = [];
  assert.match(api.mentorReply('Quiero arrendar mi apartamento por 15 días'), /No ofrecería ni publicaría el inmueble como alojamiento turístico/i, 'debe orientar al propietario que ofrece alquiler corto');
  api.getState().chat = [];
  assert.match(api.mentorReply('¿Cómo puedo operar un Airbnb de forma legal?'), /No ofrecería ni publicaría el inmueble como alojamiento turístico/i, 'debe reconocer preguntas operativas y legales sobre Airbnb aunque no mencionen comprar o apartamento');
  assert.deepEqual(Array.from(api.getMentorResponse().sources), [14, 15, 16, 17]);
  api.getState().chat = [];
  assert.match(api.mentorReply('Quiero comprar una vivienda para renta vacacional'), /No compraría contando con ingresos de alquiler turístico/i);
  api.getState().chat = [];
  assert.match(api.mentorReply('Explícame qué es la UVR'), /APRENDAMOS · UVR/);
  assert.match(api.mentorReply('Explícame qué es la UVR'), /valor diario en pesos refleja las variaciones del IPC/i, 'glosario y mentor deben usar la definición común de UVR');
  assert.match(api.mentorReply('Explícame qué es la UVR'), /saldo hipotético de 10\.000 UVR/i, 'la explicación de UVR debe incluir un ejemplo que enseñe su conversión a pesos');
  assert.match(api.mentorReply('Explícame qué es la UVR'), /La UVR no es la tasa de interés/i);
  const uvrChallenge = api.getMentorResponse().challenge;
  assert.ok(uvrChallenge && uvrChallenge.options.length === 3, 'la explicación debe incluir práctica con opciones');
  api.getState().chat = [{role:'mentor', text:'PONTE A PRUEBA', challenge:uvrChallenge}];
  const chosen = String.fromCharCode(65 + uvrChallenge.answer);
  assert.match(api.mentorReply(chosen), /respuesta correcta/i);
  assert.equal(api.getMentorResponse().challengeAnswered, true);
  api.getState().chat = [];
  assert.match(api.mentorReply('Ponme a prueba con el siguiente módulo'), /PONTE A PRUEBA/);
  api.getState().completed = [1, 2, 3, 4, 5];
  context.__quizAnswers = [null, null];
  context.__quizAnswer = undefined;
  vm.runInContext('submitQuiz({dataset:{module:"6"}})', context);
  assert.ok(!api.getState().completed.includes(6), 'una evaluación sin respuestas no aprueba');
  context.__quizAnswers = [api.modules[5].lesson.answer, (api.extras[6].questions[0].answer + 1) % 3];
  vm.runInContext('submitQuiz({dataset:{module:"6"}})', context);
  assert.ok(api.getState().completed.includes(6), 'una respuesta correcta de dos permite avanzar');
  assert.equal(api.getState().scores[6], 50);
  for (let id = 1; id <= 10; id++) {
    api.getState().completed = Array.from({length: id - 1}, (_, i) => i + 1);
    context.__quizAnswers = [api.modules[id - 1].lesson.answer, api.extras[id].questions[0].answer];
    context.__quizAnswer = undefined;
    vm.runInContext(`submitQuiz({dataset:{module:"${id}"}})`, context);
    assert.ok(api.getState().completed.includes(id), `la evaluación no desbloquea el módulo ${id}`);
    assert.equal(api.getState().scores[id], 100, `la puntuación no es correcta en el módulo ${id}`);
    assert.match(api.lessonPage(id), /Volver a la pantalla principal/, `al aprobar el módulo ${id} debe aparecer una salida al inicio`);
    if (id === 4) {
      assert.match(api.lessonPage(id), /Toda VIP es VIS/);
      assert.match(api.lessonPage(id), /no garantiza un subsidio/);
    }
    if (id === 8) {
      assert.match(api.lessonPage(id), /rendimiento anual antes de gastos/i);
      assert.doesNotMatch(api.lessonPage(id), /rentabilidad bruta/i);
    }
  }
  let aiCalls = 0;
  context.fetch = async url => {
    if (url === '/api/mentor') { aiCalls++; return {ok:true,json:async()=>({text:'Respuesta con fuentes oficiales.',checkedAt:'2026-11-15T15:00:00+00:00',links:[{title:'Minvivienda',url:'https://minvivienda.gov.co/'}]})}; }
    return {ok:true,json:async()=>({aiConfigured:true})};
  };
  api.getState().chat = [];
  api.setHash('#mentor');
  await api.sendMentorQuestion('¿Qué debo verificar antes de comprar?', true);
  assert.equal(api.getState().chat.at(-1).mode, 'ia', 'la respuesta exitosa debe marcarse como IA');
  assert.equal(api.getState().chat.at(-1).checkedAt, '2026-11-15T15:00:00+00:00', 'la respuesta debe conservar la fecha de la consulta web');
  assert.match(api.mentorPage(), /IA consultada:/, 'la interfaz debe mostrar la fecha de consulta junto con la respuesta de IA');
  const callsAfterSuccess = aiCalls;
  await api.sendMentorQuestion('Mi cédula es 1234567890; ¿qué debo hacer?', true);
  assert.equal(aiCalls, callsAfterSuccess, 'una pregunta con identificador detectado no debe llegar al endpoint de IA');
  assert.match(api.getState().chat.at(-1).text, /No envié esta consulta/);
  await api.sendMentorQuestion('¿Qué otro paso me recomiendas?', true);
  assert.equal(aiCalls, callsAfterSuccess, 'el contexto sensible previo tampoco debe enviarse al endpoint de IA');
  api.getState().chat = [];
  let searchPayload;
  context.fetch = async (url, options) => {
    if (url === '/api/mentor') { searchPayload=JSON.parse(options.body); return {ok:true,json:async()=>({text:'Fuentes recuperadas.',links:[{title:'Fuente',url:'https://example.org',official:false}]})}; }
    return {ok:true,json:async()=>({aiConfigured:true})};
  };
  api.getState().chat = [{role:'user',text:'¿Cuáles son los datos recientes?'},{role:'mentor',text:'Afirmación antigua sin verificar.',mode:'ia'}];
  await api.sendMentorQuestion('Compara las ciudades hoy.', true, true);
  assert.equal(searchPayload.webSearch, true);
  assert.deepEqual(searchPayload.history.map(item=>item.role), ['user'], 'la búsqueda no debe tomar respuestas antiguas sin fuentes como contexto');
  assert.equal(api.getState().chat.at(-1).links[0].official, false);
  api.getState().chat = [];
  context.fetch = async url => {
    if (url === '/api/mentor') throw new Error('sin conexión');
    return {ok:true,json:async()=>({aiConfigured:true})};
  };
  await api.sendMentorQuestion('¿Qué debo verificar antes de comprar?', true);
  assert.equal(api.getState().chat.at(-1).mode, 'local', 'el respaldo tras error debe marcarse como motor local');
  api.getState().chat = [];
  await api.sendMentorQuestion('¿Qué cambió en el mercado este mes?', true, true);
  assert.equal(api.getState().chat.at(-1).mode, 'notice', 'un error de búsqueda debe detenerse sin inventar una respuesta local');
  context.__scrollCalls.length = 0;
  api.setHash('#herramientas');
  api.render();
  assert.equal(context.__scrollCalls.length, 1, 'el cambio de sección debe pedir un único desplazamiento');
  assert.equal(context.__scrollCalls[0][0].top, 0);
  assert.equal(context.__scrollCalls[0][0].behavior, 'instant');

  const liveState = api.getState();
  liveState.profile = {name:'Ana',objective:'invertir',horizon:'12',level:'intermedio',income:6000000,savings:40000000};
  liveState.completed = [1, 2];
  liveState.scores = {1:100};
  liveState.attempts = {1:{answers:[0,1],correct:true,correctCount:2,count:1}};
  liveState.lessonHistory = [{id:1,at:'2026-11-18T12:00:00.000Z',correct:true}];
  liveState.achievements = ['primer-paso','perfecto-1'];
  liveState.bookmarks = [1,2];
  liveState.diagnostic = {answers:[0,1,2,0,1],score:5,weakModules:[],completedAt:'2026-11-18T12:00:00.000Z'};
  liveState.caseNotes = {1:'Revisar gastos de cierre'};
  liveState.properties = [{name:'No debe exportarse'}];
  liveState.loans = [{name:'Tampoco debe exportarse'}];
  liveState.chat = [{role:'user',text:'No debe exportarse'}];
  const backup = JSON.parse(JSON.stringify(api.createLearningBackup()));
  assert.equal(backup.format, 1);
  assert.equal(backup.profile.income, undefined);
  assert.equal(backup.profile.savings, undefined);
  assert.equal(backup.properties, undefined);
  assert.equal(backup.loans, undefined);
  assert.equal(backup.chat, undefined);
  assert.deepEqual(backup.progress.completed, [1,2]);
  assert.deepEqual(backup.progress.achievements, ['primer-paso','perfecto-1']);
  assert.equal(backup.caseNotes['1'], 'Revisar gastos de cierre');

  liveState.profile = {name:'Perfil local actual',objective:'vivir',horizon:'24',level:'principiante',income:9000000,savings:70000000};
  liveState.properties = [{name:'Se conserva localmente'}];
  liveState.loans = [{name:'Se conserva el crédito local'}];
  liveState.chat = [{role:'user',text:'Se conserva el chat local'}];
  liveState.completed = [10];
  api.restoreLearningBackup(backup);
  assert.deepEqual(Array.from(liveState.completed), [1,2]);
  assert.equal(liveState.profile.name, 'Ana');
  assert.equal(liveState.profile.income, 9000000, 'la restauración conserva cifras privadas del perfil en este dispositivo');
  assert.equal(liveState.profile.savings, 70000000);
  assert.equal(liveState.properties[0].name, 'Se conserva localmente');
  assert.equal(liveState.loans[0].name, 'Se conserva el crédito local');
  assert.equal(liveState.chat[0].text, 'Se conserva el chat local');
  const invalidBackup = JSON.parse(JSON.stringify(backup));
  invalidBackup.progress.completed = [11];
  assert.throws(() => api.restoreLearningBackup(invalidBackup), /identificadores inválidos/);
  assert.deepEqual(Array.from(liveState.completed), [1,2], 'un respaldo inválido no debe modificar el progreso');
  const wrongProduct = JSON.parse(JSON.stringify(backup));
  wrongProduct.product = 'Otra aplicación';
  assert.throws(() => api.validateLearningBackup(wrongProduct), /no corresponde/);
  const wrongVersion = JSON.parse(JSON.stringify(backup));
  wrongVersion.format = 99;
  assert.throws(() => api.validateLearningBackup(wrongVersion), /versión del respaldo/);
  const excessiveNote = JSON.parse(JSON.stringify(backup));
  excessiveNote.caseNotes['1'] = 'x'.repeat(10001);
  assert.throws(() => api.validateLearningBackup(excessiveNote), /notas del respaldo/);
});

