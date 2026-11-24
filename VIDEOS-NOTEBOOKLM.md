# Videos de aprendizaje — Mentor Inmobiliario Colombia

Guía para crear una cápsula explicativa por módulo en el cuaderno **MENTOR BIENES RAÍCES**.

## Formato común

Genera un video explicativo en español latinoamericano, de 3 a 5 minutos, dirigido a personas que empiezan a aprender sobre vivienda en Colombia. Usa únicamente la fuente correspondiente al módulo. Explica una idea a la vez, con un ejemplo sencillo, ilustraciones de apoyo y poco texto en pantalla. Mantén la identidad visual de Mentor: fondo marfil, verde bosque, verde azulado y acentos coral o amarillo; escenas cálidas, mapas simples y pequeños modelos 3D de viviendas. Cierra con una idea clave y una pregunta de reflexión.

No inventes cifras, normas, tasas, fechas, requisitos ni garantías. Si un dato depende de la ciudad, entidad o vigencia, indícalo y señala qué fuente oficial consultar. No presentes el contenido como asesoría legal, financiera ni inmobiliaria individual.

## Módulo 1 · Introducción al sector inmobiliario

**Título sugerido:** Entender el mundo inmobiliario

**Instrucción para NotebookLM:** Explica qué comprende el sector inmobiliario y presenta a sus actores: compradores, vendedores, agentes, constructoras, entidades de financiación, notarios, registro, avaluadores y autoridades. Distingue comprar para vivir, arrendar e invertir. Usa el ejemplo de un apartamento usado y muestra cómo cambian las preguntas según el propósito. Cierra preguntando: ¿qué objetivo tendría tu primera vivienda?

## Módulo 2 · Mercado inmobiliario colombiano

**Título sugerido:** Cómo leer un mercado local

**Instrucción para NotebookLM:** Explica oferta, demanda y diferencia entre precio publicado y precio de cierre. Enseña a comparar viviendas de la misma zona usando la misma base de área y características equivalentes. Aclara que el estrato no mide calidad, seguridad ni rentabilidad. Usa una comparación visual de dos apartamentos y cierra con una pregunta sobre qué dato adicional pedirías.

## Módulo 3 · Finanzas para comprar vivienda

**Título sugerido:** ¿Cuánto puedes destinar a vivienda?

**Instrucción para NotebookLM:** Presenta un presupuesto completo: ingresos netos, gastos, deudas, ahorro, fondo de emergencia, cuota inicial, financiación, seguros y costos de adquisición. Explica que una cuota simulada no es una aprobación bancaria ni una recomendación universal. Ilustra un flujo mensual con cifras ficticias claramente identificadas y cierra preguntando qué gasto suele olvidarse al calcular el presupuesto.

## Módulo 4 · Tipos de vivienda en Colombia

**Título sugerido:** VIS, VIP, nueva, usada y sobre planos

**Instrucción para NotebookLM:** Diferencia VIS, VIP y No VIS con lenguaje sencillo; explica que VIP es una modalidad dentro de VIS y que una categoría no garantiza un subsidio. Compara vivienda nueva, usada y sobre planos según qué se puede verificar, cuándo se entrega y qué riesgos revisar. Advierte que los topes y reglas deben confirmarse en fuentes oficiales vigentes.

## Módulo 5 · Subsidios y beneficios

**Título sugerido:** Verifica un subsidio antes de contarlo

**Instrucción para NotebookLM:** Enseña a verificar quién administra la ayuda, si existe convocatoria vigente, disponibilidad, requisitos, compatibilidades y canal de postulación. Distingue una postulación de una asignación confirmada. Recomienda consultar directamente con el operador oficial y desconfiar de pagos por supuestos cupos. Evita afirmar que un programa está abierto o cerrado si la fuente no lo confirma actualmente.

## Módulo 6 · Proceso de adquisición

**Título sugerido:** De la búsqueda a la entrega

**Instrucción para NotebookLM:** Recorre las etapas de una compra: definir necesidades y presupuesto, buscar y comparar, visitar, verificar documentos y estado físico, negociar, revisar la promesa, organizar financiación, escriturar, registrar y recibir. Usa una línea de tiempo y destaca que las condiciones deben revisarse antes de entregar dinero o firmar.

## Módulo 7 · Aspectos legales

**Título sugerido:** Documentos que conviene verificar

**Instrucción para NotebookLM:** Explica para qué sirven el certificado de tradición y libertad actualizado, el estudio de títulos, la identificación del titular, la promesa de compraventa y la escritura. Incluye propiedad horizontal y autorizaciones cuando aplique. Presenta una lista visual de verificación y recomienda apoyo profesional para el caso concreto. No concluyas que un inmueble está jurídicamente saneado solo por revisar una lista.

## Módulo 8 · Inversión inmobiliaria

**Título sugerido:** Evalúa una inversión más allá del canon

**Instrucción para NotebookLM:** Distingue ingreso bruto, gastos, vacancia, mantenimiento, administración, seguros, impuestos y flujo neto. Explica que rentabilidad estimada no equivale a ganancia garantizada y que el resultado depende de supuestos, zona y tipo de arriendo. Usa un ejemplo hipotético sin presentarlo como dato de mercado; invita a probar escenarios desfavorables.

## Módulo 9 · Negociación y análisis

**Título sugerido:** Negocia con evidencia y cautela

**Instrucción para NotebookLM:** Enseña a comparar inmuebles semejantes, definir un tope de compra, formular preguntas durante la visita y verificar identidad, titularidad, destinatario y condiciones antes de pagar. Ilustra señales de alerta como presión para consignar de inmediato o transferir a terceros. Cierra con un guion breve de preguntas para una visita.

## Módulo 10 · Proyecto final

**Título sugerido:** Tu plan de compra informado

**Instrucción para NotebookLM:** Integra presupuesto y reserva, alternativas comparables, financiación, costos de cierre, verificación documental, riesgos y condiciones pendientes. Presenta un expediente de decisión sencillo con evidencia y supuestos. Recuérdale al estudiante que esperar también puede ser una decisión responsable si faltan condiciones críticas.

## Integración en la app

Cada lección muestra un reproductor MP4 en la propia página después de la introducción. El módulo 7 incluye además el video complementario «Cómo verificar una vivienda antes de comprar». Los controles permiten reproducir, pausar, cambiar volumen y pantalla completa.

Los once archivos MP4 están en la carpeta local `videos/`, excluida de Git por su tamaño (aprox. 319 MB). La app local los reproduce desde allí. El sitio desplegado recurre automáticamente a un bucket público `mentor-videos` en Supabase Storage, para que los MP4 no tengan que incluirse en la carga de Vercel.

### Habilitar reproducción en Vercel

1. En Supabase, abre **Storage** y crea un bucket público llamado `mentor-videos`.
2. Sube allí los once MP4 que están en la carpeta `videos/`. Conserva exactamente los nombres de archivo.
3. Espera a que termine la carga. La app publicada detectará que no tiene el archivo local y reproducirá la copia pública de Supabase.

El bucket es público para que las personas que usan la app puedan ver las cápsulas sin iniciar sesión en Supabase. No subas allí información privada. Los archivos fuente locales no se envían a GitHub; actualiza la copia del bucket al reemplazar un video. Los nombres y títulos están en `videos-modulos.js`.
