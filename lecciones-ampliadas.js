/* Contenido ampliado y diagramas educativos locales: sin imágenes remotas ni librerías. */
const LESSON_EXTRAS = {
  1: {
    visual: { alt: 'Diagrama de decisión inmobiliaria: necesidad, inmueble y decisión informada.', caption: 'Una decisión inmobiliaria conecta el uso que necesitas con el inmueble y sus obligaciones.', stages: [['Necesidad', 'Uso y horizonte'], ['Inmueble', 'Estado y derechos'], ['Decisión', 'Costos y riesgos']] },
    sections: [
      ['Propiedad y uso no son lo mismo', 'Ser propietario implica derechos sobre un bien y responsabilidades asociadas; arrendar permite usarlo en las condiciones de un contrato, sin transferir el dominio. Antes de comparar, define si buscas estabilidad, flexibilidad, ingresos de arriendo o una combinación. El mismo apartamento puede ser adecuado para vivir y poco conveniente como inversión.'],
      ['Una ficha para empezar', 'Registra ciudad y barrio, tipo de inmueble, área que necesitas, presupuesto total, fecha deseada y condiciones indispensables. Separa “imprescindible” de “deseable”. Esa ficha te ayudará a comparar alternativas sin dejarte llevar solo por fotografías, acabados o afán.']
    ],
    outcomes: ['Distinguir compra, arriendo e inversión.', 'Nombrar actores que participan en una operación.', 'Definir criterios antes de buscar vivienda.'],
    questions: [{ prompt: 'Antes de buscar, ¿qué ayuda a comparar opciones con criterio?', options: ['Definir uso, presupuesto y necesidades prioritarias.', 'Elegir la primera vivienda con acabados modernos.', 'Suponer que toda inversión produce ingresos desde el primer mes.'], answer: 0, feedback: 'Una ficha de necesidades y límites permite comparar las características, los costos y los riesgos de cada opción.' }]
  },
  2: {
    visual: { alt: 'Diagrama de análisis de mercado: ubicación, propiedades comparables y rango de precios.', caption: 'El rango de referencia gana sentido cuando ubicación, área y características son comparables.', stages: [['Ubicación', 'Mismo entorno'], ['Comparables', 'Misma base de área'], ['Rango', 'Explica diferencias']] },
    sections: [
      ['Construye una comparación útil', 'Anota para cada anuncio la fecha de consulta, ubicación precisa, área privada o construida, precio pedido, edad aproximada, estado, parqueadero y administración. Mantén la misma unidad de área. El precio por metro cuadrado es una referencia descriptiva: no reemplaza un avalúo ni confirma el precio de una transacción.'],
      ['Interpreta las diferencias', 'Si un anuncio se sale mucho del rango, comprueba primero que los datos sean correctos y que el inmueble sea realmente comparable. Una remodelación, una vista, el estado de conservación o una obra cercana pueden explicar parte de la diferencia; otras causas solo se aclaran preguntando y verificando.']
    ],
    outcomes: ['Preparar una tabla de inmuebles comparables.', 'Separar precio pedido de precio transado.', 'Describir factores del barrio que afectan el uso cotidiano.'],
    questions: [{ prompt: 'Dos anuncios reportan precios por metro cuadrado distintos. ¿Qué haces primero?', options: ['Concluir que el más costoso vale más.', 'Verificar que usen la misma clase de área y comparar características y ubicación.', 'Promediarlos aunque correspondan a barrios y tipos de inmueble distintos.'], answer: 1, feedback: 'Una comparación válida controla tipo de área, zona y características; luego investiga por qué aún difieren.' }]
  },
  3: {
    visual: { alt: 'Diagrama de presupuesto de vivienda: ingresos, obligaciones y capacidad disponible.', caption: 'La cuota se analiza dentro del flujo del hogar, con costos y un margen para imprevistos.', stages: [['Ingresos', 'Neto y estable'], ['Obligaciones', 'Gastos y deudas'], ['Capacidad', 'Cuota y reserva']] },
    sections: [
      ['Haz una prueba de resistencia', 'Calcula el presupuesto con cifras mensuales reales y añade un escenario menos favorable: menor ingreso, una reparación o una cuota mayor. Si el plan solo funciona cuando todo sale perfecto, deja más margen, revisa el precio objetivo o espera. Un simulador permite comparar supuestos; no decide cuánto debes endeudarte.'],
      ['Compara la financiación completa', 'Solicita a cada entidad una proyección escrita con monto, plazo, tasa y modalidad en pesos o UVR, sistema de amortización, seguros y cargos asociados. La UVR se actualiza con el IPC; por eso la obligación expresada en UVR puede cambiar en pesos. Compara ofertas con condiciones equivalentes y confirma los términos con la entidad.']
    ],
    outcomes: ['Separar el precio del costo total de compra.', 'Armar un presupuesto mensual con obligaciones y reserva.', 'Comparar ofertas con supuestos equivalentes.'],
    questions: [{ prompt: '¿Qué debes considerar al comparar dos créditos de vivienda?', options: ['Solo la primera cuota anunciada.', 'Monto, plazo, modalidad, tasa, amortización y seguros.', 'El plazo más largo sin revisar el costo total.'], answer: 1, feedback: 'La Superintendencia Financiera recomienda comparar condiciones equivalentes y tener en cuenta seguros y sistema de amortización.' }]
  },
  4: {
    visual: { alt: 'Diagrama para revisar una vivienda: categoría, etapa de entrega y documentos.', caption: 'La categoría, la etapa del proyecto y sus soportes se verifican por separado.', stages: [['Categoría', 'Regla vigente'], ['Etapa', 'Nueva o usada'], ['Soportes', 'Contrato y anexos']] },
    sections: [
      ['Identifica qué significa la etiqueta', 'VIS y VIP son categorías con definición normativa y requisitos que deben revisarse para el periodo, ubicación y operación aplicables. Una etiqueta en el anuncio es una pista, no una certificación. No bases un presupuesto en topes recordados: consulta la fuente oficial y solicita al vendedor los documentos que sustentan la clasificación.'],
      ['Evalúa el momento de entrega', 'En una vivienda usada puedes inspeccionar la unidad y pedir información de su historial; en una vivienda nueva o en construcción debes revisar además el cronograma, las especificaciones, garantías y qué ocurre si hay cambios o retrasos. Compara qué está comprobado hoy y qué sigue siendo una promesa contractual.']
    ],
    outcomes: ['Explicar por qué VIS y VIP requieren verificación vigente.', 'Distinguir riesgos de vivienda usada y sobre planos.', 'Leer oferta, anexos y condiciones de entrega como un conjunto.'],
    questions: [{ prompt: 'Un proyecto se anuncia como VIS. ¿Cómo lo verificas?', options: ['Con el precio que aparece en una publicación antigua.', 'Con la definición vigente y los documentos del proyecto para ese caso.', 'Por el estrato o la apariencia del edificio.'], answer: 1, feedback: 'La categoría no se deduce del estrato ni de un anuncio; confirma las reglas y soportes actuales.' }]
  },
  5: {
    visual: { alt: 'Ruta para revisar una ayuda de vivienda: programa oficial, requisitos y asignación.', caption: 'Solo una asignación confirmada que aplique al caso puede entrar en el presupuesto como recurso disponible.', stages: [['Programa', 'Operador oficial'], ['Requisitos', 'Hogar y vivienda'], ['Asignación', 'Confirmación escrita']] },
    sections: [
      ['Sigue una ruta de verificación', 'Identifica quién administra el programa y lee la página o convocatoria vigente. Confirma fechas, disponibilidad, perfil del hogar, tipo de vivienda, documentos, canal de postulación y compatibilidades. Después pregunta qué evento cuenta como aprobación y cómo se comunica oficialmente. Guarda enlaces y respuestas con fecha.'],
      ['Planea sin contar dos veces el apoyo', 'Construye un presupuesto que cierre sin la ayuda y otro que la incluya solo si fue asignada y se puede aplicar a esa compra. Pregunta a la caja o al operador cómo se coordina con otros recursos y con el crédito. Desconfía de pagos por “cupos garantizados” y verifica los canales directamente.']
    ],
    outcomes: ['Encontrar el operador y la fuente oficial de un programa.', 'Diferenciar interés, postulación, preasignación y asignación.', 'Preparar un escenario financiero sin subsidio pendiente.'],
    questions: [{ prompt: '¿Cuándo puedes tratar una ayuda como dinero disponible?', options: ['Cuando un asesor dice que el hogar probablemente califica.', 'Al enviar los documentos de postulación.', 'Cuando el operador confirma la asignación y su aplicación al caso.'], answer: 2, feedback: 'La postulación no garantiza asignación; confirma el estado y la aplicabilidad con el operador oficial.' }]
  },
  6: {
    visual: { alt: 'Secuencia de adquisición: revisar, acordar condiciones y formalizar la entrega.', caption: 'Avanza por hitos: cada paso debe tener responsables, evidencia y condiciones claras.', stages: [['Revisar', 'Inmueble y partes'], ['Acordar', 'Precio y condiciones'], ['Formalizar', 'Registro y entrega']] },
    sections: [
      ['Asigna una evidencia a cada hito', 'Antes de visitar, define presupuesto y preguntas. Antes de separar, comprueba quién recibe el dinero y qué documento explica su destino y devolución. Antes de firmar, revisa promesa, fechas, financiación, obligaciones y consecuencias de incumplir. Conserva versiones completas y comprobantes, no solo mensajes aislados.'],
      ['Coordina escritura, registro y entrega', 'Confirma con notaría, entidad financiera y profesionales qué documentos, pagos y tiempos exige la operación. Después del otorgamiento, sigue el trámite registral y verifica el resultado. En la entrega compara el estado real con lo pactado, registra medidores, llaves, inventario y pendientes en un acta firmada por las partes.']
    ],
    outcomes: ['Ordenar las etapas desde la búsqueda hasta la entrega.', 'Vincular cada pago con un documento y responsable.', 'Preparar una lista de pendientes para el día de entrega.'],
    questions: [{ prompt: '¿Qué conviene hacer antes de pagar una separación?', options: ['Verificar destinatario, condiciones y documento completo.', 'Pagar a la persona que responda más rápido.', 'Confiar solo en una captura del anuncio.'], answer: 0, feedback: 'La separación puede tener consecuencias; entiende el documento y verifica al beneficiario antes de transferir dinero.' }]
  },
  7: {
    visual: { alt: 'Esquema de debida diligencia: identidad, certificado registral y revisión profesional.', caption: 'El certificado es una fuente importante; la revisión del caso también requiere otros documentos y criterio profesional.', stages: [['Identidad', 'Facultades para vender'], ['Registro', 'Matrícula y actos'], ['Estudio', 'Antecedentes y riesgos']] },
    sections: [
      ['Usa el certificado correctamente', 'El Certificado de Tradición y Libertad muestra inscripciones asociadas al inmueble en su folio de matrícula. Confirma que la matrícula y la identificación correspondan a la unidad que visitas y solicita el documento por el canal oficial. Lee las anotaciones con cuidado: una palabra aislada no explica por sí sola el alcance o vigencia de un acto.'],
      ['Complementa la revisión', 'Pide estudio de títulos y confirma identidad y facultades de quienes intervienen. Según el caso, consulta documentos de propiedad horizontal, paz y salvo, situación fiscal, licencias o autorizaciones. Si aparece una hipoteca, embargo o inconsistencia, no improvises su solución: pide explicación documentada a profesionales independientes antes de avanzar.']
    ],
    outcomes: ['Localizar el canal oficial para consultar el certificado.', 'Distinguir información registral de un estudio jurídico completo.', 'Preparar preguntas para un profesional antes de comprometer dinero.'],
    questions: [{ prompt: '¿Qué demuestra por sí solo un certificado de tradición?', options: ['Que la compra es segura y no requiere más revisión.', 'Las inscripciones que constan en el folio, pero no reemplaza el estudio completo del caso.', 'Que el estado físico del inmueble no tiene problemas.'], answer: 1, feedback: 'La SNR describe el certificado como información sobre la situación jurídica y tradición registral; no es una inspección física ni un estudio integral.' }]
  },
  8: {
    visual: { alt: 'Esquema de inversión inmobiliaria: canon, costos de operación y flujo estimado.', caption: 'La rentabilidad neta exige restar vacancia y gastos; el flujo después de deuda es otra medida.', stages: [['Canon', 'Ingreso posible'], ['Operación', 'Vacancia y gastos'], ['Flujo', 'Antes y después de deuda']] },
    sections: [
      ['Distingue las medidas', 'La rentabilidad bruta relaciona el canon anual teórico con el precio, pero no incluye vacancia ni gastos. La rentabilidad neta operativa descuenta costos operativos y usa ingresos cobrados estimados. El flujo de caja descuenta además pagos de deuda y otros desembolsos. Indica siempre qué conceptos entran en cada fórmula.'],
      ['Prueba un escenario difícil', 'Incluye meses sin arrendatario, reparación, administración, seguros, impuestos que correspondan y costos de compra. Estima cuánto tiempo puedes sostener la propiedad sin ingresos y qué tan fácil sería venderla. Usa cotizaciones y contratos cuando existan; marca lo que solo es un supuesto y revisa el resultado si cambia.']
    ],
    outcomes: ['Calcular una rentabilidad bruta y reconocer sus límites.', 'Separar neto operativo de flujo después de deuda.', 'Probar cómo vacancia y gastos afectan el caso.'],
    questions: [{ prompt: '¿Qué le falta a una rentabilidad bruta por arriendo?', options: ['El precio pedido por el inmueble.', 'Vacancia, costos, impuestos y financiación, según la medida que quieras calcular.', 'El canon mensual multiplicado por los meses del año.'], answer: 1, feedback: 'La rentabilidad bruta omite gastos y riesgos; define la medida y explicita qué costos restas.' }]
  },
  9: {
    visual: { alt: 'Flujo de negociación: recopilar evidencia, acordar condiciones y hacer una oferta clara.', caption: 'Una oferta útil se apoya en comparables, condiciones que puedes cumplir y acuerdos escritos.', stages: [['Evidencia', 'Comparables y estado'], ['Condiciones', 'Fechas y recursos'], ['Oferta', 'Clara y verificable']] },
    sections: [
      ['Prepara tu límite antes de negociar', 'Establece un máximo compatible con tu presupuesto total y una lista de condiciones indispensables: documentos, aprobación de financiación, fecha de entrega o reparaciones acordadas. Explica tu oferta con observaciones comprobables y cotizaciones. No reveles compromisos financieros que no quieras asumir ni aceptes plazos que no puedas cumplir.'],
      ['Reconoce señales para pausar', 'Presión para consignar de inmediato, destinatarios distintos de quienes firman, documentos incompletos o negativa a una revisión independiente son motivos para detenerte y verificar. Confirma identidad y titularidad mediante canales separados del anuncio. Los acuerdos sobre dinero, arras o devolución deben quedar claros en el documento correspondiente.']
    ],
    outcomes: ['Respaldar una oferta con comparables y observaciones verificables.', 'Definir precio máximo, condiciones y vigencia.', 'Detectar señales que exigen pausar y verificar.'],
    questions: [{ prompt: 'Te piden consignar hoy a una persona que no aparece en el documento. ¿Qué haces?', options: ['Pagar poco para reservar y revisar después.', 'Detener el pago y verificar identidad, destinatario y acuerdo por canales independientes.', 'Enviar tus documentos personales para que te den más tiempo.'], answer: 1, feedback: 'La prisa y un tercero no explicado exigen verificación antes de transferir dinero o compartir documentos.' }]
  },
  10: {
    visual: { alt: 'Plan de decisión final: presupuesto, verificación y decisión con pendientes explícitos.', caption: 'Una decisión informada puede ser comprar, renegociar o esperar hasta resolver condiciones críticas.', stages: [['Presupuesto', 'Escenarios sostenibles'], ['Verificación', 'Mercado y documentos'], ['Decisión', 'Avanzar o esperar']] },
    sections: [
      ['Arma un expediente breve', 'Reúne presupuesto total, simulaciones con supuestos, comparables y sus fuentes, documentos recibidos, preguntas pendientes y cotizaciones de costos. Anota la fecha de cada dato y quién lo confirmó. Así podrás distinguir evidencia reciente de cifras aproximadas o conversaciones que aún no se han convertido en compromisos.'],
      ['Decide con condiciones explícitas', 'Escribe qué tendría que cumplirse para avanzar, qué riesgo no aceptarías y quién revisará los documentos. Si no hay claridad sobre financiación, título, beneficiario de pagos o condiciones contractuales, aplazar es una opción válida. Actualiza la comparación si cambia el precio, el plazo, la tasa o la fecha de entrega.']
    ],
    outcomes: ['Integrar presupuesto, comparables y debida diligencia.', 'Separar hechos, estimaciones y pendientes.', 'Justificar por qué comprar, renegociar o esperar.'],
    questions: [{ prompt: '¿Cuál es una conclusión válida para tu expediente final?', options: ['Comprar para evitar que los precios cambien.', 'Avanzar, renegociar o esperar según evidencias, presupuesto y riesgos pendientes.', 'Tomar como confirmados los datos que el vendedor aún no documenta.'], answer: 1, feedback: 'La decisión debe reflejar evidencias y límites; esperar puede ser razonable si faltan verificaciones críticas.' }]
  }
};

