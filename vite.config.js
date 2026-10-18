import { defineConfig } from 'vite';

export default defineConfig({
  // base './' è OBBLIGATORIO per Capacitor (WebView) e per hosting in sottocartella
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: 'index.html',
        landing: 'landing.html'
      }
    }
  },
  server: {
    port: 5173,
    // OneDrive può causare problemi al file-watcher: usa il polling
    watch: {
      usePolling: true
    }
  }
});
