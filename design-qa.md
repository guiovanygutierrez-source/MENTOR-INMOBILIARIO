# Revisión visual — Mi aprendizaje

**Resultado: aprobado con observaciones menores.** La pantalla inicial se reorganizó para recomendar el siguiente módulo, ofrecer una ruta de aprendizaje interactiva y dirigir al simulador correspondiente al objetivo del usuario.

## Dirección aplicada

Se conservó la identidad visual existente (paleta verde bosque y marfil, tipografía, marca e ilustración inmobiliaria) y se reforzó la sensación de academia premium con jerarquía editorial más clara. La acción recomendada aparece primero. El mapa de cuatro módulos distingue visualmente lo completado, lo disponible y lo bloqueado; también permite abrir el siguiente módulo y volver al diagnóstico de ruta.

## Evidencia comparativa

Capturas realizadas con Playwright desde la aplicación local. La referencia original usa los archivos de interfaz de `HEAD`; la versión rediseñada usa el código actual. Las capturas muestran datos sintéticos de una persona de prueba; no se usó una cuenta real.

| Vista | Original | Rediseño |
|---|---|---|
| Escritorio, captura completa (viewport 1440 × 1000) | [PNG](output/design-qa/mi-aprendizaje-original-desktop.png) | [PNG](output/design-qa/mi-aprendizaje-redisenado-desktop.png) |
| Móvil, captura completa (viewport 390 × 844) | [PNG](output/design-qa/mi-aprendizaje-original-mobile.png) | [PNG](output/design-qa/mi-aprendizaje-redisenado-mobile.png) |

La vista móvil del rediseño también está guardada como captura de viewport: [PNG](output/design-qa/mi-aprendizaje-redisenado-mobile-viewport.png).

## Criterios revisados

- **Jerarquía y contenido:** el objetivo y el siguiente módulo se entienden al abrir la pantalla; los indicadores de avance quedan inmediatamente debajo.
- **Color, marca e imágenes:** se reutilizan los tokens y la ilustración local existentes; no se incorporaron imágenes remotas ni recursos nuevos.
- **Tipografía y legibilidad:** se conservó el sistema tipográfico. El título del módulo y su descripción dominan la tarjeta; duración y temas se agrupan en una línea secundaria.
- **Espaciado y adaptación:** se revisaron capturas de escritorio y móvil. En 390 px no hay desbordamiento horizontal; el menú lateral queda oculto en reposo.
- **Interacción y estados:** las etapas muestran estado y disponibilidad; el módulo actual abre la lección esperada. Se conservan enlaces a la ruta completa, diagnóstico y simulador.
- **Accesibilidad básica:** el avance tiene semántica de barra de progreso; el módulo actual identifica su estado con `aria-current`; los enlaces mantienen indicadores de foco.

## Ajustes realizados durante QA

Se separó la duración del resumen de la lección para evitar cortes visuales. En una captura inicial, el menú móvil aparecía mientras terminaba su transición; se esperó a que la animación terminara y se confirmó su estado final sin solapamiento. No se observaron errores de consola ni de página en el recorrido verificado.

**Comprobación funcional:** al seleccionar el paso disponible, la app abrió `#leccion/2` y mostró “Leer un mercado inmobiliario local”. También se comprobó la disposición móvil y el ancho del documento.

## Alcance

Este cambio cubre la fase inicial, **Mi aprendizaje**. No modifica la lógica de autenticación, los datos del curso ni la publicación en Vercel. Las capturas y el informe son evidencia local; la publicación requiere desplegar el código actualizado por el flujo habitual del repositorio.

## Fase 2 — Ruta de aprendizaje

Se reorganizó la ruta para mostrar avance y próximo módulo junto con recomendaciones de repaso basadas en respuestas guardadas. Los 10 módulos se presentan como una secuencia desplegable: cada uno muestra objetivos, duración y requisito; los bloqueados se pueden explorar, pero mantienen desactivada la acción de iniciar.

Capturas finales de página completa con datos sintéticos:

- [Escritorio (1440 × 1000)](.impeccable/review/desktop.png)
- [Móvil (390 × 844)](.impeccable/review/mobile.png)

**QA:** Playwright confirmó 10 módulos, el estado vacío de repaso, el botón de repaso abriendo y enfocando el módulo indicado sin alterar `#ruta`, el requisito del módulo bloqueado y la navegación al módulo disponible. No hubo desbordamiento horizontal, errores de consola ni solicitudes fallidas. `node --check` y `git diff --check` pasaron.

El detector automático no encontró avisos nuevos en la ruta. Sus cuatro avisos de `side-tab` están en reglas anteriores de `premium.css` y quedan fuera del alcance de esta fase. La revisión visual independiente concluyó sin hallazgos accionables.
