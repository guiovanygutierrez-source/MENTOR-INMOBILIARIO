# Mentor Inmobiliario Colombia

Plataforma educativa responsive en español para aprender a evaluar y comprar vivienda en Colombia. Requiere una cuenta de Supabase para entrar y sincronizar el avance académico. El mentor local siempre está disponible; conectar IA es opcional y requiere una clave propia configurada en el servidor.

## Iniciar

Se necesita Python 3 para el servidor local y Node.js 18 o posterior para ejecutar las pruebas.

```sh
npm start
```

El servidor muestra en consola la dirección local que quedó disponible. Para ejecutar las pruebas:

```sh
npm test
```

## Lo que incluye

- Evaluación de entrada y ruta personalizable según objetivo, horizonte y experiencia.
- Diagnóstico de cinco preguntas con sugerencias para elegir temas de repaso.
- Búsqueda global de módulos, conceptos del glosario y herramientas; guía de uso junto a cada simulador.
- Marcadores para guardar lecciones, notas de casos prácticos y respaldo JSON con opción de restaurar. El respaldo contiene nombre, objetivo de aprendizaje, avance, resultados y notas libres; no incluye ingresos/ahorros, datos de simuladores, créditos registrados ni chat de IA. Revisa las notas antes de compartir el archivo. La restauración valida el formato, pide confirmación y conserva las cifras privadas y datos de simuladores que ya estén guardados en ese dispositivo.
- Diez módulos de unos 15 minutos con cinco temas, objetivos de aprendizaje, diagramas SVG locales, ejemplos colombianos, actividades, notas y una evaluación de dos preguntas. El avance académico se sincroniza en una cuenta Supabase; las cifras y simuladores se quedan en ese navegador.
- Simulador de cuota en pesos, comparación de escenarios de crédito, comparación de propiedades y análisis básico de ingresos de arriendo y flujo de caja.
- Glosario con búsqueda y filtro alfabético.
- “Mi mentor” ofrece reglas locales y Gemini opcional. En la propia página puedes ingresar y validar la llave; solo se conserva en memoria del servidor local, no en JavaScript, el navegador ni archivos. La pregunta y hasta cuatro mensajes previos se envían a Google al activar la IA. La búsqueda web con Google Search tiene una casilla independiente por consulta, muestra enlaces citados y marca los dominios oficiales colombianos `.gov.co`. En Gemini 3.x no está disponible en el nivel Free de la API; en proyectos con facturación, Google incluye 5.000 solicitudes mensuales de búsqueda entre Gemini 3 y modelos posteriores; luego cobra US$14 por cada 1.000 búsquedas, con un límite diario predeterminado de 1.500 solicitudes por proyecto. Una petición puede generar varias búsquedas y cada búsqueda puede contar por separado; verifica la tarifa vigente antes de activarla: https://ai.google.dev/gemini-api/docs/pricing. Si la búsqueda alcanza su cuota o Google no devuelve citas, la app muestra un aviso en vez de presentar afirmaciones de mercado sin verificar. El nivel gratuito de Gemini tiene cuotas sujetas a cambios y Google puede usar el contenido gratuito para mejorar sus productos; evita datos personales.
- Enlaces a entidades oficiales y aviso de vigencia para datos variables. Tasas, subsidios, topes y requisitos requieren confirmación en la fuente oficial al tomar decisiones.
- El pie de página indica que la app no comprueba automáticamente la vigencia del contenido. `FUENTES-REVISION.md` lleva un control editorial de temas y fuentes; sus fechas están marcadas como pendientes hasta que una persona contraste las afirmaciones en las páginas oficiales.

## Arquitectura actual

`index.html` aporta el punto de entrada semántico, `styles.css` y `premium.css` el diseño adaptable, `app.js` gestiona vistas y progreso de la cuenta, `supabase-auth.js` administra Auth y sincronización, `mentor-engine.js` contiene las reglas explícitas del mentor, `core.js` los cálculos reutilizables y `mentor_server.py` el servidor local y endpoint opcional de IA. No hay framework ni paquetes de runtime locales; el cliente oficial `supabase-js` se carga por CDN. El progreso académico se almacena en Supabase y se separa por usuario mediante RLS. La sesión de autenticación queda en el navegador; datos de simuladores y chats no se sincronizan.

## Camino para una versión multiusuario

1. Definir política de privacidad, retención y borrado antes de recoger datos personales o financieros.
2. Mantener RLS y revisar políticas cada vez que se agreguen nuevas tablas expuestas. El avance anterior solo se migra después de una confirmación explícita.
3. La IA opcional se configura desde Mi mentor dentro de la app. La llave se valida con Gemini API y se conserva únicamente en la memoria del servidor local hasta detenerlo. No la guardes en archivos ni la compartas. También puedes preconfigurar `GEMINI_API_KEY` como variable de entorno.
4. Usar tareas de sincronización editorial para enlaces, tasas y programas. Guardar fuente y fecha comprobada, con revisión humana para contenido legal o financiero variable.

La opción de IA queda apagada por defecto. El mentor local funciona sin clave. Al entrar en Mi mentor, puedes pegar y validar tu llave Gemini ahí mismo; la clave permanece en memoria del servidor local hasta detenerlo. La búsqueda web también queda apagada por defecto y se activa por pregunta. Revisa los precios y condiciones de Grounding con Google Search; Gemini 3.x Search no está disponible en el nivel Free; en proyectos con facturación se incluyen 5.000 solicitudes de búsqueda al mes entre Gemini 3 y modelos posteriores; luego cuestan US$14 por cada 1.000 búsquedas, con un límite predeterminado de 1.500 solicitudes diarias por proyecto. Una consulta puede generar varias búsquedas y cada búsqueda puede contar por separado. Confirma la tarifa vigente en https://ai.google.dev/gemini-api/docs/pricing. En el nivel gratuito Google puede usar el contenido para mejorar productos y hay cuotas limitadas. El servidor local escucha solo en `127.0.0.1`; el endpoint de configuración local entrega únicamente URL y publishable key. Sigue sin persistir conversaciones.

## Configurar cuenta y sincronización

Antes del primer uso, ejecuta el SQL de `supabase-schema.sql` una vez en el SQL Editor del proyecto y configura `SUPABASE-SETUP.md`. La app requiere internet para descargar el cliente oficial de Supabase desde CDN. La publishable key puede entregarse al cliente; RLS protege las filas. No copies `.env` al compartir el proyecto: distribuye solo `.env.example` y cada instalación debe crear su propio `.env` con los datos del proyecto. La sesión de acceso queda en el almacenamiento local del navegador; el progreso académico sincronizado queda en Supabase. Cada usuario necesita su propia cuenta.

## Copia de aprendizaje

En **Ruta de aprendizaje**, descarga el respaldo antes de cambiar de navegador o equipo. Para moverlo, lleva el JSON a tu otro equipo y selecciona **Restaurar respaldo**. La app valida la estructura antes de aceptar el archivo y confirma antes de reemplazar el perfil básico, las evaluaciones, notas y marcadores. Los datos de ingresos, ahorros y simuladores quedan en el navegador actual y no se exportan. Los nombres y notas libres sí aparecen en el archivo: revísalos antes de compartirlo.

## Pruebas de interfaz

La suite automatizada comprueba vistas, rutas de aprendizaje, cálculos, respaldo/restauración y reglas CSS para tamaños pequeños. Antes de publicar una versión, sigue también `REVISION-QA.md` en Chrome de escritorio y en un ancho de teléfono; la suite de Node no sustituye una prueba visual en navegador real.