function lessonVisual(visual) {
  const nodes = visual.stages.map((stage, index) => {
    const x = 40 + index * 306;
    return `<g><rect x="${x}" y="34" width="268" height="150" rx="18" fill="${index === 1 ? '#e9efe6' : '#ffffff'}" stroke="#dce5db"/><circle cx="${x + 34}" cy="70" r="20" fill="${index === 1 ? '#315c49' : '#e8efe9'}"/><text x="${x + 34}" y="77" text-anchor="middle" font-size="20" font-weight="700" fill="${index === 1 ? '#ffffff' : '#315c49'}">${index + 1}</text><text x="${x + 62}" y="75" font-size="30" font-weight="700" fill="#17372e">${esc(stage[0])}</text><path d="M${x + 24} 105H${x + 244}" stroke="#e9e9e2"/><text x="${x + 24}" y="139" font-size="20" fill="#66796e">${esc(stage[1])}</text></g>${index < 2 ? `<path d="M${x + 276} 109h22m-8-8 8 8-8 8" fill="none" stroke="#93aa94" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;
  }).join('');
  return `<figure class="lesson-visual"><svg viewBox="0 0 940 218" role="img" aria-label="${esc(visual.alt)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="940" height="218" rx="24" fill="#f5f6f0"/>${nodes}</svg><figcaption>${esc(visual.caption)}</figcaption></figure>`;
}
