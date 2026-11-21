# Configurar Supabase para Mentor Inmobiliario

## 1. Crear la tabla protegida

1. Entra al proyecto Supabase y abre **SQL Editor**.
2. Selecciona **New query**.
3. Abre `supabase-schema.sql` en esta carpeta, copia todo el contenido y pégalo en el editor.
4. Pulsa **Run**. La tabla `public.user_learning_progress` guarda el avance asociado al ID de Auth.
5. En **Authentication > URL Configuration**, agrega la URL de la app a los redirect URLs si usarás confirmación de correo. Para el servidor local agrega `http://127.0.0.1:18765/**` y el puerto alternativo que muestre el lanzador.

Si la API de datos está deshabilitada para el esquema `public`, activa la exposición de esa tabla desde Integrations > Data API en el dashboard. No concedas permisos a `anon`.

La tabla tiene RLS activado. Sus políticas verifican `auth.uid() = user_id` para lectura, creación, actualización y borrado. La app solo usa la publishable key; nunca coloques una `service_role` o secret key en el navegador.

## 2. Configurar la aplicación

El archivo `.env` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Está excluido de Git. El valor `NEXT_PUBLIC_` indica que la publishable key se puede exponer al navegador; nunca pongas aquí una `service_role` o secret key. Si mueves el proyecto a otro computador, copia `.env` de forma privada o pega allí los valores del proyecto.

1. Cierra el servidor si ya está abierto.
2. Abre `ABRIR MENTOR.bat` para iniciar la app.
3. Registra un correo y una contraseña. Si Supabase requiere confirmar el correo, abre el mensaje que envía Supabase y vuelve a iniciar sesión.
4. El botón **Cerrar sesión** termina la sesión. Cada usuario solo puede leer y escribir su propia fila por RLS.

## 3. Qué se guarda

La app sincroniza perfil educativo básico, módulos completados, puntuaciones, intentos, historial de lecciones, logros, diagnóstico, marcadores y notas de casos prácticos. No sincroniza conversaciones con IA ni cifras privadas de ingresos/ahorros o simuladores. Supabase Auth mantiene la sesión en el navegador para que no debas iniciar sesión cada vez; el progreso académico vive en Supabase.

En el primer acceso, si existe progreso antiguo en este navegador, la app preguntará si deseas migrar solo el avance educativo y las notas. Si aceptas, se copia a tu cuenta y se borra el respaldo local de la app. Si ya existe progreso remoto, este no se reemplaza.

## 4. Límites y privacidad

Email/contraseña usa los controles de Supabase Auth. Revisa las opciones de confirmación de email, SMTP y URL permitidas en el dashboard. Para desplegar públicamente, configura HTTPS y los redirect URLs de producción. La publishable key es pública por diseño; RLS es la barrera que impide acceso a filas ajenas.
