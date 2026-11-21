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

En producción, la llave no se pega en el formulario local. Configura `GEMINI_API_KEY` en Vercel y redeploy. Las consultas al mentor se ejecutan en `api/mentor.py`; el navegador no recibe la llave. Gemini Search puede requerir facturación/cuota compatible.

## Publicación

Vercel debe desplegar la raíz del repositorio, sin build command ni output directory personalizados. Las funciones de Python se detectan desde `api/`. El `vercel.json` del proyecto deja habilitado el enrutamiento estándar.
