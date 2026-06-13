import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { readFileSync } from 'node:fs';

// The local filesystem API requires a secure context.
// Generate local-only certs with:
// mkdir -p dev-certs
// openssl req -x509 -newkey rsa:2048 -sha256 -days 3650 -nodes -keyout dev-certs/localhost-key.pem -out dev-certs/localhost-cert.pem -subj /CN=localhost -addext subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1
const getJavadocHttps = () => ({
  key: readFileSync(new URL('./dev-certs/localhost-key.pem', import.meta.url)),
  cert: readFileSync(new URL('./dev-certs/localhost-cert.pem', import.meta.url)),
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    {
      name: 'suppress-wasm-warnings',
      configResolved(config) {
        // oxlint-disable-next-line typescript/unbound-method
        const originalWarn = config.logger.warn;
        config.logger.warn = (msg, options) => {
          // Suppress WASM runtime externalization warnings
          if (msg.includes('externalized for browser compatibility') && msg.includes('wasm-runtime.js')) {
            return;
          }
          originalWarn(msg, options);
        };
      },
    },
  ],
  worker: {
    format: 'es',
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/**'],
  },
  server: {
    https: mode === 'javadoc' ? getJavadocHttps() : undefined,
    headers: {
      // E2E tests will fail on WebKit if caching enabled.
      // Only seem to be a problem in localhost.
      // https://predr.ag/blog/debugging-safari-if-at-first-you-succeed/
      'Cache-Control': 'no-store',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "Module externalized for browser compatibility" warnings for WASM runtime files
        if (warning.code === 'MODULE_EXTERNALIZED' && warning.message?.includes('wasm-runtime.js')) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('@xyflow/react') || id.includes('dagre')) {
            return 'inheritance';
          }
          if (id.includes('monaco-editor')) {
            return 'monaco';
          }
        },
      },
    },
  },
}));
