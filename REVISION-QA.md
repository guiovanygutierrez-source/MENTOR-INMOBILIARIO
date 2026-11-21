# Recorrido manual de calidad

Ejecuta este recorrido en un perfil de navegador de prueba o antes de crear progreso real, porque aprobar una lección guarda el avance en ese navegador.

## Escritorio

- Abrir la dirección que muestra `iniciar.py`; confirmar que el título dice **Mentor Inmobiliario Colombia**.
- Revisar que la portada incluya la escena isométrica y que el contenido no quede detrás del arte.
- Entrar a **Ruta de aprendizaje**; comprobar diez módulos, candados secuenciales y controles de respaldo.
- Abrir el módulo 1; revisar navegación por secciones, notas y evaluación. En el perfil de prueba, aprobar y confirmar el desbloqueo del módulo 2.
- Entrar a **Herramientas**; cambiar entre compra, créditos, propiedades e inversión. Revisar resultados con cifras ficticias.
- Revisar **Glosario**, búsqueda global y **Mi mentor**. No activar IA ni búsqueda web como parte de una prueba visual ordinaria; las consultas envían contexto a Google y la búsqueda puede tener costo.

## Teléfono

Usar Chrome DevTools Responsive Design Mode con 390 px y 320 px de ancho:

- Abrir y cerrar el menú con ratón, teclado y botón accesible; revisar `aria-expanded`.
- Comprobar que la portada, la ilustración, tarjetas, pestañas, avisos y botones no produzcan desplazamiento horizontal.
- Verificar campos de al menos 44 px de alto, texto legible y controles alcanzables por teclado.
- Recorrer lección, simuladores, glosario y mentor; confirmar que columnas apiladas y mensajes largos sigan legibles.
- Activar la preferencia del sistema para reducir movimiento y comprobar que la ilustración deja de flotar.

## Respaldo y restauración

- En un perfil de prueba, registrar avance, marcador y una nota ficticia; descargar el respaldo JSON.
- Confirmar que contiene nombre/objetivo, avance, resultados, notas y marcadores; que excluye ingresos, ahorros, créditos/propiedades de simulador y conversación.
- Intentar restaurar un archivo que no sea JSON de la app y verificar el rechazo sin cambios.
- Restaurar el archivo válido y comprobar la confirmación, el mensaje de éxito y la recuperación de progreso.
- Si ya existían datos privados en ese navegador, confirmar que ingresos/ahorros y simuladores locales se conservan.
