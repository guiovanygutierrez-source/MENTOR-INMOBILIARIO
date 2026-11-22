/* Asistente local basado en reglas explícitas. No usa IA ni consulta datos en vivo. */
const MentorAssistant = (() => {
  const MENTOR_SOURCE_MAP = {
    vis: [0], credit: [9, 5], legal: [2, 3], fraud: [11, 3],
    subsidy: [6, 0], newHome: [10, 12], market: [4, 7], rent: [13], shortRent: [14, 15, 16, 17],
  };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}%$.,\s]/gu, ' ').trim().replace(/\s+/g, ' ');
  const has = (text, pattern) => pattern.test(text);

  function response({ reading, facts, steps, missing, confidence = 'Media en la orientación general; baja para la vigencia o una recomendación sobre un caso concreto sin datos verificados.', sources = [], actions = [], challenge = null, challengeAnswered = false }) {
    return {
      text: `MI LECTURA FRANCA\n${reading}\n\nQUÉ SÍ SABEMOS\n${facts}\n\nQUÉ HARÍA ANTES DE DECIDIR\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nDATO QUE FALTA\n${missing}\n\nCONFIANZA Y LÍMITE\n${confidence}`,
      sources,
      actions,
      challenge,
      challengeAnswered,
    };
  }

  function answerChoiceIndex(text) {
    const match = normalize(text).match(/^(?:(?:la\s+)?(?:opcion|respuesta)\s+|elijo\s+)?(1|2|3|primera|segundo|segunda|tercera|a|b|c)(?:\b|[).,])/);
    if (!match) return -1;
    const choice = match[1];
    return ({ '1': 0, 'primera': 0, a: 0, '2': 1, 'segundo': 1, 'segunda': 1, b: 1, '3': 2, 'tercera': 2, c: 2 })[choice] ?? -1;
  }

  function startChallenge(question, options, answer, feedback, label) {
    const letters = ['A', 'B', 'C'];
    return {
      text: `PONTE A PRUEBA · ${label}\n${question}\n${options.map((option, index) => `${letters[index]}. ${option}`).join('\n')}\n\nResponde A, B o C. Si fallas, te explicaré el error sin rodeos.`,
      sources: [], actions: [],
      challenge: { options, answer, feedback, label },
      challengeAnswered: false,
    };
  }

  function teachTerm(entry, profile) {
    const [term, category, definition] = entry;
    const concept = normalize(term);
    const module = typeof MODULES !== 'undefined'
      ? MODULES.find(item => item.lesson?.concepts?.some(name => normalize(name) === concept))
      : null;
    const lesson = module?.lesson;
    const level = profile?.level || 'principiante';
    let example;
    if (concept === 'uvr') example = 'Si un extracto muestra un saldo hipotético de 10.000 UVR, su equivalente en pesos se calcula con el valor diario de la UVR publicado por el Banco de la República. Si la UVR cambia, el equivalente en pesos también puede cambiar. La UVR no es la tasa de interés; revisa por separado la tasa, el sistema de amortización y la tabla del crédito.';
    else if (category === 'Financiero') example = 'Al comparar créditos de vivienda, anota modalidad, tasa, plazo, seguros y cargos. Una cuota baja al inicio no basta para decidir.';
    else if (category === 'Jurídico') example = 'Antes de entregar dinero por una vivienda, pide el documento aplicable y confirma por escrito quién recibe el pago, los plazos y qué pasa si la operación no sigue.';
    else if (category === 'Mercado') example = 'Al comparar anuncios de Bogotá, usa zonas y tipos de área equivalentes y anota la fecha. El precio publicado no demuestra el valor final de venta.';
    else if (category === 'Inversión') example = 'Para un inmueble en arriendo, resta vacancia, administración, reparaciones, impuestos aplicables y financiación; el canon anunciado no es ganancia neta.';
    else example = 'En una compra en Colombia, confirma la categoría y sus reglas en la fuente oficial vigente y en los documentos del inmueble; no la deduzcas solo por un anuncio.';

    const explanation = `APRENDAMOS · ${term.toLocaleUpperCase('es')}\n\nEN SENCILLO\n${definition}\n\nEJEMPLO EN COLOMBIA\n${example}\n\n${level === 'principiante' ? 'Te lo expliqué desde la base; si una palabra sigue siendo confusa, dime cuál.' : 'Idea clave: convierte la definición en algo que puedas comprobar con documentos o números.'}`;
    if (lesson?.question && Array.isArray(lesson.options) && Number.isInteger(lesson.answer)) {
      const exercise = startChallenge(lesson.question, lesson.options, lesson.answer, lesson.feedback, module.title);
      const learningSources = category === 'Jurídico' ? MENTOR_SOURCE_MAP.legal : category === 'Financiero' ? MENTOR_SOURCE_MAP.credit : category === 'Inversión' || category === 'Mercado' ? MENTOR_SOURCE_MAP.market : MENTOR_SOURCE_MAP.vis;
      return { ...exercise, text: `${explanation}\n\n${exercise.text}`, sources: learningSources, actions: [{ href: `#leccion/${module.id}`, label: `Repasar módulo ${module.id}` }] };
    }
    return {
      text: `${explanation}\n\nPRÁCTICA\nEn una decisión que tengas delante, ¿qué dato o documento verificarías antes de usar este concepto? Puedes contestar en una frase y lo revisamos.`,
      sources: category === 'Jurídico' ? MENTOR_SOURCE_MAP.legal : category === 'Financiero' ? MENTOR_SOURCE_MAP.credit : category === 'Inversión' || category === 'Mercado' ? MENTOR_SOURCE_MAP.market : MENTOR_SOURCE_MAP.vis,
      actions: [], challenge: null, challengeAnswered: false,
    };
  }

  function startProgressChallenge() {
    const next = typeof nextModule === 'function' ? nextModule() : null;
    if (!next?.lesson?.question) {
      return response({ reading: 'Aún no puedo preparar una evaluación fiable porque no está disponible la pregunta de repaso.', facts: 'No voy a improvisar una respuesta correcta para ponerte a prueba.', steps: ['Abre la ruta de aprendizaje y elige un módulo con evaluación disponible.', 'Vuelve y dime qué tema quieres repasar.'], missing: 'El módulo que quieres practicar.', confidence: 'Alta sobre el límite; baja hasta seleccionar un tema.', actions: [{ href: '#ruta', label: 'Abrir ruta de aprendizaje' }] });
    }
    const exercise = startChallenge(next.lesson.question, next.lesson.options, next.lesson.answer, next.lesson.feedback, `Módulo ${next.id}: ${next.title}`);
    exercise.actions = [{ href: `#leccion/${next.id}`, label: `Abrir módulo ${next.id}` }];
    return exercise;
  }

  function reply(question, history = [], profile = null) {
    const q = normalize(question);
    const previousQuestion = [...history].reverse().find(item => item.role === 'user')?.text || '';
    const followUp = /^(y si|y entonces|y ahora|que hago|en ese caso|pero si|y eso|por que|por que no)\b/.test(q);
    const topic = followUp ? `${normalize(previousQuestion)} ${q}` : q;
    const buying = has(topic, /compr|vivienda|apartamento|casa|inmueble|invert|invers|inmobili/);
    const urgencyCue = has(topic, /solo hoy|solo por hoy|urgenc|presion|debes decidir ya|se vence hoy|oportunidad irrepetible|no hay tiempo|(?:pagar|consignar|transferir|separar|firmar|decidir).{0,20}\bhoy\b|\bhoy\b.{0,25}(?:pierdo|pierdes|pierde|perder|oportunidad)/);
    const deniesUrgency = has(topic, /(?:no|sin).{0,12}(?:presion|urgencia)|nadie.{0,15}(?:presiona|apresura)/);
    const urgentPressure = urgencyCue && !deniesUrgency;
    const moneyBeforeChecks = has(topic, /(consign|pagar|transfer|girar|abonar|separar).{0,60}(antes|sin|todavia no|aun no)|(?:antes|sin).{0,60}(consign|pagar|transfer|girar|abonar|separar)/);
    const transactionalPayment = has(topic, /(?:me piden|me exigen|me solicitan|me dicen que|debo|deberia|tengo que|me toca).{0,45}(?:consign|transfer|girar|abonar|separar|apartar|reservar)|(?:consign|transfer|girar|abonar|separar|apartar|reservar).{0,45}(?:me piden|me exigen|me solicitan|me dicen|debo|deberia|me toca)/);
    const guaranteedReturn = has(topic, /garantiz\w*.{0,30}(rentab|ganancia|valoriz|retorno)|(?:rentab|ganancia|valoriz|retorno).{0,30}garantiz\w*|sin riesgo/);
    const shortTermRental = has(topic, /renta corta|rentas cortas|turistic|airbnb|alquiler temporal|vacacion|alojamiento turist|(?:alquiler|arriendo|arrendar|rentar|renta).{0,30}(?:(?:[1-9]|1\d|2\d)\s*dias|fin de semana|por semana)|menos de 30 dias|inferior(?:es)? a 30 dias/);
    const allSavings = has(q, /todos mis ahorros|todo mi ahorro|quedarme sin|sin fondo|sin reserva|sin ahorros/);
    const asksForAgreement = has(q, /tengo razon|no crees|dime que si|cierto que|verdad que|me conviene|deberia hacerlo|debo hacerlo/);
    const credentialRequest = has(topic, /me piden.{0,30}(cedula|clave|codigo|token|contrasena)|manda.{0,20}(clave|codigo|token)/);
    const fakeCertificate = has(topic, /certificado.{0,30}(falso|fraud|estafa)/);
    const lastMentorMessage = [...history].reverse().find(item => item.role === 'mentor');
    const pendingChallenge = lastMentorMessage?.challenge;

    if (urgentPressure || moneyBeforeChecks || transactionalPayment || credentialRequest || fakeCertificate) {
      return response({
        reading: credentialRequest
          ? 'No compartas claves, códigos de un solo uso ni contraseñas. Si te piden identificación, confirma primero la entidad y el canal oficial; no la envíes por un chat o enlace que no hayas verificado.'
          : fakeCertificate
            ? 'No pagues ni uses ese certificado hasta comprobarlo directamente en el portal oficial de la SNR. Un documento que parece auténtico no basta para confirmar su origen.'
            : urgentPressure
              ? 'No consignaría ni firmaría bajo presión. La urgencia no demuestra que la oferta sea legítima; es una razón para pausar y verificar por canales independientes.'
              : 'Pausaría cualquier pago hasta verificar por escrito quién recibe el dinero, qué cubre y cuáles son las condiciones de devolución. Un pago de separación no prueba por sí solo que el inmueble o la oferta sean legítimos.',
        facts: fakeCertificate
          ? 'La SNR advierte sobre sitios fraudulentos que ofrecen certificados. No puedo autenticar el documento ni confirmar a quién pertenece el inmueble desde este chat.'
          : credentialRequest
            ? 'No puedo confirmar quién te contactó ni verificar una solicitud de identificación desde este chat. Que te pidan un dato no demuestra fraude, pero nunca compartas contraseñas o códigos de autenticación.'
            : 'No puedo confirmar quién te contactó, validar una propiedad o cuenta, ni autenticar documentos desde este chat. La solicitud de pago, el mensaje o la urgencia no demuestran fraude por sí solos; verifica los datos por un canal independiente antes de enviar dinero o información.',
        steps: [
          ...(credentialRequest ? ['No envíes contraseñas, códigos, tokens ni claves. Verifica cualquier solicitud de identificación por un canal oficial que busques tú misma.'] : []),
          ...(fakeCertificate ? ['Obtén el Certificado de Tradición y Libertad desde el canal oficial de SNR y pide revisión jurídica independiente si hay anotaciones o dudas.'] : []),
          ...(transactionalPayment || moneyBeforeChecks ? ['Confirma identidad y facultades de quien recibe; exige concepto, valor, cuenta destinataria y reglas de devolución por escrito antes de pagar.'] : []),
          ...(urgentPressure ? ['Pide tiempo para revisar los documentos y confirma al vendedor por un medio independiente; no firmes ni transfieras mientras haya presión o datos sin verificar.'] : []),
          ...(!credentialRequest && !fakeCertificate && !transactionalPayment && !moneyBeforeChecks && !urgentPressure ? ['Describe qué te solicitan sin compartir datos privados y verifica la identidad por canales oficiales antes de responder.'] : []),
        ],
        missing: 'Qué acción o documento te solicitan, quién lo solicita y en qué etapa estás. No pegues aquí cédulas, cuentas, matrículas ni documentos: describe el caso sin identificadores.',
        confidence: 'Alta en recomendar verificación independiente y protección de claves; no puedo declarar fraudulenta a una persona u oferta sin evidencia verificable.',
        sources: fakeCertificate ? MENTOR_SOURCE_MAP.fraud : credentialRequest ? [] : MENTOR_SOURCE_MAP.legal,
      });
    }

    if (guaranteedReturn) {
      return response({
        reading: 'No: una rentabilidad o valorización inmobiliaria “garantizada” no debe aceptarse como hecho. Si el vendedor usa esa promesa para cerrar rápido, yo frenaría la decisión hasta tener documentos y supuestos verificables.',
        facts: 'Un canon proyectado, una tasa bruta o un precio futuro son estimaciones. Vacancia, mantenimiento, administración, impuestos, financiación, liquidez y cambios del mercado pueden reducir el resultado. Ninguna cifra de este chat garantiza retorno.',
        steps: ['Pide por escrito de dónde salen el canon, la ocupación y el precio futuro.', 'Calcula escenario base, uno pesimista y uno de estrés; cuenta vacancia y todos los costos.', 'No cuentes valorización futura como dinero disponible para pagar la deuda.', 'Obtén una valoración independiente y verifica la situación jurídica del inmueble.'],
        missing: 'Precio total, canon sustentado con comparables, gastos recurrentes, meses vacantes, deuda y horizonte de salida.',
        confidence: 'Alta en que una proyección no equivale a garantía; baja para estimar tu retorno sin cifras comprobables.',
        sources: [2, 4, 7],
      });
    }

    if (pendingChallenge) {
      const chosen = answerChoiceIndex(q);
      if (chosen >= 0 && chosen < pendingChallenge.options.length) {
        const correct = chosen === pendingChallenge.answer;
        return response({
          reading: correct ? 'Sí, esa es la respuesta correcta.' : `No. La opción ${String.fromCharCode(65 + chosen)} no es la correcta; la respuesta es ${String.fromCharCode(65 + pendingChallenge.answer)}.`,
          facts: pendingChallenge.feedback || 'Repasa la explicación del concepto: identificar la respuesta correcta no sustituye verificar un caso real.',
          steps: correct
            ? ['Explica con tus propias palabras por qué esa opción es correcta.', 'Si quieres, dime “ponme a prueba” para practicar el siguiente módulo disponible.']
            : ['Vuelve a leer la explicación y señala qué dato o condición distingue la respuesta correcta.', 'Si la decisión es real, comprueba la información con la fuente o el documento correspondiente.'],
          missing: correct ? 'Una explicación propia del concepto permite comprobar si quedó claro.' : 'Qué parte de la explicación te llevó a elegir esa opción.',
          confidence: 'Alta sobre la clave y retroalimentación de este ejercicio del módulo; aprobar una pregunta no prueba dominio del tema ni valida una operación real.',
          challengeAnswered: true,
          actions: [{ href: '#ruta', label: 'Ver tu ruta de aprendizaje' }],
        });
      }
    }

    const asksForLesson = /^(que es|que significa|que quiere decir|explica(me)?|define|no entiendo|diferencia entre|(?:que|cual) es la diferencia entre|que diferencia hay entre|como funciona|ensen(a|ame)|a que se refiere|para que sirve|ayudame a entender)\b/.test(q);
    const asksForAction = has(q, /me conviene|deberia|debo|que hago|necesito|voy a comprar|compro|comprar|consignar|firmar|negociar|invertir|vender|arrendar/);
    const asksForPractice = /^(evalua(me)?|ponme a prueba|hazme una pregunta|pregunta de repaso|quiero practicar|repasemos)\b/.test(q);
    const asksForStressTest = has(q, /que (?:podria|puedo) estar pasando por alto|que estoy pasando por alto|que se me escapa|que riesgo no veo|revisa mis supuestos|desafia (?:mi|mis)|pon a prueba mi plan|critica mi idea|busca los puntos debiles|no me des la razon/);
    const comparesBuyingAndRenting = has(q, /(?:que es mejor|que conviene mas|que me conviene|compara(?:r|me)?|comparacion|diferencia(?: entre| hay entre)?|(?:que|cual) es la diferencia entre).{0,70}(?:compr|arrend|alquil|rent)|(?:no se si|dudo entre|estoy entre).{0,45}(?:compr|arrend|alquil|rent).{0,35}(?:o|frente a|vs).{0,35}(?:compr|arrend|alquil|rent)|(?:compr|arrend|alquil|rent).{0,45}(?:vs|versus|frente a|en vez de).{0,45}(?:compr|arrend|alquil|rent)|(?:compr|arrend|alquil|rent).{0,45}\bo\b.{0,45}(?:compr|arrend|alquil|rent)/);
    if (asksForPractice) return startProgressChallenge();
    if (asksForStressTest) {
      return response({
        reading: 'Sí: voy a intentar encontrar qué podría hacer fallar tu plan, no a confirmarlo por cortesía. Todavía no puedo evaluar un riesgo concreto sin conocer la decisión; una promesa verbal, una proyección optimista o la aprobación de un crédito no son evidencia suficiente por sí solas.',
        facts: 'Separaré documentos y cifras confirmadas de estimaciones, expectativas y afirmaciones de terceros. Para vivienda, suelen cambiar el resultado los costos omitidos, la demora, la vacancia, una caída de ingresos y la dificultad de salir de la operación.',
        steps: ['Resume qué quieres hacer y en qué etapa estás: explorar, ofertar, firmar o ya pagaste.', 'Incluye precio, financiación y costos relevantes; marca cada cifra como confirmada o supuesta.', 'Copia las afirmaciones importantes del vendedor o entidad en tus propias palabras y di qué documento las respalda.', 'Prueba qué pasaría con menos ingresos, gastos inesperados, retrasos o una salida anticipada; no incluyas nombres, identificaciones ni documentos privados.'],
        missing: 'Tu plan concreto, qué dato te genera duda y qué evidencia independiente tienes. Puedes dar cifras aproximadas o ficticias.',
        confidence: 'Alta en el método de revisar supuestos; baja sobre tu caso hasta conocer sus datos y documentos.',
      });
    }
    if (comparesBuyingAndRenting) {
      return response({
        reading: 'No existe una respuesta universal de “comprar siempre es mejor” o “arrendar es botar la plata”. Comprar puede convenir con estabilidad, horizonte suficiente y números sostenibles; arrendar puede ser más sensato si necesitas flexibilidad, no tienes reserva o el costo total de comprar es demasiado alto.',
        facts: 'Comprar exige cuota inicial, costos de cierre, mantenimiento y gastos de propiedad; parte del pago puede amortizar deuda, pero el valor de reventa y la valorización no están garantizados. Arrendar paga por el uso y suele requerir menos capital inicial, aunque hay reajustes y no adquieres ese inmueble. La comparación cambia por ciudad, horizonte, financiación y contrato.',
        steps: ['Compara el costo total durante el tiempo que planeas quedarte, no solo cuota hipotecaria contra canon.', 'Incluye cuota inicial y su costo de oportunidad, gastos de compra y venta, intereses, seguros, administración, impuestos, reparaciones y posibles reajustes del arriendo.', 'Calcula un escenario de compra con menor ingreso o una reparación grande; no uses una valorización esperada para justificar una cuota que hoy no puedes sostener.', 'Elige la opción que preserve tu capacidad de pago y flexibilidad, no la que suene más rentable en un anuncio.'],
        missing: 'Ciudad, horizonte de permanencia, canon comparable, precio, financiación y costos de propiedad. Puedes usar cifras aproximadas.',
        confidence: 'Alta en el método de comparación; baja para recomendarte comprar o arrendar sin datos y ofertas reales.',
        sources: [...MENTOR_SOURCE_MAP.credit, ...MENTOR_SOURCE_MAP.market, 2],
        actions: [{ href: '#herramientas/compra', label: 'Simular un escenario de compra' }, { href: '#herramientas/propiedades', label: 'Comparar opciones' }],
      });
    }
    if (asksForLesson && !asksForAction) {
      const terms = typeof TERMS !== 'undefined' ? TERMS : [];
      const matchedTerm = [...terms].sort((a, b) => normalize(b[0]).length - normalize(a[0]).length).find(([name]) => {
        const term = normalize(name);
        return term.length <= 3 ? new RegExp(`(?:^|\\b)${term}(?:\\b|$)`).test(q) : q.includes(term);
      });
      if (matchedTerm) return teachTerm(matchedTerm, profile);
      const next = typeof nextModule === 'function' ? nextModule() : null;
      return response({
        reading: 'Te lo explico, pero necesito el término o tema exacto. No quiero adivinar qué concepto tienes en mente.',
        facts: next ? `Tu siguiente módulo sugerido es el ${next.id}: ${next.title}.` : 'La ruta ya está completa; podemos repasar cualquier concepto.',
        steps: ['Escribe el término que quieres entender, por ejemplo “UVR”, “estudio de títulos” o “vacancia”.', 'Si buscas una explicación general, prueba “ponme a prueba” para responder una pregunta del siguiente módulo.'],
        missing: 'El concepto concreto que quieres aprender.', confidence: 'Baja hasta identificar el tema.',
        actions: next ? [{ href: `#leccion/${next.id}`, label: `Abrir módulo ${next.id}` }] : [{ href: '#glosario', label: 'Abrir glosario' }],
      });
    }

    const financingTourism = has(topic, /credito|hipotec|tasa|financ|prestamo/) && has(topic, /airbnb|renta corta|rentas cortas|turistic|alquiler temporal|vacacion/);
    const shortTermRentalAction = has(topic, /operar|publicar|alojar|arrendar|alquilar|rentar|ofrecer|recibir|legal|permitid|requisit|anfitrion|rnt|registro nacional|propiedad horizontal|uso del suelo|puedo|debo/);
    if (shortTermRental && (has(topic, /invers|compr|vivienda|apartamento|inmueble/) || financingTourism || shortTermRentalAction)) {
      const consideringPurchase = has(topic, /compr|invert|invers/) || financingTourism;
      const reserveWarning = allSavings ? ' Además, no usaría todos tus ahorros en una operación cuyos permisos y ocupación aún no están confirmados; sin reserva, un gasto inesperado o un periodo vacío puede obligarte a endeudarte o salir de la inversión en mal momento.' : '';
      return response({
        reading: consideringPurchase
          ? `No compraría contando con ingresos de alquiler turístico hasta confirmar que esa operación está permitida para ese inmueble. En un edificio sometido a propiedad horizontal, el reglamento y la autorización para ese uso pueden cambiar por completo el plan.${reserveWarning}`
          : `No ofrecería ni publicaría el inmueble como alojamiento turístico hasta confirmar que ese uso está permitido y que tienes los registros requeridos. Si está sometido a propiedad horizontal, el reglamento y la autorización para ese uso pueden cambiar por completo el plan.${reserveWarning}`,
        facts: 'La Ley 2068 considera servicio de vivienda turística el arriendo o subarriendo por periodos inferiores a 30 días, con o sin servicios complementarios; hay que revisar si la operación concreta encaja en esa definición. MinCIT exige el Registro Nacional de Turismo antes de prestar servicios turísticos. En propiedad horizontal, la unidad debe tener autorización conforme al reglamento y el uso turístico debe estar permitido por las reglas municipales de uso del suelo. La guía de formalización también enumera seguro de responsabilidad y Tarjeta de Registro de Alojamiento; los requisitos pueden variar por categoría y deben confirmarse con MinCIT. No puedo verificar permisos de una unidad concreta desde aquí.',
        steps: ['Consulta con la alcaldía o curaduría competente si el uso turístico está permitido por el POT.', 'Revisa el reglamento de propiedad horizontal y pide confirmación escrita de la autorización para esa unidad.', 'Antes de operar, verifica el RNT activo y confirma con MinCIT la póliza de responsabilidad, el trámite vigente de la Tarjeta de Registro de Alojamiento y, si recibes extranjeros, los reportes que correspondan.', 'Calcula ingresos con noches realmente vendibles por temporada, tarifa neta de plataforma, aseo, servicios, administración, impuestos, seguros, mantenimiento y días vacíos.', 'Conserva una reserva separada para emergencias y prueba un escenario sin alquiler turístico; si la compra solo funciona con ocupación alta o autorización incierta, yo no la trataría como inversión lista para comprar.'],
        missing: 'Municipio y uso del suelo aplicable, reglamento y autorización de propiedad horizontal, estado del RNT, cobertura de seguro, trámite de registro de huéspedes, tarifa neta, ocupación sustentada por temporada y reserva que quedaría.',
        confidence: 'Alta en la necesidad de verificar el uso y el registro antes de operar; baja sobre la rentabilidad sin datos locales y autorización confirmada.',
        sources: MENTOR_SOURCE_MAP.shortRent,
        actions: [{ href: '#herramientas/inversion', label: 'Evaluar el flujo de caja' }],
      });
    }

    if (has(topic, /subsid|mi casa ya|caja de compensacion|ayuda de vivienda/)) {
      return response({
        reading: 'No cuentes el subsidio como parte de la cuota inicial hasta que la entidad confirme por escrito que te lo asignó y que es aplicable a esa compra. Postularse, cumplir un requisito aparente o recibir una promesa comercial no significa tener recursos aprobados.',
        facts: 'Convocatorias, presupuesto disponible, requisitos y compatibilidad dependen del programa y pueden cambiar. No puedo determinar tu elegibilidad con una pregunta ni asegurar que haya cupos.',
        steps: ['Identifica el programa exacto y revisa sus condiciones vigentes en Minvivienda o tu caja.', 'Confirma por escrito estado, vigencia, valor, fechas y compatibilidad con crédito u otros apoyos.', 'No pagues a intermediarios por “asegurar” una asignación.'],
        missing: 'Programa, municipio, tipo de vivienda, etapa de compra y respuesta formal de la entidad. Comparte solo datos generales.',
        confidence: 'Alta en la cautela; no puedo pronosticar convocatorias ni confirmar elegibilidad individual.',
        sources: MENTOR_SOURCE_MAP.subsidy,
      });
    }

    if (has(topic, /\b(?:vis|vip)\b|vivienda de interes/)) {
      return response({
        reading: 'No usaría una cifra que recuerdes de otro año para decidir si el inmueble es VIS o VIP. La clasificación y los topes dependen de normas y condiciones vigentes; exige que el proyecto y sus documentos sustenten la categoría.',
        facts: 'El estrato no determina por sí solo si una vivienda es VIS. Este asistente no consulta topes, convocatorias ni normas en tiempo real.',
        steps: ['Pide al vendedor identificar por escrito la categoría y el fundamento aplicable al proyecto.', 'Contrasta el valor vigente y condiciones con Minvivienda y con la documentación contractual.', 'Si la categoría afecta subsidio, precio o elegibilidad, valida el caso con la entidad que administra el programa antes de comprometerte.'],
        missing: 'Año de compra, municipio, proyecto y documento donde aparece la categoría.',
        confidence: 'Alta en que la categoría debe verificarse con reglas vigentes; no estoy determinando la clasificación de un proyecto concreto.',
        sources: MENTOR_SOURCE_MAP.vis,
      });
    }

    if (has(topic, /cuota inicial|que es la inicial|inicial de una vivienda/)) {
      return response({
        reading: allSavings
          ? 'No usaría todos tus ahorros para cubrir la cuota inicial: quedarte sin reserva te deja expuesta a una reparación, pérdida de ingresos o gasto inesperado desde el primer día. La aprobación del crédito no vuelve sostenible una compra que consume todo tu colchón.'
          : 'La cuota inicial no es “el único dinero propio que necesitas”. Es la parte del precio que no cubre el crédito u otros recursos ya confirmados; además vienen costos de compra y gastos para sostener la vivienda.',
        facts: 'El porcentaje requerido depende del inmueble, la financiación, las reglas aplicables y la política de la entidad. No hay un porcentaje universal que garantice aprobación o comodidad financiera.',
        steps: ['Calcula precio menos crédito realmente aprobado y otros recursos confirmados.', 'Cotiza por separado escrituración, registro, avalúo, estudio de títulos, gastos financieros y mudanza/reparaciones.', 'No uses toda tu reserva de emergencia para completar la inicial.', 'Si el crédito todavía no está aprobado, trata su monto como supuesto, no como dinero disponible.'],
        missing: 'Precio, recursos disponibles, estado de aprobación y costos de cierre cotizados. Puedes usar números ficticios para aprender el cálculo.',
        confidence: 'Alta para la definición general; el porcentaje y valor que aplican a una operación concreta deben confirmarse con entidad y profesionales.',
        sources: MENTOR_SOURCE_MAP.credit,
      });
    }

    if (has(topic, /sobre planos|vivienda nueva|proyecto nuevo|proyecto en planos|constructora|fiducia|precio en smmlv|precio en salarios minimos/)) {
      return response({
        reading: 'En un proyecto nuevo, no aceptaría una cotización verbal ni una proyección de sala de ventas como sustituto del contrato. Si el precio está expresado en salarios mínimos, pide aclaración formal en pesos y revisa qué valor queda pactado y cuándo.',
        facts: 'Minvivienda informó que el precio de la vivienda debe informarse y definirse en pesos colombianos conforme a la normativa aplicable. La fecha, el tipo de contrato y los documentos firmados importan; no interpretes este resumen como dictamen sobre tu contrato.',
        steps: ['Solicita precio total en COP y cronograma de pagos por escrito; compara con el documento de separación, opción, fiducia o promesa que firmarías.', 'Revisa fechas de entrega, condiciones de desistimiento, manejo de recursos, modificaciones y qué ocurre si hay retrasos.', 'Verifica constructora, proyecto y fiduciaria por canales propios.', 'No firmes ni pagues si las condiciones importantes están en blanco o no coinciden; pide revisión independiente de consumo/jurídica.'],
        missing: 'Ciudad, proyecto, etapa, cotización/documento recibido y si ya pagaste o firmaste. No compartas el contrato completo ni datos personales.',
        confidence: 'Media: la pauta de exigir claridad documental es general; los efectos legales dependen del documento, fecha y circunstancias.',
        sources: MENTOR_SOURCE_MAP.newHome,
      });
    }

    if (has(topic, /vender|venta de mi casa|vender mi inmueble|vender mi apartamento/)) {
      return response({
        reading: 'No fijaría el precio de venta con el valor sentimental, el precio del vecino o un índice general. Son referencias débiles para un inmueble concreto; empieza por comparables recientes y calcula cuánto recibirías neto, no solo el precio anunciado.',
        facts: 'El valor depende de ubicación, estado, área, características y condiciones del mercado local. El saldo de una hipoteca, impuestos y costos de cierre pueden cambiar el dinero que finalmente queda disponible.',
        steps: ['Compara ventas o inmuebles similares con el mismo tipo de área y fecha cercana; distingue precio pedido de precio cerrado.', 'Pide un avalúo independiente si el precio afecta una decisión importante.', 'Solicita al banco saldo de cancelación de gravámenes y cotiza costos e impuestos aplicables con notaría/asesor tributario.', 'Verifica identidad y capacidad de pago del comprador; no entregues posesión ni firmes condiciones que no entiendes.'],
        missing: 'Ciudad, estado y características del inmueble, saldo de deuda, horizonte de venta y si ya recibiste una oferta.',
        confidence: 'Alta en el método general; no puedo recomendar un precio ni calcular el neto sin documentos, comparables y condiciones vigentes.',
        sources: [...MENTOR_SOURCE_MAP.market, 8, 2],
      });
    }

    if (has(topic, /tradicion|titulo|embarg|gravamen|matricula inmobiliaria|certificado|promesa|escritura|notari|vendedor|vivienda usada|usada/) || has(topic, /hipoteca/) && has(topic, /gravamen|venta|cancelar|levantar|hipotecado|ctl|registro/)) {
      return response({
        reading: 'Si es una compra usada, no avanzaría solo con lo que diga el anuncio, el vendedor o un certificado aislado. Un CTL es una pieza importante de la revisión, pero no inspecciona el estado físico ni reemplaza un estudio jurídico de antecedentes y de tu operación.',
        facts: 'La SNR expide el Certificado de Tradición y Libertad del inmueble; la revisión de anotaciones debe hacerse para el folio correcto y con apoyo profesional cuando haya dudas o riesgos.',
        steps: ['Confirma identidad y facultades del vendedor.', 'Solicita un CTL reciente en el canal oficial de SNR y encarga un estudio de títulos independiente.', 'Revisa impuestos, administración y obligaciones de propiedad horizontal; verifica el estado físico con inspección.', 'Lee promesa, condiciones, plazos y consecuencias antes de entregar dinero; pide explicación profesional de cualquier cláusula que no entiendas.'],
        missing: 'Ciudad, si es nueva/usada, quién vende, qué documentos tienes y si ya firmaste o pagaste. No adjuntes escrituras ni datos personales aquí.',
        confidence: 'Alta en la lista general de debida diligencia; la interpretación de títulos y contratos requiere un profesional jurídico con los documentos completos.',
        sources: MENTOR_SOURCE_MAP.legal,
        actions: [{ href: '#ruta', label: 'Ver módulos de compra y documentos' }],
      });
    }

    if (has(topic, /credito|hipotec|tasa|uvr|cuota|leasing|banco|prestamo|presupuesto|ingresos|ahorros|capacidad de pago/)) {
      const direct = allSavings ? 'Usar todos tus ahorros y quedarte sin reserva me parece una decisión frágil, incluso si el banco aprueba el crédito.' : 'No puedo decirte que una cuota te conviene sin ver el presupuesto completo; el monto que el banco ofrece no equivale automáticamente a una cuota sostenible para tu hogar.';
      return response({
        reading: `${direct}${asksForAgreement ? ' No te daría un “sí” solo porque la cuota parezca pagable en un mes normal.' : ''}`,
        facts: 'Compara ofertas escritas con la misma modalidad, moneda (pesos o UVR), plazo y monto. Revisa tasa, sistema de amortización, seguros, costos, reglas de abonos y posibles cambios de cuota/saldo. La aprobación y condiciones las define la entidad; el simulador local es solo una aproximación.',
        steps: ['Pide a cada entidad una proyección completa del crédito y sus costos asociados.', 'Arma un presupuesto con ingreso neto estable, deudas, gastos, administración, seguros, mantenimiento y gastos de compra.', 'Prueba qué pasa si cae un ingreso, sube un gasto o el crédito en UVR cambia su saldo en pesos.', 'Conserva una reserva para emergencias; no decidas usando solo el escenario optimista.'],
        missing: 'Modalidad, tasa y plazo ofrecidos, cuota con seguros, otras deudas, costos mensuales de vivienda y reserva posterior al cierre. Puedes usar cifras aproximadas o ficticias.',
        confidence: 'Alta en los criterios de comparación; no puedo recomendarte un producto ni validar una cuota personal sin oferta y presupuesto completos.',
        sources: MENTOR_SOURCE_MAP.credit,
        actions: [{ href: '#herramientas/compra', label: 'Abrir el simulador de compra' }, { href: '#herramientas/creditos', label: 'Comparar créditos' }],
      });
    }



    if (has(topic, /invert|invers|rentab|vacancia|roi|flujo/) || has(topic, /arriendo|arrend|renta corta/) && has(topic, /invert|invers|compr/)) {
      return response({
        reading: 'No llamaría “buena inversión” a un inmueble solo porque el arriendo de 12 meses dividido por el precio dé un porcentaje atractivo. Ese rendimiento antes de gastos omite meses vacíos, costos y el riesgo de no poder vender rápido.',
        facts: 'Para comparar, estima ingresos efectivamente cobrados y descuenta vacancia, administración, reparaciones, seguros, impuestos y financiación. La valorización futura es incierta; no la sumes como si ya estuviera ganada.',
        steps: ['Valida el canon con arriendos comparables de la zona, no solo con la proyección del vendedor.', 'Calcula flujo anual antes y después de deuda, e incorpora costos iniciales y períodos sin inquilino.', 'Prueba sensibilidad con canon menor, vacancia mayor y reparación extraordinaria.', 'Compara con alternativas y considera la liquidez y el tiempo que puedes mantener la inversión.'],
        missing: 'Precio negociable, gastos de cierre, canon comprobable, administración, impuestos, mantenimiento, vacancia y condiciones de financiación.',
        confidence: 'Alta en el método; no puedo afirmar rentabilidad ni conveniencia sin evidencia local de precios, arriendos y costos.',
        sources: [4, 7, 9],
        actions: [{ href: '#herramientas/inversion', label: 'Abrir evaluación de inversión' }],
      });
    }

    if (has(topic, /metro cuadrado|precio por metro|precio|avaluo|estrato|mercado|compar/)) {
      return response({
        reading: 'No usaría el precio publicado por metro cuadrado como si fuera un avalúo. Sirve para filtrar comparables; no ajusta por estado, piso, parqueadero, área privada vs. construida, administración o precio real de cierre.',
        facts: 'Para que la comparación sea útil, alinea zona, periodo, tipo de área y características. El estrato es una clasificación para servicios públicos, no una medida de calidad, seguridad ni valorización.',
        steps: ['Reúne varias propiedades realmente comparables y confirma qué área reporta cada una.', 'Separa precio pedido de precio transado y fecha del dato.', 'Inspecciona estado y entorno; si la decisión depende del valor, contrata un avalúo independiente.', 'No extrapoles un índice nacional a un inmueble o barrio específico.'],
        missing: 'Ciudad/barrio, tipo de inmueble, área privada o construida, estado, comparables y para qué necesitas el valor.',
        confidence: 'Alta en la metodología de comparación; no puedo estimar el valor comercial de un inmueble sin inspección y datos comparables verificables.',
        sources: MENTOR_SOURCE_MAP.market,
        actions: [{ href: '#herramientas/propiedades', label: 'Comparar propiedades' }],
      });
    }

    if (has(topic, /arriendo|arrendatari|inquilin|canon|contrato de arrend/)) {
      return response({
        reading: 'No firmaría un arriendo basándome en acuerdos verbales o un anuncio. Deja por escrito quiénes son las partes, qué inmueble se entrega, valor, fechas, servicios, inventario y cómo se reportan daños o terminación.',
        facts: 'Los derechos y deberes dependen del tipo de arrendamiento y de la normativa aplicable. No voy a inventar un límite, plazo o depósito legal sin revisar el contrato y la regla actual.',
        steps: ['Verifica identidad y facultades de quien arrienda.', 'Lee el contrato completo y guarda inventario, fotos y comprobantes de entrega/pago.', 'Pide aclaración por escrito de cobros, reparaciones, reajustes, servicios y entrega.', 'Si hay cláusulas dudosas, conflicto o una suma importante, consulta orientación jurídica o autoridad competente antes de firmar.'],
        missing: '¿Eres arrendador o arrendatario? ¿Vivienda urbana o rural? ¿Es una propuesta, contrato firmado o conflicto?',
        confidence: 'Media: los pasos de documentación son generales; el efecto legal depende del contrato, el tipo de inmueble y la normativa vigente.',
        sources: MENTOR_SOURCE_MAP.rent,
      });
    }

    if (has(topic, /hola|buenas|gracias/)) {
      return response({
        reading: 'Con gusto. Si estás evaluando algo concreto, cuéntame qué quieres hacer y te daré una lectura directa, incluyendo lo que me haga dudar.',
        facts: 'Puedo orientar sobre compra, arriendo, inversión, financiación, comparación de inmuebles y verificación documental en Colombia.',
        steps: ['Dime si buscas comprar para vivir, invertir, vender o arrendar.', 'Describe el estado actual de la decisión y la fecha límite si la hay.', 'Omite identificadores y documentos privados.'],
        missing: 'Tu objetivo inmobiliario y la decisión que tienes delante.',
        confidence: 'Alta sobre los límites del asistente; aún no he evaluado un caso.',
        sources: [],
      });
    }

    if (has(topic, /siguiente|estudiar|modulo|ruta|empezar/)) {
      const next = typeof nextModule === 'function' ? nextModule() : null;
      return response({
        reading: next ? `Tu siguiente paso útil es el módulo ${next.id}: ${next.title}. No necesitas saltar etapas; completa la lección y usa su caso práctico para conectar conceptos con una situación real.` : 'Empieza por definir si buscas comprar para vivir, invertir, vender o arrendar; cada decisión necesita criterios distintos.',
        facts: 'La ruta es educativa y el progreso se guarda en este dispositivo.',
        steps: ['Abre la ruta de aprendizaje y completa el siguiente módulo disponible.', 'Anota qué decisión quieres tomar y qué información te falta.', 'Vuelve con una pregunta concreta si encuentras un supuesto dudoso.'],
        missing: 'Tu objetivo (vivir, invertir, vender o arrendar) si quieres una recomendación de ruta más ajustada.',
        sources: [],
        actions: [{ href: '#ruta', label: 'Abrir ruta de aprendizaje' }],
      });
    }


    if (buying && has(topic, /conviene|deberia|compro|comprar|oferta|negoci|decidir|comprando/)) {
      const objective = profile?.objective === 'vivir' ? 'vivir' : profile?.objective === 'invertir' ? 'invertir' : null;
      const objectiveNote = objective === 'vivir'
        ? ' Según tu perfil guardado, buscas comprar para vivir; si ese objetivo cambió, corrígeme. Miraría el costo total de habitarla y tu horizonte frente a arrendar.'
        : objective === 'invertir'
          ? ' Según tu perfil guardado, buscas invertir; si ese objetivo cambió, corrígeme. Miraría flujo neto, vacancia y salida, no solo el canon bruto o una valorización esperada.'
          : '';
      return response({
        reading: `Con la información que has dado, mi respuesta honesta es: todavía no decidas. No porque comprar sea necesariamente mala idea, sino porque no hay datos para defender un “sí”. Una decisión grande no se sustenta en la emoción, la presión del vendedor ni la aprobación del crédito por sí sola.${objectiveNote}`,
        facts: 'La conveniencia depende de precio comparable, capacidad de pago, costos de cierre y sostenimiento, horizonte de permanencia, estado físico y situación jurídica. No tengo acceso a tus documentos, mercado local ni ofertas bancarias.',
        steps: ['Calcula un presupuesto que incluya cuota, seguros, administración, impuestos, reparaciones y reserva.', 'Compara propiedades semejantes y distingue precio pedido de valor sustentado.', 'Verifica estado físico y documentos con profesionales independientes.', objective === 'invertir' ? 'Modela flujo neto, vacancia y un escenario de salida; no cuentes valorización esperada como ganancia segura.' : 'Compara compra con arriendo para tu horizonte y ciudad; no supongas que comprar siempre conviene.'],
        missing: `${objective ? 'Confirma si tu objetivo registrado sigue vigente. ' : 'Ciudad y si comprarías para vivir o invertir. '}También faltan precio, costos completos, financiación y cuánto tiempo planeas conservar el inmueble. Usa cifras aproximadas o ficticias.`,
        confidence: 'Alta en que faltan datos para recomendar una compra; no puedo determinar si este inmueble concreto te conviene.',
        sources: [...MENTOR_SOURCE_MAP.credit, ...MENTOR_SOURCE_MAP.legal],
        actions: [{ href: '#herramientas/compra', label: 'Probar un escenario en el simulador' }, { href: '#ruta', label: 'Ver la ruta de aprendizaje' }],
      });
    }

    if (!buying && !has(topic, /hola|buenas|gracias|ayuda/)) {
      return response({
        reading: 'No tengo base para responderte con rigor: esta herramienta está enfocada en vivienda y decisiones inmobiliarias en Colombia.',
        facts: 'No estoy conectado a internet ni a un modelo de IA; no puedo verificar hechos actuales a partir de tu pregunta.',
        steps: ['Reformula la pregunta indicando si trata de comprar, vender, arrendar, financiar, invertir o revisar documentos.', 'Para asuntos legales o financieros vigentes, contrastaré la orientación con una fuente oficial y marcaré lo que no puedo confirmar.'],
        missing: 'El contexto inmobiliario de tu pregunta y la decisión que intentas tomar.',
        confidence: 'Baja: todavía no identifico un tema inmobiliario concreto.',
        sources: [],
      });
    }

    return response({
      reading: 'Puedo ayudarte a analizarlo, pero no voy a adivinar ni darte la razón sin entender la situación. Empieza por la decisión concreta y el riesgo que más te preocupa.',
      facts: 'Soy un asistente educativo local basado en reglas; no consulto fuentes en vivo ni puedo autenticar documentos, personas, inmuebles u ofertas.',
      steps: ['Resume qué quieres hacer y en qué etapa estás.', 'Separa los datos confirmados de lo que te dijeron o estás suponiendo.', 'No transfieras dinero ni firmes si hay presión, documentos incompletos o condiciones que no entiendes.'],
      missing: '¿Se trata de comprar, arrendar, invertir, financiar o revisar documentos? Puedes omitir nombres y cifras exactas.',
      confidence: 'Baja hasta conocer el tema y los hechos relevantes.',
      sources: [],
    });
  }

  function analyzeScenario(type, input) {
    const cop = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
    if (!input || Object.values(input).some(value => value === '' || value === null || !Number.isFinite(Number(value)))) {
      throw new RangeError('Completa todos los campos del escenario con números válidos. Puedes usar cifras aproximadas.');
    }

    if (type === 'compra') {
      const data = {
        price: Number(input.price), savings: Number(input.savings), income: Number(input.income),
        expenses: Number(input.expenses), downPayment: Number(input.downPayment),
        termYears: Number(input.termYears), annualRatePercent: Number(input.annualRatePercent),
        closingCostPercent: Number(input.closingCostPercent),
      };
      if (data.price <= 0) throw new RangeError('El precio debe ser mayor que cero para revisar una compra.');
      if (data.income <= 0) throw new RangeError('Los ingresos mensuales deben ser mayores que cero para estimar el saldo disponible.');
      if (!Number.isInteger(data.termYears) || data.termYears < 1 || data.termYears > 40) throw new RangeError('Usa un plazo de entre 1 y 40 años completos para este escenario.');
      if ([data.price, data.savings, data.income, data.expenses, data.downPayment].some(value => value > 1e15)) throw new RangeError('Revisa las cifras en pesos: alguna supera el límite de captura del simulador.');
      if (data.annualRatePercent > 1000 || data.closingCostPercent > 100) throw new RangeError('Revisa la tasa EA y el porcentaje de costos; parecen fuera de rango.');
      const result = MentorCore.homePurchaseScenario(data);
      const remaining = data.income - data.expenses - result.installment;
      const reading = result.savingsGap > 0
        ? `No consideraría este plan listo para cerrar: bajo tus supuestos faltan ${cop(result.savingsGap)} para cuota inicial y costos estimados. Además, la cuota dejaría ${cop(remaining)} al mes después de los gastos y deudas que anotaste, antes de costos que el simulador no incluye.`
        : remaining < 0
          ? `No seguiría con esta cuota como está modelada: supera en ${cop(Math.abs(remaining))} el dinero que te queda después de los otros gastos y deudas declarados. El déficit real podría ser mayor porque faltan costos de vivienda.`
          : remaining === 0
            ? 'La suma cuadra solo al límite: la cuota consumiría todo el dinero disponible que queda tras los gastos que declaraste. Sin reserva mensual, este escenario me parece demasiado frágil.'
            : `La aritmética del escenario deja ${cop(remaining)} al mes y cubre la cuota inicial más los costos que estimaste. Eso no demuestra que sea una compra cómoda ni que un banco la apruebe: falta verificar gastos omitidos y mantener una reserva.`;
      return response({
        reading,
        facts: `Precio: ${cop(data.price)}. Ahorros disponibles: ${cop(data.savings)}. Cuota inicial: ${cop(data.downPayment)}. Ingreso neto mensual: ${cop(data.income)}; gastos y deudas actuales: ${cop(data.expenses)}. Supuestos del préstamo: tasa EA ${data.annualRatePercent}% y plazo ${data.termYears} años. Capital estimado a financiar: ${cop(result.principal)}. Cuota mensual estimada: ${cop(result.installment)}. Costos iniciales según el porcentaje supuesto: ${cop(result.closingCosts)}. Brecha de ahorro calculada: ${cop(result.savingsGap)}. Saldo mensual tras los gastos ingresados y la cuota: ${cop(remaining)}. La fórmula supone un préstamo en pesos, tasa efectiva anual constante y no incluye seguros.`,
        steps: ['Reemplaza la tasa y cuota por una oferta escrita; confirma moneda, seguros, sistema de amortización y cargos con la entidad.', 'Cotiza los costos de cierre reales: el porcentaje que ingresaste es un supuesto, no una tarifa oficial.', 'Añade administración, impuestos, servicios, mantenimiento, mudanza y reserva; vuelve a calcular con meses de ingreso reducido o gasto inesperado.', 'Si la brecha de ahorro o el saldo mensual no te convence, baja el precio, aumenta recursos sin agotar la reserva o espera. No fuerces la compra por presión comercial.'],
        missing: 'Seguros, costos de cierre cotizados, gastos de sostenimiento, estabilidad de ingresos, reserva que quedaría y aprobación formal del crédito.',
        confidence: 'Alta únicamente en la aritmética con estos valores y supuestos; no es una aprobación, avalúo ni recomendación financiera personalizada. La cuota real puede diferir.',
        sources: MENTOR_SOURCE_MAP.credit,
        actions: [{ href: '#herramientas/compra', label: 'Abrir el simulador de compra' }, { href: '#herramientas/creditos', label: 'Comparar créditos' }],
      });
    }

    if (type === 'inversion') {
      const data = {
        price: Number(input.price), monthlyRent: Number(input.monthlyRent), vacantMonths: Number(input.vacantMonths),
        monthlyOperatingCosts: Number(input.monthlyOperatingCosts), monthlyDebtPayment: Number(input.monthlyDebtPayment),
        investedCapital: Number(input.investedCapital),
      };
      if (data.price <= 0) throw new RangeError('El precio debe ser mayor que cero para comparar rendimientos.');
      if ([data.price, data.monthlyRent, data.monthlyOperatingCosts, data.monthlyDebtPayment, data.investedCapital].some(value => value > 1e15)) throw new RangeError('Revisa las cifras en pesos: alguna supera el límite de captura del simulador.');
      const result = MentorCore.investmentScenario(data);
      const reading = result.operatingNetIncome < 0
        ? `No trataría este inmueble como inversión rentable con estos supuestos: el ingreso anual tras vacancia ni siquiera cubre los gastos operativos que anotaste; antes de deuda, faltan ${cop(Math.abs(result.operatingNetIncome))} al año.`
        : result.annualCashFlow < 0
          ? `El flujo estimado queda negativo después de deuda: tendrías que aportar ${cop(Math.abs(result.annualCashFlow))} al año, además del capital inicial. No lo llamaría autofinanciado ni lo justificaría solo con valorización esperada.`
          : `El escenario deja ${cop(result.annualCashFlow)} al año después de vacancia, costos operativos y deuda que ingresaste. Es un resultado aritmético favorable bajo esos supuestos, pero no basta para concluir que conviene: puede faltar riesgo, impuestos, mantenimiento mayor o precio de salida.`;
      return response({
        reading,
        facts: `Precio: ${cop(data.price)}. Canon mensual supuesto: ${cop(data.monthlyRent)}; vacancia: ${data.vacantMonths} meses al año. Costos operativos ingresados: ${cop(data.monthlyOperatingCosts)} al mes; deuda: ${cop(data.monthlyDebtPayment)} al mes. Arriendo teórico de 12 meses: ${cop(result.potentialAnnualRent)}; rendimiento antes de gastos: ${result.grossYieldPercent.toFixed(2)} %. Arriendo estimado después de vacancia: ${cop(result.annualIncomeAfterVacancy)}. Ingreso operativo después de gastos y antes de deuda: ${cop(result.operatingNetIncome)}. Flujo anual después de deuda: ${cop(result.annualCashFlow)}. Rendimiento después de gastos operativos: ${result.operatingNetYieldPercent.toFixed(2)} %. Rendimiento anual de caja sobre el capital propio ingresado: ${result.cashOnEquityPercent === null ? 'no calculable porque el capital ingresado es cero' : `${result.cashOnEquityPercent.toFixed(2)} %`}. Este último indicador no incluye valorización, amortización de capital ni precio de reventa.`,
        steps: ['Sustenta el canon con comparables reales de la misma zona y tipo de inmueble.', 'Confirma que gastos mensuales incluyan administración, seguros, impuestos prorrateados, reparaciones y gestión.', 'Prueba más meses vacantes, menor canon y una reparación grande; no uses valorización futura para tapar un flujo negativo.', 'Interpreta el rendimiento de caja sobre tu capital como un indicador parcial, no como ROI total: aquí no se calcula valorización, pago de capital ni precio de salida.', 'Compara el resultado con la liquidez, la concentración y una alternativa de inversión.'],
        missing: 'Costos iniciales de compra, impuestos y obligaciones concretas, fuente del canon, riesgo de vacancia, mantenimiento extraordinario y precio de reventa verificable.',
        confidence: 'Alta únicamente en los cálculos hechos con tus entradas; baja para pronosticar ocupación, valorización, impuestos o facilidad de reventa.',
        sources: MENTOR_SOURCE_MAP.market,
        actions: [{ href: '#herramientas/inversion', label: 'Abrir evaluación de inversión' }, { href: '#herramientas/propiedades', label: 'Comparar inmuebles' }],
      });
    }
    throw new RangeError('Selecciona compra o inversión para revisar el escenario.');
  }

  return Object.freeze({ reply, analyzeScenario });
})();
