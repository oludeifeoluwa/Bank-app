import { defineConfig } from 'vite';

const proxy = {
  '/api': { target: 'http://127.0.0.1:' + (process.env.HARBORLINE_PORT || 43824) },
};

export default defineConfig({
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy },
  preview: { host: '127.0.0.1', proxy },
});
