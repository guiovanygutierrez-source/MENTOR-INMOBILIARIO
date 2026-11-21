/* Supabase Auth. Public publishable key only; database access is constrained by RLS. */
(function () {
  let client = null;
  let user = null;
  let saveTimer = null;
  let saveChain = Promise.resolve();
  let onStateChange = null;

  const ready = (async () => {
    const response = await fetch('/api/supabase-config', { cache: 'no-store' });
    if (!response.ok) throw new Error('No responde el servidor de Mentor. Cierra la ventana del servidor y vuelve a abrir ABRIR MENTOR.bat; entra usando la dirección 127.0.0.1 que muestra esa ventana.');
    const config = await response.json();
    if (!config.url || !config.publishableKey) throw new Error('Completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el archivo .env.');
    if (!window.supabase?.createClient) throw new Error('No se pudo cargar el cliente de Supabase. Revisa tu conexión a internet.');
    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    user = data.session?.user || null;
    let previousUserId = user?.id || null;
    client.auth.onAuthStateChange((_event, session) => {
      user = session?.user || null;
      const nextUserId = user?.id || null;
      if (previousUserId !== nextUserId && onStateChange) {
        previousUserId = nextUserId;
        setTimeout(() => { void onStateChange(user); }, 0);
      }
    });
    return user;
  })();

  async function signIn(email, password) {
    await ready;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    user = data.user;
    return user;
  }

  async function signUp(email, password) {
    await ready;
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    user = data.session?.user || null;
    return { user: data.user, session: data.session };
  }

  async function signOut() {
    await ready;
    const { error } = await client.auth.signOut();
    if (error) throw error;
    user = null;
  }

  async function loadProgress() {
    await ready;
    if (!user) throw new Error('Inicia sesión para cargar tu progreso.');
    const { data, error } = await client.from('user_learning_progress')
      .select('progress').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data?.progress || null;
  }

  async function saveProgress(progress) {
    await ready;
    if (!user) return;
    const payload = { user_id: user.id, progress, updated_at: new Date().toISOString() };
    saveChain = saveChain.catch(() => {}).then(async () => {
      const { error } = await client.from('user_learning_progress').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
    });
    return saveChain;
  }

  function queueSave(progress) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void saveProgress(progress).then(() => window.dispatchEvent(new CustomEvent('mentor-progress-saved')))
        .catch(error => window.dispatchEvent(new CustomEvent('mentor-progress-error', { detail: error.message })));
    }, 350);
  }

  function onChange(callback) { onStateChange = callback; }

  window.MentorAuth = { ready, get user() { return user; }, signIn, signUp, signOut, loadProgress, saveProgress, queueSave, onChange };
})();
