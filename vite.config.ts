import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'match-static-web-app-host',
    configurePreviewServer(server) {
      // Azure consumes this file as deployment metadata and returns 404 for
      // its public URL. Mirror that behavior so offline tests catch attempts
      // to precache it before deployment.
      server.middlewares.use('/staticwebapp.config.json', (_request, response) => {
        response.statusCode = 404;
        response.end('Not found');
      });
    }
  }],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        privacy: resolve(process.cwd(), 'privacy/index.html'),
        terms: resolve(process.cwd(), 'terms/index.html'),
        notFound: resolve(process.cwd(), '404/index.html')
      }
    }
  },
  test: { environment: 'node', include: ['tests/*.test.ts'] }
});
