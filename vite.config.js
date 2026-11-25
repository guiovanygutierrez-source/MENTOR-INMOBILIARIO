import { defineConfig } from 'vite';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  appType: 'spa',
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:18765' } },
  preview: { host: '127.0.0.1', port: 4173 },
  plugins: [{ name:'copy-mentor-runtime-assets', closeBundle(){for(const file of ['core.js','lecciones-ampliadas.js','features.js','videos-modulos.js','mentor-engine.js','supabase-auth.js','app.js','styles.css','premium.css']){const source=resolve(file);if(existsSync(source))cpSync(source,resolve('dist',file));}const source=resolve('videos');if(existsSync(source)){mkdirSync(resolve('dist/videos'),{recursive:true});cpSync(source,resolve('dist/videos'),{recursive:true});}} }],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules[\\/]/, minSize: 20_000, maxSize: 400_000 }],
        },
      },
    },
  },
});
