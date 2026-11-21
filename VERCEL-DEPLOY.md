# Despliegue en Vercel

El frontend es estático y las rutas `/api/*` usan Vercel Functions para Supabase y Gemini. El servidor `mentor_server.py` se mantiene para el uso local, pero Vercel no lo ejecuta como servidor permanente.

## Variables de entorno

En Vercel > Project > Settings > Environment Variables añade para Production (y Preview si la usarás):

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key.
- `GEMINI_API_KEY`: llave privada Gemini (opcional; nunca uses el prefijo `NEXT_PUBLIC_` para esta llave).
- `GEMINI_MODEL`: opcional; por defecto `gemini-3.5-flash-lite`.

Después de cambiar variables, haz un redeploy. El endpoint de configuración entrega solo la URL y la publishable key. La llave Gemini solo se lee en la función de servidor.

## Supabase Auth

En Supabase > Authentication > URL Configuration define el Site URL como `https://mentor-liart.vercel.app` y añade `https://mentor-liart.vercel.app/**` en Redirect URLs. Conserva también las URL localhost para desarrollo. La tabla `public.user_learning_progress` debe existir con RLS; revisa `supabase-schema.sql` si aún no la ejecutaste.

## IA

En producción cada usuario puede pegar y validar su propia llave en **Mi mentor**. La app la mantiene solo en memoria de la pestaña; al recargar, se ingresa de nuevo. Para validar y consultar, el navegador la envía por HTTPS en un encabezado a `api/configure.py` o `api/mentor.py`, que la reenvía a Google. La app no la guarda en Supabase, almacenamiento del navegador ni archivos, y no la escribe en logs. La persona debe confiar en el sitio de Mentor y proteger su llave; Gemini aplica las cuotas, facturación y términos del proyecto Google dueño de esa llave. `GEMINI_API_KEY` sigue siendo una alternativa global opcional para desarrollo o respaldo. Gemini Search puede requerir facturación/cuota compatible.

## Publicación

Vercel debe desplegar la raíz del repositorio, sin build command ni output directory personalizados. Las funciones de Python se detectan desde `api/`. El `vercel.json` del proyecto deja habilitado el enrutamiento estándar.
